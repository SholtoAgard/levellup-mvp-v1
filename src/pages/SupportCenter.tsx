
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarProvider } from "@/components/ui/sidebar";
import { Mail, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import Footer from "@/components/Footer";

const SupportCenter = () => {
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
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-6 mb-8">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-24 w-24">
                    <AvatarImage alt="Profile" src="/lovable-uploads/efa3cd88-e508-4aa3-920e-b4753e1ffdd5.jpg" />
                    <AvatarFallback>YP</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-gray-600">Ian Agard, founder of LevellUp</p>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-black">Need Help?</h1>
                  <p className="text-gray-700 mt-2 text-2xl">I'm here to help you succeed using LevellUp. Feel free to reach out to me anytime.</p>
                </div>
              </div>
              <p className="text-lg text-gray-700">
                <Mail className="inline mr-2 h-5 w-5 align-text-bottom" />
                <a href="mailto:ian@levellup.co" className="hover:underline">ian@levellup.co</a>
              </p>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SupportCenter;
