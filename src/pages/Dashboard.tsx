
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { HomeIcon, Users, HelpCircle, User, Send, Mic, StopCircle, Volume2 } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { RoleplaySession, RoleplayMessage } from "@/lib/types";

const avatars = [
  { 
    id: "chloe", 
    name: "Chloe", 
    style: "SaaS Sales", 
    personality: "Friendly and professional SaaS sales representative",
    voiceId: "EXAVITQu4vr4xnSDxMaL" // Sarah voice
  },
  { 
    id: "noah", 
    name: "Noah", 
    style: "Enterprise", 
    personality: "Experienced enterprise software consultant",
    voiceId: "TX3LPaxmHKxFdv7VOQHJ" // Liam voice
  },
  { 
    id: "veronica", 
    name: "Veronica", 
    style: "B2B Sales", 
    personality: "Strategic B2B sales director",
    voiceId: "pFZP5JQG7iQjIQuC4Bku" // Lily voice
  },
  { 
    id: "marcus", 
    name: "Marcus", 
    style: "Technical", 
    personality: "Technical sales engineer",
    voiceId: "CwhRBWXzGAHq8TQ4Fs17" // Roger voice
  }
];

const rolePlayTypes = ["cold call", "discovery call"];

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isDescriptionRecording, setIsDescriptionRecording] = useState(false);
  const descriptionMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const descriptionChunksRef = useRef<Blob[]>([]);

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
        avatar_voice_id: session.avatar_voice_id,
        roleplay_type: session.roleplay_type,
        scenario_description: session.scenario_description,
        status: session.status as 'in_progress' | 'completed' | 'abandoned',
        created_at: session.created_at,
        updated_at: session.updated_at,
        score: session.score || undefined,
        feedback: session.feedback || undefined
      };
      
      navigate('/roleplay', { state: { session: typedSession } });
      toast({
        title: "Roleplay Started",
        description: "You can now begin your conversation with the AI.",
      });
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
      
      // Speak the AI's response
      if (data.response) {
        await speakText(data.response);
      }
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

  const speakText = async (text: string) => {
    if (isSpeaking) return;
    
    try {
      setIsSpeaking(true);
      const { data, error } = await supabase.functions.invoke('handle-speech', {
        body: { audio: text, type: 'text-to-speech' }
      });

      if (error) throw error;

      if (data.audioContent) {
        const binaryString = atob(data.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      }
    } catch (error) {
      console.error('Error converting text to speech:', error);
      toast({
        title: "Error",
        description: "Failed to convert text to speech",
        variant: "destructive",
      });
      setIsSpeaking(false);
    }
  };

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
            {!currentSession ? (
              <>
                <section>
                  <h2 className="text-2xl font-semibold mb-6">Select an AI Avatar:</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {avatars.map((avatar) => {
                      const avatarPublicUrl = supabase.storage
                        .from('avatars')
                        .getPublicUrl(`${avatar.id}.jpg`).data.publicUrl;

                      return (
                        <div 
                          key={avatar.id}
                          className={`cursor-pointer text-center p-4 rounded-lg transition-all ${
                            selectedAvatar === avatar.id 
                              ? 'ring-2 ring-[#1E90FF] bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedAvatar(avatar.id)}
                        >
                          <Avatar className="w-32 h-32 mx-auto mb-4 rounded-lg">
                            <AvatarImage src={avatarPublicUrl} alt={avatar.name} />
                          </Avatar>
                          <h3 className="font-semibold text-lg text-gray-900">{avatar.name}</h3>
                          <p className="text-sm text-gray-500 mb-2">{avatar.style}</p>
                          <p className="text-xs text-gray-600">{avatar.personality}</p>
                        </div>
                      );
                    })}
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
                  <div className="relative">
                    <textarea
                      value={rolePlayDescription}
                      onChange={(e) => setRolePlayDescription(e.target.value)}
                      placeholder="Start writing here..."
                      className="w-full h-48 p-4 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#1E90FF] focus:border-transparent pr-12"
                    />
                    <Button
                      className={`absolute right-2 top-2 ${
                        isDescriptionRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                      } text-white rounded-full p-2`}
                      size="icon"
                      onClick={isDescriptionRecording ? stopDescriptionRecording : startDescriptionRecording}
                    >
                      {isDescriptionRecording ? (
                        <StopCircle className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
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
                {currentSession.score !== undefined && currentSession.feedback && (
                  <div className="mb-4 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">Roleplay Analysis</h3>
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-blue-600">
                        Score: {currentSession.score}/100
                      </div>
                    </div>
                    <div className="prose">
                      <h4 className="text-lg font-semibold mb-2">Feedback</h4>
                      <p className="whitespace-pre-wrap">{currentSession.feedback}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex-1 flex">
                  {/* Avatar Section */}
                  <div className="w-1/3 p-4 flex flex-col items-center">
                    {currentSession.avatar_id && (
                      <>
                        <div className="relative w-64 h-64 mb-4">
                          <Avatar className="w-full h-full rounded-lg">
                            <AvatarImage 
                              src={supabase.storage
                                .from('avatars')
                                .getPublicUrl(`${currentSession.avatar_id}.jpg`).data.publicUrl} 
                              alt={avatars.find(a => a.id === currentSession.avatar_id)?.name} 
                            />
                          </Avatar>
                          {isRecording && (
                            <div className="absolute bottom-4 right-4 w-4 h-4">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                            </div>
                          )}
                          {isSpeaking && (
                            <div className="absolute bottom-4 right-4 w-4 h-4">
                              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                            </div>
                          )}
                        </div>
                        <h2 className="text-xl font-semibold mb-2">
                          {avatars.find(a => a.id === currentSession.avatar_id)?.name}
                        </h2>
                        <p className="text-sm text-gray-600 text-center mb-4">
                          {avatars.find(a => a.id === currentSession.avatar_id)?.personality}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Chat Section */}
                  <div className="w-2/3 flex flex-col">
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
                            } relative group`}
                          >
                            {message.content}
                            {message.role === 'ai' && (
                              <Button
                                className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                variant="secondary"
                                size="icon"
                                onClick={() => speakText(message.content)}
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                            )}
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
                        className={`${isRecording ? 'bg-red-500' : 'bg-blue-500'} hover:bg-opacity-90 text-white`}
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        {isRecording ? (
                          <StopCircle className="w-5 h-5" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </Button>
                      <Button
                        className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white px-6"
                        onClick={() => sendMessage()}
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
                      {messages.length > 0 && !currentSession.score && (
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white px-6"
                          onClick={requestScoring}
                          disabled={isLoading}
                        >
                          Get Feedback
                        </Button>
                      )}
                    </div>
                  </div>
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
