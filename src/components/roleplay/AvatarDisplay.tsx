
import React from 'react';
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface AvatarDisplayProps {
  avatarId: string;
  isThinking: boolean;
  status: {
    isListening: boolean;
    isThinking: boolean;
    isSpeaking: boolean;
  };
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ 
  avatarId, 
  isThinking, 
  status 
}) => {
  return (
    <>
      <div className="relative">
        {isThinking && (
          <div className="absolute -inset-3 rounded-full">
            <div className="w-full h-full rounded-full border-8 border-orange-500 border-t-transparent animate-spin" />
          </div>
        )}
        <div className="w-48 h-48 rounded-full relative">
          <Avatar className="w-full h-full">
            <AvatarImage
              src={
                supabase.storage
                  .from("avatars")
                  .getPublicUrl(`${avatarId}.jpg`).data.publicUrl
              }
            />
          </Avatar>
        </div>
      </div>

      <h2 className="text-2xl font-bold mt-6">{avatarId}</h2>
      {status.isListening && (
        <div className="mt-4 px-4 py-2 bg-purple-100 text-purple-600 rounded-full animate-pulse">
          Listening...
        </div>
      )}
      {status.isThinking && (
        <div className="mt-4 px-4 py-2 bg-orange-100 text-orange-600 rounded-full animate-pulse">
          Thinking...
        </div>
      )}
      {status.isSpeaking && (
        <div className="mt-4 px-4 py-2 bg-green-100 text-green-600 rounded-full animate-pulse">
          Talking...
        </div>
      )}
    </>
  );
};
