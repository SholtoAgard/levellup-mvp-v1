
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { HomeIcon, Users, HelpCircle, User, MessageSquare } from "lucide-react";

const Feedback = () => {
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
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      className="w-full text-black"
                      onClick={() => navigate('/feedback')}
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>Give us feedback</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 p-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Help Us Build the #1 Sales Training Platform</h1>
            <div className="prose prose-lg">
              <p className="text-gray-600 mb-6">
                At LevellUp, our mission is to create the most effective and widely used sales training platform in the world. To achieve that, we need your help!
              </p>
              <p className="text-gray-600 mb-6">
                Your feedback is invaluable in shaping LevellUp into the ultimate tool for sales reps like you. By sharing your thoughts, you'll play a key role in improving the platform and making it even better.
              </p>
              <p className="text-gray-600 mb-8">
                Please click the "Give Your Feedback" button to take a short survey—it'll only take 3-5 minutes to complete. Thank you for helping us level up!
              </p>
              <Button 
                size="lg" 
                className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
                onClick={() => window.open('https://forms.gle/your-form-url', '_blank')}
              >
                Give Your Feedback
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Feedback;
