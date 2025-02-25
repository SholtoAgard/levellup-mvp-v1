//@ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Phone, Mic, MicOff, Award, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { RoleplaySession } from "@/lib/types";
import { log } from "node:console";
import { useAudioContext } from "@/contexts/AudioContext";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import coreURL from "@ffmpeg/core?url";
import wasmURL from "@ffmpeg/core/wasm?url";
interface CallScreenProps {
  session: RoleplaySession;
}

let mediaRecorder: MediaRecorder;

export const CallScreen: React.FC<CallScreenProps> = ({ session }) => {
  const [isListening, setIsListening] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const isSpeakingRef = useRef(isSpeaking);
  const isThinkingRef = useRef(isThinking);
  const isListeningRef = useRef(isListening);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
  const [showScoreButton, setShowScoreButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef(null);
  const recognitionFlagRef = useRef(null);

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
    }, 30000); // 30 seconds = 1 minute

    return () => {
      clearInterval(timer);
      clearTimeout(scoreButtonTimer);

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const ffmpeg = new FFmpeg();

  const processAudioData = async () => {
    console.log("inside processAudioData function");

    if (chunksRef.current.length === 0 || processingAudioRef.current) return;

    processingAudioRef.current = true;
    let mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
    console.log("mediaRecorder:", mediaRecorderRef.current);

    console.log("MIME Type before blob", mimeType);
    if (mimeType === "audio/webm;codecs=opus") {
      mimeType = "audio/webm";
    }

    const audioBlob = new Blob(chunksRef.current, { type: mimeType });
    console.log("Recorded MIME Type:", audioBlob.type);
    mediaRecorderRef.current = null;

    console.log("audio blob size:", audioBlob.size);

    if (audioBlob.size > 0) {
      console.log("Processing audio blob of size:", audioBlob.size);

      await ffmpeg.load({ coreURL, wasmURL });

      let finalBlob = audioBlob;
      let finalMimeType = mimeType;

      if (audioBlob.type === "audio/mp4") {
        console.log("Converting audio/mp4 to mp3...");

        const inputName = "input.mp4";
        const outputName = "output.mp3";

        ffmpeg.writeFile(inputName, await fetchFile(audioBlob));
        await ffmpeg.exec("-i", inputName, "-b:a", "192k", outputName);

        const data = ffmpeg.readFile(outputName);
        finalBlob = new Blob([data.buffer], { type: "audio/mp3" });
        finalMimeType = "audio/mp3";
      }

      const reader = new FileReader();
      reader.readAsDataURL(finalBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(",")[1];
        if (base64Audio) {
          await handleSpeech(base64Audio, finalMimeType);
        }
      };
      chunksRef.current = [];
    }

    processingAudioRef.current = false;
  };

  const startCall = async () => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Create AudioContext and AnalyserNode
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    analyserRef.current.fftSize = 256;

    if (isSafari) {
      console.log("Safari detected, using SpeechRecognition");
      let transcript = "";
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech Recognition not supported in this browser.");
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
        recognitionFlagRef.current = "recording";

        detectVolume();
      };

      recognitionRef.current.onresult = (event) => {
        transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");

        console.log("Speech recognized:", transcript);

        // Handle transcript processing here
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current.onstop = async () => {
        console.log("Speech recognition stopped");
        setIsListening(false);
        recognitionFlagRef.current = "stopped";
        if (!isEndCallRef.current) {
          console.log("Processing audio data testing...");
          await handleRolePlay(transcript);

          // Start a new recording only if the latest ref values indicate we should
          if (!isSpeakingRef.current && !isThinkingRef.current) {
            recognitionRef.current.start();
            detectVolume();
          }
        }
      };
      recognitionRef.current.onend = async () => {
        console.log("Speech recognition ended");
        setIsListening(false);
        recognitionFlagRef.current = "ended";

        if (!isEndCallRef.current) {
          console.log("Processing audio data testing...");
          await handleRolePlay(transcript);

          // Start a new recording only if the latest ref values indicate we should
          if (!isSpeakingRef.current && !isThinkingRef.current) {
            recognitionRef.current.start();
            detectVolume();
          }
        }
      };

      recognitionRef.current.start();
    } else {
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
          mimeType = "audio/mp3";
          console.log("mp3 not supported");

          isSupported = MediaRecorder.isTypeSupported(mimeType);
        }

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
          console.log("Data available: ", e.data.size);
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          console.log("endVoiceCallRef", isEndCallRef);

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
    }
  };

  let speechDetected = false;

  const detectVolume = () => {
    console.log("analyser ref curent:", analyserRef.current);

    if (!analyserRef.current) return;
    console.log("inside detect volume function...");

    const dataArray = new Uint8Array(analyserRef?.current?.frequencyBinCount);
    let silenceCounter = 0;
    const minDb = -22;
    const speechThreshold = -13;
    let isSilent = false;

    const checkVolume = () => {
      if (
        (!analyserRef.current || !mediaRecorderRef.current) &&
        !recognitionRef.current
      )
        return;

      analyserRef?.current?.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const db = 20 * Math.log10(average / 255);

      //   console.log("db: " + db);

      // Check if audio is silent

      if (db > speechThreshold) {
        console.log("Speech detected");
        console.log("recognitionRef?.current", recognitionRef?.current);

        // setIsListening(true);
        // setIsThinking(false);
        speechDetected = true; // Speech detected
        silenceCounter = 0;
        isSilent = false;
      } else if (db < minDb) {
        silenceCounter++;
        if (
          silenceCounter > 250 &&
          !isSilent &&
          speechDetected &&
          (mediaRecorderRef?.current?.state === "recording" ||
            recognitionFlagRef?.current === "recording")
        ) {
          if (!isThinkingRef.current && !isSpeakingRef.current) {
            console.log("Silence detected, stopping recording");
            setIsListening(false);
            setIsThinking(true);
            isSilent = true;
            if (recognitionRef?.current) {
              recognitionRef.current.stop();
            } else {
              mediaRecorderRef?.current.stop();
            }

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

  const handleSpeech = async (base64Audio: string, mimeType: string) => {
    console.log("handle speech function called");
    console.log("mimeType in handle speech function", mimeType);

    try {
      const { data: speechData, error: speechError } =
        await supabase.functions.invoke("handle-speech", {
          body: {
            audio: base64Audio,
            format: mimeType,
            type: "speech-to-text",
          },
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
      } else {
        setIsThinking(false);
        startRecording();
        detectVolume();
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

  const handleRolePlay = async (transcript) => {
    try {
      setIsThinking(true);
      const { data: roleplayData, error: roleplayError } =
        await supabase.functions.invoke("handle-roleplay", {
          body: {
            sessionId: session.id,
            message: transcript,
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
    } catch (error) {
      console.log("Error in roleplay handling:", error);
    }
  };

  const speakResponse = async (text: string) => {
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
          if (!recognitionRef?.current) {
            startRecording();
          } else {
            recognitionRef.current.start();
          }

          speechDetected = false;
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
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBlob = new Blob([bytes], { type: "audio/mp3" });
      const audioUrl = URL.createObjectURL(audioBlob);

      // if (audioRef.current) {
      //   audioRef.current.pause();
      //   audioRef.current = null;
      // }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // ✅ Ensure AudioContext is resumed (important for Safari/iOS)
      // if (audioContext && audioContext?.state === "suspended") {
      //   console.log("Resuming audio context");

      //   await audioContext.resume();
      // }
      audio.muted = true; // Start muted

      // Ensure AudioContext is resumed (important for Safari/iOS)

      // Ensure audio plays only after user interaction (for autoplay policies)

      // if (!audioContext) {
      //   console.warn("AudioContext not available.");
      // }

      // console.log("audio context,", audioContext);

      const playAudio = () => {
        console.log("in the play audio function");

        audio
          .play()
          .then(() => {
            audio.muted = false;
            console.log("Audio played");
            setIsThinking(false);
            setIsSpeaking(true);
          })
          .catch((err) => console.log("Playback error:", err));
      };

      playAudio();
      return new Promise((resolve) => {
        audio.onended = () => {
          if (!recognitionRef?.current) {
            startRecording();
          } else {
            recognitionRef.current.start();
          }
          speechDetected = false;
          detectVolume();

          setIsSpeaking(false);

          resolve(null);
        };
      });
    }
  };

  const endCall = () => {
    setEndVoiceCall(true);
    if (audioRef?.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset audio position
    }
    if (mediaRecorderRef?.current) {
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    } else if (mediaRecorder) {
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef?.current) {
      audioContextRef.current.close();
    }
    if (analyserRef?.current) {
      analyserRef.current = null;
    }
    if (recognitionRef?.current) {
      recognitionRef.current.abort(); // Ensures full stop
      recognitionRef.current.onend = null; // Remove any event listeners
      recognitionRef.current = null;
    }

    window?.speechSynthesis.cancel();

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      })
      .catch((err) => console.error("Error stopping media stream:", err));

    navigate(-1);
  };

  const handleGetScore = async () => {
    try {
      setIsLoading(true);

      // End the call first
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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      console.log("User data:", user);
      if (authError) {
        console.error("Error getting authenticated user:", authError);
        throw authError;
      }

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        // @ts-ignore
        .from("users")
        .select("full_name, avatar_url")
        .eq("id", user?.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
      }
      // Get score and feedback from the roleplay endpoint
      const { data, error } = await supabase.functions.invoke(
        "handle-roleplay",
        {
          body: {
            sessionId: session.id,
            requestScoring: true,
            context: {
              avatar_id: session.avatar_id,
              roleplay_type: session.roleplay_type,
              scenario_description: session.scenario_description,
            },
          },
        }
      );

      console.log("Data from get score:", data);

      if (error) throw error;

      // Parse the response string to extract score and feedback
      const responseText = data.response;

      const scorePatterns = {
        confidence: /Confidence:\s*(\d+)/,
        clarity: /Clarity:\s*(\d+)/,
        engagement: /Engagement:\s*(\d+)/,
        objectionHandling: /Objection Handling:\s*(\d+)/,
        valueProposition: /Value Proposition:\s*(\d+)/,
        closingEffectiveness: /Closing Effectiveness:\s*(\d+)/,
      };

      // Extract scores using new patterns
      const extractedScores = {
        confidence: parseInt(
          responseText.match(scorePatterns.confidence)?.[1] || "0"
        ),
        clarity: parseInt(
          responseText.match(scorePatterns.clarity)?.[1] || "0"
        ),
        engagement: parseInt(
          responseText.match(scorePatterns.engagement)?.[1] || "0"
        ),
        objectionHandling: parseInt(
          responseText.match(scorePatterns.objectionHandling)?.[1] || "0"
        ),
        valueProposition: parseInt(
          responseText.match(scorePatterns.valueProposition)?.[1] || "0"
        ),
        closingEffectiveness: parseInt(
          responseText.match(scorePatterns.closingEffectiveness)?.[1] || "0"
        ),
      };

      // Calculate average score (using all available scores)
      const scores = Object.values(extractedScores).filter(
        (score) => score > 0
      );
      const averageScore = Math.round(
        scores.reduce((acc, curr) => acc + curr, 0) / scores.length
      );
      // Extract feedback (everything after the scores)
      const feedbackText =
        responseText
          .split(/(?:Confidence|Clarity|Engagement):\s*\d+\/100/)
          .pop()
          ?.trim() || "";

      // Update session status in database
      const { error: updateError } = await supabase
        .from("roleplay_sessions")
        .update({ status: "completed" })
        .eq("id", session.id);

      if (updateError) throw updateError;
      navigate("/feedback", {
        state: {
          sessionId: session.id,
          score: averageScore,
          feedback: feedbackText,
          detailedScores: {
            confidence: extractedScores.confidence,
            clarity: extractedScores.clarity,
            engagement: extractedScores.engagement,
            objectionHandling: extractedScores.objectionHandling,
            valueProposition: extractedScores.valueProposition,
            closingEffectiveness: extractedScores.closingEffectiveness,
          },
          // @ts-ignore
          userName: userData?.full_name || user?.email?.split("@")[0] || "User",
          // @ts-ignore
          userImage:
            // @ts-ignore
            userData?.avatar_url || "",
        },
        replace: true,
      });
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
    } catch (error) {
      console.error("Error getting score:", error);
      toast({
        title: "Error",
        description: "Failed to get conversation score. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

      <div className="p-8 flex justify-center gap-4">
        {showScoreButton && (
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-3 flex items-center gap-2 h-15"
            onClick={handleGetScore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                <span>Get Your Score</span>
              </>
            )}
          </Button>
        )}
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

export default CallScreen;
