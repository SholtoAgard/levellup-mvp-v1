
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMediaRecorderMimeType } from '@/utils/audioProcessing';

export const useAudioRecording = () => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const setupAudioContext = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const mimeType = getMediaRecorderMimeType();
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      return mediaRecorder;
    } catch (error) {
      console.error("Error setting up audio:", error);
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isListening) return;

    try {
      chunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [isListening, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  }, []);

  return {
    isListening,
    setIsListening,
    mediaRecorderRef,
    chunksRef,
    analyserRef,
    setupAudioContext,
    startRecording,
    stopRecording,
    cleanup
  };
};
