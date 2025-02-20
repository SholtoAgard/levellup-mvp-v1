
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { RoleplaySession } from "@/lib/types";

const StartCall = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const session = location.state?.session as RoleplaySession;

  if (!session || !session.avatar_id) {
    navigate('/dashboard');
    return null;
  }

  const handleStartCall = () => {
    navigate('/roleplay', { state: { session } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-6">
        <Avatar className="w-48 h-48 mx-auto rounded-full border-4 border-white shadow-lg">
          <AvatarImage 
            src={supabase.storage
              .from('avatars')
              .getPublicUrl(`${session.avatar_id}.jpg`).data.publicUrl} 
            alt="Avatar"
            className="object-cover"
          />
        </Avatar>
        <h1 className="text-3xl font-semibold text-gray-900">
          {session.avatar_id === 'david' ? 'David' : ''}
        </h1>
        <Button 
          onClick={handleStartCall}
          className="bg-[#FF4500] hover:bg-[#FF4500]/90 text-white px-8 py-6 text-lg rounded-full"
        >
          Start a call
        </Button>
      </div>
    </div>
  );
};

export default StartCall;
