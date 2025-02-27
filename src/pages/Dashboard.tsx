import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarProvider } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RoleplaySession, RoleplayMessage } from "@/lib/types";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import Footer from "@/components/Footer";
import { AvatarSelection } from "@/components/dashboard/AvatarSelection";
import { RolePlayTypeSelection } from "@/components/dashboard/RolePlayTypeSelection";
import { DescriptionInput } from "@/components/dashboard/DescriptionInput";
import { ChatInterface } from "@/components/dashboard/ChatInterface";
import { avatars, rolePlayTypes } from "@/components/dashboard/data";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedRolePlay, setSelectedRolePlay] = useState("");
  const [rolePlayDescription, setRolePlayDescription] = useState("");
  const [currentSession, setCurrentSession] = useState<RoleplaySession | null>(null);
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isDescriptionRecording, setIsDescriptionRecording] = useState(false);
  const descriptionMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const descriptionChunksRef = useRef<Blob[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const rolePlayTypeRef = useRef<HTMLDivElement>(null);

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    rolePlayTypeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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

    setIsLoading(true);

    try {
      const { data: userSession } = await supabase.auth.getSession();
      const userId = userSession.session?.user.id;

      if (!userId) {
        toast({
          title: "Error",
          description: "You must be logged in to start a roleplay session",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const selectedAvatarData = avatars.find(avatar => avatar.id === selectedAvatar);
      
      const { data: session, error } = await supabase
        .from('roleplay_sessions')
        .insert({
          user_id: userId,
          avatar_id: selectedAvatar,
          avatar_voice_id: selectedAvatarData?.voiceId,
          roleplay_type: selectedRolePlay,
          scenario_description: rolePlayDescription,
          status: 'in_progress' as const
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!session) {
        throw new Error('Failed to create session');
      }

      const typedSession: RoleplaySession = {
        id: session.id,
        avatar_id: session.avatar_id,
        avatar_voice_id: session.avatar_voice_id,
        roleplay_type: session.roleplay_type,
        scenario_description: session.scenario_description,
        status: session.status as 'in_progress' | 'completed' | 'abandoned',
        created_at: session.created_at,
        updated_at: session.updated_at,
        score: session.score || undefined,
        feedback: session.feedback || undefined
      };
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      navigate('/roleplay', { 
        state: { 
          session: typedSession 
        },
        replace: true
      });

      toast({
        title: "Roleplay Started",
        description: "You can now begin your conversation with the AI.",
      });
    } catch (error) {
      console.error('Error starting roleplay:', error);
      toast({
        title: "Error",
        description: "Failed to start roleplay session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (text?: string) => {
    if ((!text && !newMessage.trim()) || !currentSession) return;

    setIsLoading(true);
    try {
      const messageToSend = text || newMessage;
      const { data, error } = await supabase.functions.invoke('handle-roleplay', {
        body: {
          sessionId: currentSession.id,
          message: messageToSend,
          context: currentSession.status === 'in_progress' ? {
            avatar_id: currentSession.avatar_id,
            roleplay_type: currentSession.roleplay_type,
            scenario_description: currentSession.scenario_description
          } : undefined
        }
      });

      if (error) throw error;

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

  const requestScoring = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-roleplay', {
        body: {
          sessionId: currentSession.id,
          requestScoring: true
        }
      });

      if (error) {
        throw error;
      }

      const { data: updatedSession } = await supabase
        .from('roleplay_sessions')
        .select('*')
        .eq('id', currentSession.id)
        .single();

      if (updatedSession) {
        const typedSession: RoleplaySession = {
          id: updatedSession.id,
          avatar_id: updatedSession.avatar_id,
          roleplay_type: updatedSession.roleplay_type,
          scenario_description: updatedSession.scenario_description,
          status: updatedSession.status as 'in_progress' | 'completed' | 'abandoned',
          created_at: updatedSession.created_at,
          updated_at: updatedSession.updated_at,
          score: updatedSession.score || undefined,
          feedback: updatedSession.feedback || undefined
        };
        
        setCurrentSession(typedSession);

        toast({
          title: "Roleplay Analysis Complete",
          description: `Your score: ${typedSession.score}/100. Check the feedback for detailed insights.`,
        });
      }
    } catch (error) {
      console.error('Error getting score:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze roleplay",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio) {
            try {
              const { data, error } = await supabase.functions.invoke('handle-speech', {
                body: { audio: base64Audio, type: 'speech-to-text' }
              });

              if (error) throw error;
              if (data.text) {
                setNewMessage(data.text);
                await sendMessage(data.text);
              }
            } catch (error) {
              console.error('Error converting speech to text:', error);
              toast({
                title: "Error",
                description: "Failed to convert speech to text",
                variant: "destructive",
              });
            }
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const startDescriptionRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      descriptionMediaRecorderRef.current = mediaRecorder;
      descriptionChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          descriptionChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(descriptionChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio) {
            try {
              const { data, error } = await supabase.functions.invoke('handle-speech', {
                body: { audio: base64Audio, type: 'speech-to-text' }
              });

              if (error) throw error;
              if (data.text) {
                setRolePlayDescription(data.text);
              }
            } catch (error) {
              console.error('Error converting speech to text:', error);
              toast({
                title: "Error",
                description: "Failed to convert speech to text",
                variant: "destructive",
              });
            }
          }
        };
      };

      mediaRecorder.start();
      setIsDescriptionRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone",
        variant: "destructive",
      });
    }
  };

  const stopDescriptionRecording = () => {
    if (descriptionMediaRecorderRef.current && isDescriptionRecording) {
      descriptionMediaRecorderRef.current.stop();
      descriptionMediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsDescriptionRecording(false);
    }
  };

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
              {!currentSession ? (
                <>
                  <AvatarSelection
                    avatars={avatars}
                    selectedAvatar={selectedAvatar}
                    onSelect={handleAvatarSelect}
                  />

                  <RolePlayTypeSelection
                    ref={rolePlayTypeRef}
                    types={rolePlayTypes}
                    selectedType={selectedRolePlay}
                    onSelect={setSelectedRolePlay}
                  />

                  <DescriptionInput
                    value={rolePlayDescription}
                    onChange={setRolePlayDescription}
                    isRecording={isDescriptionRecording}
                    onStartRecording={startDescriptionRecording}
                    onStopRecording={stopDescriptionRecording}
                  />

                  <Button 
                    className="w-full max-w-md mx-auto block py-6 text-lg bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
                    onClick={startRoleplay}
                    data-start-roleplay
                  >
                    Start Role Play
                  </Button>
                </>
              ) : (
                <ChatInterface
                  session={currentSession}
                  messages={messages}
                  onSendMessage={sendMessage}
                  onRequestScoring={requestScoring}
                  isRecording={isRecording}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  isLoading={isLoading}
                  newMessage={newMessage}
                  onNewMessageChange={setNewMessage}
                />
              )}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
