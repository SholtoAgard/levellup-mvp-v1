
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarProvider } from "@/components/ui/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";
import Footer from "@/components/Footer";

const Account = () => {
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
                  <SidebarNav />
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
                      <SidebarNav onNavigation={() => setIsOpen(false)} />
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          )}

          <div className="p-8 flex-1">
            <div className="max-w-4xl mx-auto space-y-12">
              <SubscriptionManager paymentDueDate={paymentDueDate} />
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Account;
