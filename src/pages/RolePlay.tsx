
import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { PhoneOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RoleplaySession, RoleplayMessage } from "@/lib/types";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";

const RolePlay = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = location.state?.session as RoleplaySession;
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!session) {
      navigate('/dashboard');
      return;
    }
    startRecording();
  }, [session]);

  const loadMessages = async () => {
    if (!session) return;

    const { data, error } = await supabase
      .from('roleplay_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      const typedMessages: RoleplayMessage[] = data.map(msg => ({
        id: msg.id,
        session_id: msg.session_id,
        role: msg.role as 'user' | 'ai',
        content: msg.content,
        created_at: msg.created_at
      }));
      setMessages(typedMessages);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !session) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-speech', {
        body: { 
          text, 
          type: 'text-to-speech',
          voiceId: session?.avatar_voice_id,
          sessionId: session.id,
          context: {
            avatar_id: session.avatar_id,
            roleplay_type: session.roleplay_type,
            scenario_description: session.scenario_description
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      await loadMessages();
      
      if (data.response) {
        await speakText(data.response);
        // Restart recording after AI finishes speaking
        startRecording();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
      // Restart recording even if there's an error
      startRecording();
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    if (isRecording || isSpeaking) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      // Set up voice activity detection
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      let silenceStart: number | null = null;
      const silenceThreshold = 1500; // 1.5 seconds
      let speaking = false;

      const checkAudio = () => {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (average > 15) { // Voice detected
          speaking = true;
          silenceStart = null;
        } else if (speaking) { // Silence after speaking
          const currentTime = Date.now();
          if (!silenceStart) {
            silenceStart = currentTime;
          } else if (currentTime - silenceStart > silenceThreshold) {
            // Stop recording after silence threshold
            stopRecording();
            source.disconnect();
            analyser.disconnect();
            audioContext.close();
            return;
          }
        }
        
        if (!isSpeaking) {
          requestAnimationFrame(checkAudio);
        }
      };

      checkAudio();

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio) {
            try {
              const { data, error } = await supabase.functions.invoke('handle-speech', {
                body: { 
                  audio: base64Audio, 
                  type: 'speech-to-text',
                  sessionId: session?.id,
                  context: session ? {
                    avatar_id: session.avatar_id,
                    roleplay_type: session.roleplay_type,
                    scenario_description: session.scenario_description
                  } : undefined
                }
              });

              if (error) throw error;
              if (data.text && data.response) {
                console.log('Transcribed text:', data.text);
                console.log('AI response:', data.response);
                await speakText(data.response);
              }
            } catch (error) {
              console.error('Error processing speech:', error);
              toast({
                title: "Error",
                description: "Failed to process speech",
                variant: "destructive",
              });
            } finally {
              if (!isSpeaking) {
                startRecording();
              }
            }
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log('Started recording');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const speakText = async (text: string) => {
    if (isSpeaking) return;
    
    try {
      setIsSpeaking(true);
      const { data, error } = await supabase.functions.invoke('handle-speech', {
        body: { 
          text, 
          type: 'text-to-speech',
          voiceId: session?.avatar_voice_id
        }
      });

      if (error) throw error;

      if (data.audioContent) {
        const binaryString = atob(data.audioContent);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      }
    } catch (error) {
      console.error('Error converting text to speech:', error);
      toast({
        title: "Error",
        description: "Failed to convert text to speech",
        variant: "destructive",
      });
      setIsSpeaking(false);
    }
  };

  const handleEndCall = () => {
    // Stop any ongoing recording or playback
    if (isRecording) {
      stopRecording();
    }
    if (isSpeaking) {
      setIsSpeaking(false);
    }
    
    // Navigate back to dashboard
    navigate('/dashboard');
    
    toast({
      title: "Call Ended",
      description: "Your conversation has been saved.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 sm:p-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="mr-2 sm:mr-4"
                size={isMobile ? "sm" : "default"}
              >
                ← Back
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Call with {session?.avatar_id}</h1>
            </div>
            <Button
              onClick={handleEndCall}
              variant="destructive"
              size={isMobile ? "sm" : "default"}
              className="bg-red-500 hover:bg-red-600"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          <div className="flex justify-center items-center h-[60vh]">
            <div className="text-center">
              <Avatar className="w-48 h-48 sm:w-64 sm:h-64 mx-auto mb-8">
                <AvatarImage 
                  src={session?.avatar_id ? supabase.storage
                    .from('avatars')
                    .getPublicUrl(`${session.avatar_id}.jpg`).data.publicUrl : ''}
                />
              </Avatar>
              <div className="text-lg text-gray-600">
                {isRecording ? "Listening..." : isSpeaking ? "Speaking..." : "..."}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RolePlay;
