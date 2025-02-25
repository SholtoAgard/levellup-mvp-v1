
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { base64ToAudio } from '@/utils/audioProcessing';

export const useVoiceResponse = () => {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakResponse = useCallback(async (text: string, voiceId: string | undefined) => {
    try {
      setIsSpeaking(true);

      const { data, error } = await supabase.functions.invoke("handle-speech", {
        body: {
          text,
          type: "text-to-speech",
          voiceId,
        },
      });

      if (error) throw error;

      if (!data?.audioContent) {
        throw new Error("No audio content received");
      }

      const bytes = base64ToAudio(data.audioContent);
      const audioBlob = new Blob([bytes], { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      return new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => {
          audio.play().catch(reject);
        };

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          reject(new Error("Audio playback error"));
        };
      });
    } catch (error) {
      console.error("Error in speaking response:", error);
      setIsSpeaking(false);
      toast({
        title: "Error",
        description: "Failed to speak response. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  return {
    isSpeaking,
    setIsSpeaking,
    audioRef,
    speakResponse,
    cleanup
  };
};
