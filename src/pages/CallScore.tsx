
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const CallScore = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { avatarId, roleplayType, score } = location.state || {};

  console.log("Location state:", location.state);
  console.log("Avatar ID:", avatarId);
  console.log("Roleplay Type:", roleplayType);
  console.log("Score:", score);

  if (!avatarId || !roleplayType || score === undefined) {
    console.log("Missing required data, redirecting to dashboard");
    navigate('/dashboard');
    return null;
  }

  const getScoreColor = (score: number) => {
    return score >= 70 ? "text-green-600" : "text-red-600";
  };

  const avatarUrl = supabase.storage
    .from("avatars")
    .getPublicUrl(`${avatarId}.jpg`).data.publicUrl;

  console.log("Avatar URL:", avatarUrl);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage
                  src={avatarUrl}
                  alt={avatarId}
                />
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{avatarId}</CardTitle>
                <p className="text-gray-600 capitalize">{roleplayType.replace('_', ' ')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <h2 className="text-lg text-gray-600 mb-2">Call Score</h2>
              <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
                {score}
                <span className="text-2xl">/100</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallScore;
