
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Award, ThumbsUp, Target } from "lucide-react";

const CallScore = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { avatarId, roleplayType, score, strengths = [], improvements = [] } = location.state || {};

  console.log("Location state:", location.state);

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Understanding Your Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ThumbsUp className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">What You Did Well</h3>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {strengths.map((strength: string, index: number) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Areas for Improvement</h3>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {improvements.map((improvement: string, index: number) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8"
            size="lg"
          >
            <Award className="mr-2 h-5 w-5" />
            Start A New Role Play
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallScore;
