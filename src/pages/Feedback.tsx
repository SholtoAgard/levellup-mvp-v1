
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarProvider } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import Footer from "@/components/Footer";

const Feedback = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

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
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Help Me Build the #1 Sales Training Platform</h1>
              <div className="prose prose-lg">
                <p className="text-gray-600">At LevellUp, my mission is to build the most effective sales training platform. I need your help! Your feedback is crucial in shaping LevellUp into the ultimate tool for sales reps. By sharing your thoughts, you'll directly improve the platform. Click the "Give Your Feedback" button to take a quick 3-5 minute survey. Thank you for helping me level up!</p>
                <Button size="lg" className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white" onClick={() => window.open('https://forms.gle/nWB65dFyuc8ctN5v6', '_blank')}>
                  Give Your Feedback
                </Button>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Feedback;
