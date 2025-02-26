import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton"; // Add this import

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

export const AvatarSelection = ({
  avatars,
  selectedAvatar,
  onSelect,
}: AvatarSelectionProps) => {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center sm:text-left">
        Select an AI Avatar:
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {avatars.map((avatar) => {
          const avatarPublicUrl = supabase.storage
            .from("avatars")
            .getPublicUrl(`${avatar.id}.jpg`).data.publicUrl;

          return (
            <div
              key={avatar.id}
              className={`
                relative flex flex-col items-center
                p-3 sm:p-4 rounded-xl transition-all duration-200
                ${
                  selectedAvatar === avatar.id
                    ? "ring-2 ring-[#1E90FF] bg-blue-50/80 shadow-lg"
                    : "hover:bg-gray-50 hover:shadow-md"
                }
                cursor-pointer
                transform hover:scale-[1.02] active:scale-[0.98]
              `}
              onClick={() => onSelect(avatar.id)}
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                <Avatar className="w-full h-full rounded-lg overflow-hidden">
                  <AvatarImage
                    src={avatarPublicUrl}
                    alt={avatar.name}
                    className="object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.src = "fallback-avatar.jpg"; // Add a fallback image
                    }}
                  />
                  <Skeleton className="w-full h-full" />{" "}
                  {/* Fallback loading state */}
                </Avatar>
              </div>

              <div className="mt-3 text-center w-full">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                  {avatar.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">
                  {avatar.style}
                </p>
                <p className="text-xs text-gray-600 line-clamp-2 min-h-[2rem]">
                  {avatar.personality}
                </p>
              </div>

              {selectedAvatar === avatar.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full">
                  <span className="sr-only">Selected</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
