
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
      setMessages(data as RoleplayMessage[]);
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

      let audioContext: AudioContext | null = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      let silenceCounter = 0;
      const silenceThreshold = 50;
      let voiceDetected = false;
      let isChecking = true;

      const checkAudio = () => {
        if (!isChecking || !audioContext) return;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

        if (average > 25) {
          voiceDetected = true;
          silenceCounter = 0;
        } else if (voiceDetected) {
          silenceCounter++;
          if (silenceCounter > silenceThreshold) {
            isChecking = false;
            stopRecording();
            source.disconnect();
            analyser.disconnect();
            audioContext.close();
            audioContext = null;
            return;
          }
        }
        
        requestAnimationFrame(checkAudio);
      };

      checkAudio();

      mediaRecorder.onstop = async () => {
        if (chunksRef.current.length === 0) {
          console.log('No audio data recorded');
          startRecording();
          return;
        }

        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const base64Audio = reader.result?.toString().split(',')[1];
            if (!base64Audio) return;

            try {
              console.log('Converting speech to text...');
              const { data: speechData, error: speechError } = await supabase.functions.invoke('handle-speech', {
                body: { 
                  audio: base64Audio, 
                  type: 'speech-to-text'
                }
              });

              if (speechError) throw speechError;
              if (!speechData?.text) throw new Error('No text transcribed');

              console.log('Speech converted to text:', speechData.text);

              const { data: aiData, error: aiError } = await supabase.functions.invoke('handle-speech', {
                body: { 
                  text: speechData.text, 
                  type: 'text-to-speech',
                  voiceId: session?.avatar_voice_id,
                  sessionId: session?.id,
                  context: {
                    avatar_id: session?.avatar_id,
                    roleplay_type: session?.roleplay_type,
                    scenario_description: session?.scenario_description
                  }
                }
              });

              if (aiError) throw aiError;
              if (!aiData?.response) throw new Error('No AI response received');

              console.log('Received AI response:', aiData.response);
              await loadMessages();
              await speakText(aiData.response);
            } catch (error) {
              console.error('Error processing audio:', error);
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
          };

          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Error processing audio blob:', error);
          if (!isSpeaking) {
            startRecording();
          }
        }
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      console.log('Stopped recording');
    }
  };

  const speakText = async (text: string) => {
    if (isSpeaking) return;
    
    try {
      setIsSpeaking(true);
      console.log('Converting text to speech:', text);
      
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
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          startRecording();
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          startRecording();
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
      startRecording();
    }
  };

  const handleEndCall = () => {
    stopRecording();
    setIsSpeaking(false);
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
