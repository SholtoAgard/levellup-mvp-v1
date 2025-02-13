
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { HomeIcon, Users, BarChart2, Settings, HelpCircle, User } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const avatars = [
  { name: "Chloe", style: "Formal 1", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { name: "Chloe", style: "Formal 2", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { name: "Noah", style: "Casual", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { name: "Noah", style: "Formal 3", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { name: "Noah", style: "Formal 2", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { name: "Veronica", style: "Formal", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { name: "Aliyah", style: "Formal", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { name: "Raj", style: "Formal 1", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
];

const rolePlayTypes = ["cold call", "discovery call", "product demo"];

const Dashboard = () => {
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedRolePlay, setSelectedRolePlay] = useState("");
  const [rolePlayDescription, setRolePlayDescription] = useState("");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar */}
        <Sidebar>
          <SidebarContent>
            <div className="p-4 mb-4">
              <h1 className="text-2xl font-bold">LEVELLUP</h1>
            </div>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full text-[#1E90FF]">
                      <HomeIcon className="w-5 h-5" />
                      <span>Home</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full">
                      <Users className="w-5 h-5" />
                      <span>Role plays</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full">
                      <Users className="w-5 h-5" />
                      <span>AI Avatars</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full">
                      <BarChart2 className="w-5 h-5" />
                      <span>Analytics</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full">
                      <Settings className="w-5 h-5" />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full text-[#1E90FF]">
                      <HelpCircle className="w-5 h-5" />
                      <span>Support center</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="w-full">
                      <User className="w-5 h-5" />
                      <span>Account</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Avatar Selection */}
            <section>
              <h2 className="text-2xl font-semibold mb-6">Select your avatar:</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {avatars.map((avatar, index) => (
                  <div 
                    key={index}
                    className={`cursor-pointer text-center ${
                      selectedAvatar === `${avatar.name}-${avatar.style}` ? 'ring-2 ring-[#1E90FF] rounded-lg' : ''
                    }`}
                    onClick={() => setSelectedAvatar(`${avatar.name}-${avatar.style}`)}
                  >
                    <Avatar className="w-24 h-24 mx-auto mb-2">
                      <AvatarImage src={avatar.image} alt={`${avatar.name} ${avatar.style}`} />
                    </Avatar>
                    <p className="font-medium">{avatar.name}</p>
                    <p className="text-sm text-gray-500">{avatar.style}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Role Play Type Selection */}
            <section>
              <h2 className="text-2xl font-semibold mb-6">Type of role play:</h2>
              <div className="flex gap-4 flex-wrap">
                {rolePlayTypes.map((type) => (
                  <button
                    key={type}
                    className={`px-6 py-3 rounded-lg border ${
                      selectedRolePlay === type 
                        ? 'border-[#1E90FF] text-[#1E90FF]' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRolePlay(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </section>

            {/* Role Play Description */}
            <section>
              <h2 className="text-2xl font-semibold mb-6">
                Tell me about your role-play situation. What are you looking to achieve?
              </h2>
              <textarea
                value={rolePlayDescription}
                onChange={(e) => setRolePlayDescription(e.target.value)}
                placeholder="Start writing here..."
                className="w-full h-48 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent"
              />
            </section>

            {/* Generate Button */}
            <Button 
              className="w-full max-w-md mx-auto block py-6 text-lg bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
              onClick={() => {
                // Handle role play generation
                console.log("Generating role play with:", {
                  avatar: selectedAvatar,
                  type: selectedRolePlay,
                  description: rolePlayDescription
                });
              }}
            >
              Generate role play
            </Button>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
