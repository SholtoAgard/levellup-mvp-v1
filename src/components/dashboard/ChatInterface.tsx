
import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Send, Mic, StopCircle, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { RoleplayMessage, RoleplaySession } from "@/lib/types";

interface ChatInterfaceProps {
  session: RoleplaySession;
  messages: RoleplayMessage[];
  onSendMessage: (text?: string) => Promise<void>;
  onRequestScoring: () => Promise<void>;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isLoading: boolean;
  newMessage: string;
  onNewMessageChange: (message: string) => void;
}

export const ChatInterface = ({
  session,
  messages,
  onSendMessage,
  onRequestScoring,
  isRecording,
  onStartRecording,
  onStopRecording,
  isLoading,
  newMessage,
  onNewMessageChange,
}: ChatInterfaceProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

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
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      }
    } catch (error) {
      console.error('Error converting text to speech:', error);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {session.score !== undefined && session.feedback && (
        <div className="mb-4 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Roleplay Analysis</h3>
          <div className="mb-4">
            <div className="text-3xl font-bold text-blue-600">
              Score: {session.score}/100
            </div>
          </div>
          <div className="prose">
            <h4 className="text-lg font-semibold mb-2">Feedback</h4>
            <p className="whitespace-pre-wrap">{session.feedback}</p>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex">
        <div className="w-1/3 p-4 flex flex-col items-center">
          <div className="relative w-64 h-64 mb-4">
            <Avatar className="w-full h-full">
              <AvatarImage 
                src={supabase.storage
                  .from('avatars')
                  .getPublicUrl(`${session.avatar_id}.jpg`).data.publicUrl} 
                alt={session.avatar_id} 
              />
            </Avatar>
          </div>
          <h2 className="text-xl font-semibold mb-2">{session.avatar_id}</h2>
        </div>

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
              onChange={(e) => onNewMessageChange(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E90FF]"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
            />
            <Button
              className={`${isRecording ? 'bg-red-500' : 'bg-blue-500'} hover:bg-opacity-90 text-white`}
              onClick={isRecording ? onStopRecording : onStartRecording}
            >
              {isRecording ? (
                <StopCircle className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
            <Button
              className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white px-6"
              onClick={() => onSendMessage()}
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
            {messages.length > 0 && !session.score && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white px-6"
                onClick={onRequestScoring}
                disabled={isLoading}
              >
                Get Feedback
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
