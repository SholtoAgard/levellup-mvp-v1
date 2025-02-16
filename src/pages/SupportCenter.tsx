
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { HomeIcon, Users, HelpCircle, User, Mail, MessageSquare, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const SupportCenter = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

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
          <span>Give us feedback</span>
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

        <div className="flex-1">
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

          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-4xl font-bold text-black mb-6">Need Help?</h1>
              <p className="text-lg text-gray-700 mb-8">
                Our customer success team is here to help you succeed. Feel free to reach out to us anytime.
              </p>
              <a 
                href="mailto:ian@levellup.co"
                className="inline-block"
              >
                <Button className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white">
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Support Team
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default SupportCenter;
