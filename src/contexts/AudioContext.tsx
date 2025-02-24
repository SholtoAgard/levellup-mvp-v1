import { createContext, useContext, useEffect, useRef, useState } from "react";

const AudioContextWrapper = createContext<AudioContext | null>(null);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const unlockAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      setIsUnlocked(true);
      document.body.removeEventListener("click", unlockAudio);
    };

    document.body.addEventListener("click", unlockAudio, { once: true });

    return () => {
      document.body.removeEventListener("click", unlockAudio);
    };
  }, []);

  return (
    <AudioContextWrapper.Provider value={audioContextRef.current}>
      {children}
    </AudioContextWrapper.Provider>
  );
};

// Custom hook to access the unlocked AudioContext
export const useAudioContext = () => {
  return useContext(AudioContextWrapper);
};
