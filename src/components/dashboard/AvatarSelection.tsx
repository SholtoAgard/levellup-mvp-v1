
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Avatar {
  id: string;
  name: string;
  style: string;
  personality: string;
  voiceId: string;
}

interface AvatarSelectionProps {
  avatars: Avatar[];
  selectedAvatar: string;
  onSelect: (avatarId: string) => void;
}

export const AvatarSelection = ({ avatars, selectedAvatar, onSelect }: AvatarSelectionProps) => {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-6">Select an AI Avatar:</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {avatars.map((avatar) => {
          const avatarPublicUrl = supabase.storage
            .from('avatars')
            .getPublicUrl(`${avatar.id}.jpg`).data.publicUrl;

          return (
            <div 
              key={avatar.id}
              className={`cursor-pointer text-center p-4 rounded-lg transition-all ${
                selectedAvatar === avatar.id 
                  ? 'ring-2 ring-[#1E90FF] bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelect(avatar.id)}
            >
              <Avatar className="w-32 h-32 mx-auto mb-4 rounded-lg">
                <AvatarImage src={avatarPublicUrl} alt={avatar.name} />
              </Avatar>
              <h3 className="font-semibold text-lg text-gray-900">{avatar.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{avatar.style}</p>
              <p className="text-xs text-gray-600">{avatar.personality}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
