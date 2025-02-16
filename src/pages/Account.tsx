
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { HomeIcon, Users, HelpCircle, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [paymentDueDate, setPaymentDueDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrialEndDate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('trial_ends_at')
          .eq('id', user.id)
          .single();

        if (profile?.trial_ends_at) {
          const trialEndDate = new Date(profile.trial_ends_at);
          const formattedDate = format(trialEndDate, 'MMM d, yyyy');
          setPaymentDueDate(formattedDate);
        }
      }
    };

    fetchTrialEndDate();
  }, []);

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to cancel your subscription');
      }

      // Call the cancel-subscription function
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been successfully cancelled.",
      });

      // Redirect to home page after successful cancellation
      navigate('/');
      
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarContent>
            <div className="p-4 mb-4">
              <h1 className="text-2xl font-bold text-black">LEVELLUP</h1>
            </div>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      className="w-full text-black"
                      onClick={() => navigate('/')}
                    >
                      <HomeIcon className="w-5 h-5" />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      className="w-full text-black"
                      onClick={() => navigate('/dashboard')}
                    >
                      <Users className="w-5 h-5" />
                      <span>AI Avatars</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      className="w-full text-black"
                      onClick={() => navigate('/support')}
                    >
                      <HelpCircle className="w-5 h-5" />
                      <span>Support center</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      className="w-full text-black"
                      onClick={() => navigate('/account')}
                    >
                      <User className="w-5 h-5" />
                      <span>My Account</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-12">
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
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Account;
