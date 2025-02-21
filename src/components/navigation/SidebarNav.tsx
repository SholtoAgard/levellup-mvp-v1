
import { useNavigate } from "react-router-dom";
import { HomeIcon, Users, HelpCircle, User, MessageSquare } from "lucide-react";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export const SidebarNav = ({ onNavigation }: { onNavigation?: () => void }) => {
  const navigate = useNavigate();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton 
          className="w-full text-black"
          onClick={() => {
            navigate('/');
            onNavigation?.();
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
            onNavigation?.();
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
            onNavigation?.();
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
            onNavigation?.();
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
            onNavigation?.();
          }}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Give me feedback</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
