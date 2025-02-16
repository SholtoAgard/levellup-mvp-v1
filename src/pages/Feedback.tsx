
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RoleplaySession } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

const FeedbackPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<RoleplaySession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('roleplay_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      setSession(data);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-2xl font-bold">Loading feedback...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold mb-4">Session not found</div>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mr-4"
          >
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Roleplay Feedback</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Overall Score</h2>
            <div className="relative mb-2">
              <Progress value={session.score || 0} className="h-8" />
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                {session.score}/100
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Detailed Feedback</h2>
            <div className="prose prose-slate max-w-none">
              {session.feedback?.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => navigate('/dashboard')}>
              Return to Dashboard
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(`/roleplay`, { state: { session } })}
            >
              Review Conversation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
