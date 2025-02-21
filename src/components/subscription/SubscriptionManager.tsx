
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionManagerProps {
  paymentDueDate: string | null;
}

export const SubscriptionManager = ({ paymentDueDate }: SubscriptionManagerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to cancel your subscription');
      }

      // First, cancel the subscription in Stripe
      const { error: cancelError } = await supabase.functions.invoke('cancel-subscription', {
        body: { user_id: user.id }
      });

      if (cancelError) throw cancelError;

      // Delete roleplay sessions
      const { error: sessionsError } = await supabase
        .from('roleplay_sessions')
        .delete()
        .eq('user_id', user.id);

      if (sessionsError) throw sessionsError;

      // Delete profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Sign out the user
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      toast({
        title: "Account cancelled",
        description: "Your account has been successfully cancelled. You'll be redirected to the homepage.",
      });

      // Redirect to home page after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      console.error('Cancellation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Current Plan</h2>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="space-y-2 text-gray-600">
          {paymentDueDate && (
            <p>Payment due date: {paymentDueDate}</p>
          )}
        </div>
        <div className="pt-4 border-t">
          <Button 
            variant="destructive"
            onClick={handleCancelSubscription}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Cancel Account"}
          </Button>
        </div>
      </div>
    </section>
  );
};
