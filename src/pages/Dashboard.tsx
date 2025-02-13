import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { HomeIcon, Users, BarChart2, Settings, HelpCircle, User, Send } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RoleplaySession, RoleplayMessage } from "@/lib/types";

const avatars = [
  { id: "chloe-formal-1", name: "Chloe", style: "Formal 1", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { id: "chloe-formal-2", name: "Chloe", style: "Formal 2", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { id: "noah-casual", name: "Noah", style: "Casual", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { id: "noah-formal-3", name: "Noah", style: "Formal 3", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { id: "noah-formal-2", name: "Noah", style: "Formal 2", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { id: "veronica-formal", name: "Veronica", style: "Formal", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { id: "aliyah-formal", name: "Aliyah", style: "Formal", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
  { id: "raj-formal-1", name: "Raj", style: "Formal 1", image: "/lovable-uploads/7b00384f-75a0-4304-8793-1f2642d915c7.png" },
];

const rolePlayTypes = ["cold call", "discovery call", "product demo"];

const Dashboard = () => {
  const { toast } = useToast();
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedRolePlay, setSelectedRolePlay] = useState("");
  const [rolePlayDescription, setRolePlayDescription] = useState("");
  const [currentSession, setCurrentSession] = useState<RoleplaySession | null>(null);
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentSession) {
      loadMessages();
    }
  }, [currentSession]);

  const loadMessages = async () => {
    if (!currentSession) return;

    const { data, error } = await supabase
      .from('roleplay_messages')
      .select('*')
      .eq('session_id', currentSession.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      return;
    }

    if (data) {
      const typedMessages: RoleplayMessage[] = data.map(msg => ({
        id: msg.id,
        session_id: msg.session_id,
        role: msg.role as 'user' | 'ai',
        content: msg.content,
        created_at: msg.created_at
      }));
      setMessages(typedMessages);
    }
  };

  const startRoleplay = async () => {
    if (!selectedAvatar || !selectedRolePlay || !rolePlayDescription) {
      toast({
        title: "Missing Information",
        description: "Please select an avatar, role play type, and provide a scenario description.",
        variant: "destructive",
      });
      return;
    }

    const { data: userSession } = await supabase.auth.getSession();
    const userId = userSession.session?.user.id;

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to start a roleplay session",
        variant: "destructive",
      });
      return;
    }

    const { data: session, error } = await supabase
      .from('roleplay_sessions')
      .insert({
        user_id: userId,
        avatar_id: selectedAvatar,
        roleplay_type: selectedRolePlay,
        scenario_description: rolePlayDescription,
        status: 'in_progress' as const
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to start roleplay session",
        variant: "destructive",
      });
      return;
    }

    if (session) {
      const typedSession: RoleplaySession = {
        id: session.id,
        avatar_id: session.avatar_id,
        roleplay_type: session.roleplay_type,
        scenario_description: session.scenario_description,
        status: session.status as 'in_progress' | 'completed' | 'abandoned',
        created_at: session.created_at,
        updated_at: session.updated_at,
        score: session.score || undefined,
        feedback: session.feedback || undefined
      };
      
      setCurrentSession(typedSession);
      toast({
        title: "Roleplay Started",
        description: "You can now begin your conversation with the AI.",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentSession) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-roleplay', {
        body: {
          sessionId: currentSession.id,
          message: newMessage,
          context: currentSession.status === 'in_progress' ? {
            avatar_id: currentSession.avatar_id,
            roleplay_type: currentSession.roleplay_type,
            scenario_description: currentSession.scenario_description
          } : undefined
        }
      });

      if (error) {
        throw error;
      }

      setNewMessage("");
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
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

        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-12">
            {!currentSession ? (
              <>
                <section>
                  <h2 className="text-2xl font-semibold mb-6">Select your avatar:</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                    {avatars.map((avatar) => (
                      <div 
                        key={avatar.id}
                        className={`cursor-pointer text-center ${
                          selectedAvatar === avatar.id ? 'ring-2 ring-[#1E90FF] rounded-lg' : ''
                        }`}
                        onClick={() => setSelectedAvatar(avatar.id)}
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

                <Button 
                  className="w-full max-w-md mx-auto block py-6 text-lg bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
                  onClick={startRoleplay}
                >
                  Start Role Play
                </Button>
              </>
            ) : (
              <div className="h-[calc(100vh-8rem)] flex flex-col">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-lg">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-4 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-[#1E90FF] text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white px-6"
                    onClick={sendMessage}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
