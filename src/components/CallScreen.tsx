import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Phone, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RoleplaySession } from "@/lib/types";

interface CallScreenProps {
  session: RoleplaySession;
}

let mediaRecorder;

export const CallScreen: React.FC<CallScreenProps> = ({ session }) => {
  const [isListening, setIsListening] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const isSpeakingRef = useRef(isSpeaking);
  const isThinkingRef = useRef(isThinking);
  const isListeningRef = useRef(isListening);
  const audioRef = useRef(null);

  const [callDuration, setCallDuration] = useState(0);
  const [endVoiceCall, setEndVoiceCall] = useState(false);
  const isEndCallRef = useRef(endVoiceCall);
  const navigate = useNavigate();
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingAudioRef = useRef(false);

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
    return () => {
      clearInterval(timer);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const processAudioData = async () => {
    console.log("inside processAudioData function");

    if (chunksRef.current.length === 0 || processingAudioRef.current) return;

    processingAudioRef.current = true;
    const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    const audioBlob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    if (audioBlob.size > 0) {
      console.log("Processing audio blob of size:", audioBlob.size);

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(",")[1];
        if (base64Audio) {
          await handleSpeech(base64Audio);
        }
      };
    }

    processingAudioRef.current = false;
  };

  const startCall = async () => {
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
        console.log("Data available:", e.data.size);
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("endVoiceCallRef", isEndCallRef);
        mediaRecorderRef.current = null;
        console.log(
          "MediaRecorder stopped, isSpeaking:",
          isSpeakingRef.current,
          "isThinking:",
          isThinkingRef.current
        );

        if (!isEndCallRef.current) {
          console.log("Processing audio data testing...");
          await processAudioData();

          // Start a new recording only if the latest ref values indicate we should
          if (!isSpeakingRef.current && !isThinkingRef.current) {
            startRecording();
            detectVolume();
          }
        }
      };

      startRecording();
      detectVolume();
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description:
          "Failed to access microphone. Please make sure you have granted microphone permissions.",
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

      //   console.log("db: " + db);

      // Check if audio is silent

      if (db > speechThreshold) {
        console.log("Speech detected");
        // setIsListening(true);
        // setIsThinking(false);
        speechDetected = true; // Speech detected
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
        description:
          "Failed to start recording. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  };

  const handleSpeech = async (base64Audio: string) => {
    console.log("handle speech function called");

    try {
      const { data: speechData, error: speechError } =
        await supabase.functions.invoke("handle-speech", {
          body: { audio: base64Audio, type: "speech-to-text" },
        });

      if (speechError) throw speechError;
      if (speechData.text) {
        const { data: roleplayData, error: roleplayError } =
          await supabase.functions.invoke("handle-roleplay", {
            body: {
              sessionId: session.id,
              message: speechData.text,
              context:
                session.status === "in_progress"
                  ? {
                      avatar_id: session.avatar_id,
                      roleplay_type: session.roleplay_type,
                      scenario_description: session.scenario_description,
                    }
                  : undefined,
            },
          });

        if (roleplayError) throw roleplayError;

        if (roleplayData.response) {
          await speakResponse(roleplayData.response);

          console.log("No error in speak response");
        }
      }
    } catch (error) {
      console.error("Error in speech handling:", error);

      toast({
        title: "Error",
        description: "Failed to process speech. Please try again.",
        variant: "destructive",
      });
      // startRecording(); // Restart recording even if there was an error
    }
  };

  const speakResponse = async (text: string) => {
    // try {
    const { data, error } = await supabase.functions.invoke("handle-speech", {
      body: {
        text,
        type: "text-to-speech",
        voiceId: session.avatar_voice_id,
      },
    });

    if (error) {
      console.log("Error in text to speech:", error);

      // if (error.message?.includes("exceeds")) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      setIsThinking(false);
      setIsSpeaking(true);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);

      toast({
        title: "Notice",
        description: "Using browser's text-to-speech as a fallback.",
        duration: 3000,
      });

      return new Promise((resolve) => {
        utterance.onend = () => {
          console.log("utterance ended");
          startRecording();
          detectVolume();

          setIsSpeaking(false);

          resolve(null);
        };
      });
      // }
      // throw error;
    }

    if (data.audioContent) {
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < bytes.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBlob = new Blob([bytes], { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      setIsThinking(false);
      setIsSpeaking(true);
      audio.play();

      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          console.log("eleven lab audio ended");

          startRecording();
          detectVolume();

          setIsSpeaking(false);
          resolve(null);
        };
      });
    }
    // } catch (error) {
    //   console.error("Error in text to speech:", error);
    //   toast({
    //     title: "Error",
    //     description: "Failed to generate speech. Please try again.",
    //     variant: "destructive",
    //   });
    // }
  };

  const endCall = () => {
    setEndVoiceCall(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset audio position
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    } else {
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="p-4 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <Avatar className="w-10 h-10">
            <AvatarImage
              src={
                supabase.storage
                  .from("avatars")
                  .getPublicUrl(`${session.avatar_id}.jpg`).data.publicUrl
              }
            />
          </Avatar>
          <span className="font-semibold">{session.avatar_id}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{formatTime(callDuration)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative">
          {isThinking && (
            <div className="absolute -inset-3 rounded-full">
              <div className="w-full h-full rounded-full border-8 border-orange-500 border-t-transparent animate-spin" />
            </div>
          )}
          <div
            className="w-48 h-48 rounded-full relative"
            // style={{
            //   background: "linear-gradient(90deg, #FF5733 0%, #FFC300 100%)",
            // }}
          >
            <Avatar className="w-full h-full">
              <AvatarImage
                src={
                  supabase.storage
                    .from("avatars")
                    .getPublicUrl(`${session.avatar_id}.jpg`).data.publicUrl
                }
              />
            </Avatar>
          </div>
        </div>

        <h2 className="text-2xl font-bold mt-6">{session.avatar_id}</h2>
        {isListening && (
          <div className="mt-4 px-4 py-2 bg-purple-100 text-purple-600 rounded-full animate-pulse">
            Listening...
          </div>
        )}
        {isThinking && (
          <div className="mt-4 px-4 py-2 bg-orange-100 text-orange-600 rounded-full animate-pulse">
            Thinking...
          </div>
        )}
        {isSpeaking && (
          <div className="mt-4 px-4 py-2 bg-green-100 text-green-600 rounded-full animate-pulse">
            Talking...
          </div>
        )}
      </div>

      <div className="p-8 flex justify-center">
        <Button
          variant="destructive"
          size="lg"
          className="rounded-full w-16 h-16"
          onClick={endCall}
        >
          <Phone className="w-6 h-6 rotate-135" />
        </Button>
      </div>
    </div>
  );
};
