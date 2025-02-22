import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Send, Mic, StopCircle, Volume2, Award, Phone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RoleplaySession, RoleplayMessage } from "@/lib/types";
import Footer from "@/components/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { CallScreen } from "@/components/CallScreen";
const CallSession = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const session = location.state?.session as RoleplaySession;
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isMobile = useIsMobile();
  const [showCallScreen, setShowCallScreen] = useState(false);
  const audioRef = useRef(null);
  useEffect(() => {
    if (!session) {
      navigate("/dashboard");
      return;
    }
    loadMessages();
    // Update the document title when the component mounts
    document.title = "Call Session";
  }, [session]);
  const loadMessages = async () => {
    if (!session) return;
    const {
      data,
      error
    } = await supabase.from("roleplay_messages").select("*").eq("session_id", session.id).order("created_at", {
      ascending: true
    });
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
      return;
    }
    if (data) {
      const typedMessages: RoleplayMessage[] = data.map(msg => ({
        id: msg.id,
        session_id: msg.session_id,
        role: msg.role as "user" | "ai",
        content: msg.content,
        created_at: msg.created_at
      }));
      setMessages(typedMessages);
    }
  };
  const sendMessage = async (text?: string) => {
    if (!text && !newMessage.trim() || !session) return;
    setIsLoading(true);
    try {
      const messageToSend = text || newMessage;
      const {
        data,
        error
      } = await supabase.functions.invoke("handle-roleplay", {
        body: {
          sessionId: session.id,
          message: messageToSend,
          context: session.status === "in_progress" ? {
            avatar_id: session.avatar_id,
            roleplay_type: session.roleplay_type,
            scenario_description: session.scenario_description
          } : undefined
        }
      });
      if (error) throw error;
      setNewMessage("");
      await loadMessages();
      if (data.response) {
        await speakText(data.response);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm"
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, {
          type: "audio/webm"
        });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(",")[1];
          if (base64Audio) {
            try {
              const {
                data,
                error
              } = await supabase.functions.invoke("handle-speech", {
                body: {
                  audio: base64Audio,
                  type: "speech-to-text"
                }
              });
              if (error) throw error;
              if (data.text) {
                setNewMessage(data.text);
                await sendMessage(data.text);
              }
            } catch (error) {
              console.error("Error converting speech to text:", error);
              toast({
                title: "Error",
                description: "Failed to convert speech to text",
                variant: "destructive"
              });
            }
          }
        };
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive"
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
      const {
        data,
        error
      } = await supabase.functions.invoke("handle-speech", {
        body: {
          text,
          type: "text-to-speech",
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
        const audioBlob = new Blob([bytes], {
          type: "audio/mp3"
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = e => {
          console.error("Audio playback error:", e);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      }
    } catch (error) {
      console.error("Error converting text to speech:", error);
      toast({
        title: "Error",
        description: "Failed to convert text to speech",
        variant: "destructive"
      });
      setIsSpeaking(false);
    }
  };
  const handleGetScore = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke("handle-roleplay", {
        body: {
          sessionId: session.id,
          requestScoring: true
        }
      });
      if (error) throw error;
      navigate(`/feedback/${session.id}`);
    } catch (error) {
      console.error("Error getting score:", error);
      toast({
        title: "Error",
        description: "Failed to generate feedback",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleBackClick = () => {
    if (audioRef?.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset audio position
    }
    if (mediaRecorderRef?.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    navigate("/dashboard");
  };
  if (showCallScreen && session) {
    if (audioRef?.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset audio position
    }
    if (mediaRecorderRef?.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    return <CallScreen session={session} />;
  }
  return <div className="min-h-screen flex flex-col">
      <div className="p-4 sm:p-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4 sm:mb-8 flex-wrap gap-4">
            <div className="flex items-center">
              <Button variant="ghost" onClick={handleBackClick} className="mr-2 sm:mr-4" size={isMobile ? "sm" : "default"}>
                ← Back
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Role Play Session</h1>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center">
            {session?.avatar_id && <div className="max-w-sm text-center bg-gray-50 p-4 rounded-lg">
                <Avatar className="w-32 h-32 sm:w-48 sm:h-48 mx-auto mb-4">
                  <AvatarImage src={supabase.storage.from("avatars").getPublicUrl(`${session.avatar_id}.jpg`).data.publicUrl} />
                </Avatar>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">
                  {session.avatar_id}
                </h2>
                <p className="text-sm text-gray-600">
                  {session.roleplay_type}
                </p>
                <Button onClick={() => setShowCallScreen(true)} className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white">
                  <Phone className="w-4 h-4 mr-2" />
                  Start Voice Call
                </Button>
              </div>}
          </div>
        </div>
      </div>
      <Footer />
    </div>;
};
export default CallSession;