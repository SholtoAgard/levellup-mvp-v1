import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RoleplaySession } from "@/lib/types";
import { loadFFmpeg, processAudioData } from "@/utils/audioHandling";
import { AvatarDisplay } from "./roleplay/AvatarDisplay";
import { CallControls } from "./roleplay/CallControls";
import { ScoringLoader } from "./roleplay/ScoringLoader";

interface CallScreenProps {
  session: RoleplaySession;
}

let mediaRecorder: MediaRecorder;

export const CallScreen: React.FC<CallScreenProps> = ({ session }) => {
  const [isListening, setIsListening] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [endVoiceCall, setEndVoiceCall] = useState(false);
  const [showScoreButton, setShowScoreButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingScore, setIsGettingScore] = useState(false);

  const isSpeakingRef = useRef(isSpeaking);
  const isThinkingRef = useRef(isThinking);
  const isListeningRef = useRef(isListening);
  const isEndCallRef = useRef(endVoiceCall);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingAudioRef = useRef(false);
  const ffmpegRef = useRef<any>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isEndCallRef.current = endVoiceCall;
  }, [endVoiceCall]);

  useEffect(() => {
    startCall();
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    const scoreButtonTimer = setTimeout(() => {
      setShowScoreButton(true);
      toast({
        title: "Score Available",
        description: "You can now get feedback on your conversation!",
      });
    }, 60000);

    return () => {
      clearInterval(timer);
      clearTimeout(scoreButtonTimer);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const handleGetScore = async () => {
    try {
      setIsGettingScore(true);
      setIsLoading(true);
      setEndVoiceCall(true);
      setIsThinking(false);
      setIsSpeaking(false);
      setIsListening(false);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
        mediaRecorderRef.current = null;
      }
      window.speechSynthesis.cancel();

      const { data, error } = await supabase.functions.invoke("handle-roleplay", {
        body: {
          sessionId: session.id,
          requestScoring: true,
          context: {
            avatar_id: session.avatar_id,
            roleplay_type: session.roleplay_type,
            scenario_description: session.scenario_description,
          },
        },
      });

      if (error) throw error;

      await supabase
        .from("roleplay_sessions")
        .update({
          status: "completed",
          score: data.score,
          feedback: data.feedback
        })
        .eq("id", session.id);

      navigate("/call-score", {
        state: {
          avatarId: session.avatar_id,
          roleplayType: session.roleplay_type,
          score: data.score || 0,
          strengths: data.strengths || [],
          improvements: data.improvements || [],
        }
      });
    } catch (error) {
      console.error("Error getting score:", error);
      toast({
        title: "Error",
        description: "Failed to get conversation score. Please try again.",
        variant: "destructive",
      });
      setIsGettingScore(false);
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = () => {
    setEndVoiceCall(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    window.speechSynthesis.cancel();
    navigate(-1);
  };

  const startCall = async () => {
    try {
      ffmpegRef.current = await loadFFmpeg();
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

      let mimeType = "audio/webm";
      let isSupported = MediaRecorder.isTypeSupported(mimeType);

      if (!isSupported) {
        mimeType = "audio/mp4";
        isSupported = MediaRecorder.isTypeSupported(mimeType);
      }

      if (!isSupported) {
        mimeType = "audio/wav";
        isSupported = MediaRecorder.isTypeSupported(mimeType);
      }

      if (!isSupported) {
        throw new Error("No supported audio MIME type found");
      }

      console.log("Using MIME type:", mimeType);

      mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (!isEndCallRef.current && chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = []; // Clear chunks for next recording
          
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Audio = reader.result?.toString().split(',')[1];
              if (base64Audio) {
                await handleSpeech(base64Audio, mimeType);
              }
            };
            reader.readAsDataURL(audioBlob);
          } catch (error) {
            console.error("Error processing audio:", error);
            setIsThinking(false);
            startRecording();
          }
        } else {
          if (!isSpeakingRef.current && !isThinkingRef.current) {
            startRecording();
          }
        }
      };

      startRecording();
      detectVolume();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  let speechDetected = false;

  const detectVolume = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let silenceCounter = 0;
    const minDb = -22;
    const speechThreshold = -13;
    let isSilent = false;

    const checkVolume = () => {
      if (!analyserRef.current || !mediaRecorderRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const db = 20 * Math.log10(average / 255);

      if (db > speechThreshold) {
        console.log("Speech detected");
        speechDetected = true;
        silenceCounter = 0;
        isSilent = false;
      } else if (db < minDb) {
        silenceCounter++;
        if (
          silenceCounter > 300 &&
          !isSilent &&
          speechDetected &&
          mediaRecorderRef.current.state === "recording"
        ) {
          if (!isThinkingRef.current && !isSpeakingRef.current) {
            console.log("Silence detected, stopping recording");
            setIsListening(false);
            setIsThinking(true);
            isSilent = true;
            mediaRecorderRef.current.stop();
            silenceCounter = 0;
            speechDetected = false;
          }
        }
      }

      requestAnimationFrame(checkVolume);
    };

    checkVolume();
  };

  const startRecording = () => {
    console.log("in the start recording function");
    mediaRecorderRef.current = mediaRecorder;

    console.log("MediaRecorder state:", mediaRecorderRef.current?.state);
    console.log("Is speaking:", isSpeaking);
    console.log("Is thinking:", isThinking);

    if (!mediaRecorderRef.current || isSpeaking || isThinking) return;

    try {
      console.log("Starting new recording");
      chunksRef.current = [];
      mediaRecorderRef.current.start();
      console.log("Recording started");
      setIsListening(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Failed to start recording. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  };

  const handleSpeech = async (base64Audio: string, mimeType: string) => {
    setIsThinking(true);
    try {
      const { data: speechData, error: speechError } = await supabase.functions.invoke("handle-speech", {
        body: {
          audio: base64Audio,
          type: "speech-to-text",
        },
      });

      if (speechError) throw speechError;

      if (!speechData.text) {
        console.log("No speech detected");
        setIsThinking(false);
        startRecording();
        return;
      }

      console.log("Speech detected:", speechData.text);

      const { data: roleplayData, error: roleplayError } = await supabase.functions.invoke("handle-roleplay", {
        body: {
          sessionId: session.id,
          message: speechData.text,
          context: {
            avatar_id: session.avatar_id,
            roleplay_type: session.roleplay_type,
            scenario_description: session.scenario_description,
          },
        },
      });

      if (roleplayError) throw roleplayError;

      if (roleplayData?.response) {
        await speakResponse(roleplayData.response);
      } else {
        throw new Error("No response from AI");
      }
    } catch (error) {
      console.error("Error in speech processing:", error);
      toast({
        title: "Error",
        description: "Failed to process speech. Please try again.",
        variant: "destructive",
      });
      setIsThinking(false);
      startRecording();
    }
  };

  const speakResponse = async (text: string) => {
    try {
      setIsThinking(false);
      setIsSpeaking(true);

      const { data, error } = await supabase.functions.invoke("handle-speech", {
        body: {
          text,
          type: "text-to-speech",
          voiceId: session.avatar_voice_id,
        },
      });

      if (error) throw error;

      if (!data?.audioContent) {
        throw new Error("No audio content received");
      }

      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBlob = new Blob([bytes], { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.oncanplaythrough = () => {
        audio.play().catch((err) => {
          console.error("Audio playback error:", err);
          cleanup();
        });
      };

      audio.onended = () => {
        cleanup();
      };

      audio.onerror = () => {
        console.error("Audio playback error");
        cleanup();
      };

      const cleanup = () => {
        URL.revokeObjectURL(audioUrl);
        setIsSpeaking(false);
        if (!isEndCallRef.current) {
          startRecording();
        }
      };

    } catch (error) {
      console.error("Error in speaking response:", error);
      setIsSpeaking(false);
      if (!isEndCallRef.current) {
        startRecording();
      }
      toast({
        title: "Error",
        description: "Failed to speak response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="p-4 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            <img
              src={
                supabase.storage
                  .from("avatars")
                  .getPublicUrl(`${session.avatar_id}.jpg`).data.publicUrl
              }
              alt={session.avatar_id}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-semibold">{session.avatar_id}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{formatTime(callDuration)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isGettingScore ? (
          <ScoringLoader />
        ) : (
          <AvatarDisplay
            avatarId={session.avatar_id}
            isThinking={isThinking}
            status={{ isListening, isThinking, isSpeaking }}
          />
        )}
      </div>

      <CallControls
        showScoreButton={showScoreButton}
        isGettingScore={isGettingScore}
        isLoading={isLoading}
        onGetScore={handleGetScore}
        onEndCall={endCall}
      />
    </div>
  );
};

export default CallScreen;
