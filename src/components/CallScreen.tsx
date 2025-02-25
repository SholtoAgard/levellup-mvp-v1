
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useVoiceResponse } from "@/hooks/useVoiceResponse";
import { blobToBase64 } from "@/utils/audioProcessing";
import type { RoleplaySession } from "@/lib/types";
import { loadFFmpeg } from "@/utils/audioHandling";
import { AvatarDisplay } from "./roleplay/AvatarDisplay";
import { CallControls } from "./roleplay/CallControls";
import { ScoringLoader } from "./roleplay/ScoringLoader";

interface CallScreenProps {
  session: RoleplaySession;
}

export const CallScreen: React.FC<CallScreenProps> = ({ session }) => {
  const [isThinking, setIsThinking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [endVoiceCall, setEndVoiceCall] = useState(false);
  const [showScoreButton, setShowScoreButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingScore, setIsGettingScore] = useState(false);

  const isThinkingRef = useRef(isThinking);
  const isEndCallRef = useRef(endVoiceCall);
  const ffmpegRef = useRef<any>(null);
  const processingAudioRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    isListening,
    setIsListening,
    mediaRecorderRef,
    chunksRef,
    analyserRef,
    setupAudioContext,
    startRecording,
    stopRecording,
    cleanup: cleanupAudio
  } = useAudioRecording();

  const {
    isSpeaking,
    setIsSpeaking,
    audioRef,
    speakResponse,
    cleanup: cleanupVoice
  } = useVoiceResponse();

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

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
      cleanupAudio();
      cleanupVoice();
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const startCall = async () => {
    try {
      ffmpegRef.current = await loadFFmpeg();
      const mediaRecorder = await setupAudioContext();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (!isEndCallRef.current && chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
          chunksRef.current = [];
          
          try {
            const base64Audio = await blobToBase64(audioBlob);
            await handleSpeech(base64Audio, mediaRecorder.mimeType);
          } catch (error) {
            console.error("Error processing audio:", error);
            setIsThinking(false);
            startRecording();
          }
        } else {
          if (!isSpeaking && !isThinking) {
            startRecording();
          }
        }
      };

      startRecording();
      detectVolume();
    } catch (error) {
      console.error("Error starting call:", error);
      toast({
        title: "Error",
        description: "Failed to start call. Please check your microphone.",
        variant: "destructive",
      });
    }
  };

  const handleSpeech = async (base64Audio: string, mimeType: string) => {
    setIsThinking(true);
    try {
      const { data: speechData, error: speechError } = await supabase.functions.invoke(
        "handle-speech",
        {
          body: {
            audio: base64Audio,
            type: "speech-to-text",
          },
        }
      );

      if (speechError) throw speechError;

      if (!speechData.text) {
        console.log("No speech detected");
        setIsThinking(false);
        startRecording();
        return;
      }

      const { data: roleplayData, error: roleplayError } = await supabase.functions.invoke(
        "handle-roleplay",
        {
          body: {
            sessionId: session.id,
            message: speechData.text,
            context: {
              avatar_id: session.avatar_id,
              roleplay_type: session.roleplay_type,
              scenario_description: session.scenario_description,
            },
          },
        }
      );

      if (roleplayError) throw roleplayError;

      if (roleplayData?.response) {
        setIsThinking(false);
        await speakResponse(roleplayData.response, session.avatar_voice_id);
        if (!isEndCallRef.current) {
          startRecording();
        }
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

  const handleGetScore = async () => {
    try {
      setIsGettingScore(true);
      setIsLoading(true);
      setEndVoiceCall(true);
      setIsThinking(false);
      setIsSpeaking(false);
      setIsListening(false);

      cleanupVoice();
      cleanupAudio();

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

  const detectVolume = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let silenceCounter = 0;
    const minDb = -22;
    const speechThreshold = -13;
    let isSilent = false;
    let speechDetected = false;

    const checkVolume = () => {
      if (!analyserRef.current || !mediaRecorderRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const db = 20 * Math.log10(average / 255);

      if (db > speechThreshold) {
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
          if (!isThinkingRef.current && !isSpeaking) {
            isSilent = true;
            stopRecording();
            silenceCounter = 0;
            speechDetected = false;
          }
        }
      }

      requestAnimationFrame(checkVolume);
    };

    checkVolume();
  };

  const endCall = () => {
    setEndVoiceCall(true);
    cleanupVoice();
    cleanupAudio();
    navigate(-1);
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
