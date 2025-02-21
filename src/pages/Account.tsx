
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { HomeIcon, Users, HelpCircle, User, MessageSquare, Menu } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import Footer from "@/components/Footer";

const Account = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);
  const [paymentDueDate, setPaymentDueDate] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

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

  const menuContent = (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton 
          className="w-full text-black"
          onClick={() => {
            navigate('/');
            setIsOpen(false);
          }}
        >
          <HomeIcon className="w-5 h-5" />
          <span>Home</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          className="w-full text-black"
          onClick={() => {
            navigate('/dashboard');
            setIsOpen(false);
          }}
        >
          <Users className="w-5 h-5" />
          <span>AI Avatars</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          className="w-full text-black"
          onClick={() => {
            navigate('/support');
            setIsOpen(false);
          }}
        >
          <HelpCircle className="w-5 h-5" />
          <span>Support center</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          className="w-full text-black"
          onClick={() => {
            navigate('/account');
            setIsOpen(false);
          }}
        >
          <User className="w-5 h-5" />
          <span>My Account</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton 
          className="w-full text-black"
          onClick={() => {
            navigate('/feedback');
            setIsOpen(false);
          }}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Give me feedback</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && (
          <Sidebar>
            <SidebarContent>
              <div className="p-4 mb-4">
                <h1 className="text-2xl font-bold text-black">LEVELLUP</h1>
              </div>
              <SidebarGroup>
                <SidebarGroupContent>
                  {menuContent}
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        )}

        <div className="flex-1 flex flex-col">
          {isMobile && (
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-black">LEVELLUP</h1>
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <nav className="flex flex-col gap-6 mt-6">
                      {menuContent}
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          )}

          <div className="p-8 flex-1">
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
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Account;
