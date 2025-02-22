
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RoleplaySession } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Footer from "@/components/Footer";

const CallScore = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = location.state?.session as RoleplaySession;
  const [isLoading, setIsLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      navigate("/dashboard");
      return;
    }
    document.title = "Your Call Score";
    getFeedback();
  }, [session]);

  const getFeedback = async () => {
    if (!session?.id) return;

    try {
      const { data, error } = await supabase
        .from("roleplay_sessions")
        .select("score, feedback")
        .eq("id", session.id)
        .single();

      if (error) throw error;

      if (data) {
        setScore(data.score);
        setFeedback(data.feedback);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load call score and feedback.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 sm:p-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="mr-4"
            >
              ← Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Your Call Score</h1>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Overall Performance</CardTitle>
              <CardDescription>
                Your score is based on various aspects of the conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{score}/100</span>
                  <Progress value={score || 0} className="w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Feedback</CardTitle>
              <CardDescription>
                Analysis of your performance across key areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {feedback?.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CallScore;
