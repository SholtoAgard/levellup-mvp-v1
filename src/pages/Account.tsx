
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { HomeIcon, Users, HelpCircle, User, CreditCard } from "lucide-react";

const Account = () => {
  const navigate = useNavigate();

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
                <h3 className="text-xl font-medium text-gray-900">Podbean Unlimited Audio Monthly Plan</h3>
                <div className="space-y-2 text-gray-600">
                  <p>Payment due date: Feb 16, 2025</p>
                  <p>Payment Email: iagard@gmail.com</p>
                  <p className="flex items-center gap-2">
                    Payment Card: ****0362 
                    <Button variant="link" className="text-[#1E90FF] p-0 h-auto font-normal">
                      Update card
                    </Button>
                  </p>
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
