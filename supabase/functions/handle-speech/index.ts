
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import OpenAI from "https://esm.sh/openai@4.20.1"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audio, type, text, voiceId, sessionId, context } = await req.json()

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    });

    // Initialize Supabase client if we need to store messages
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    if (type === 'speech-to-text') {
      if (!audio) {
        throw new Error('No audio data provided')
      }

      // Process audio data
      const audioData = new Uint8Array(atob(audio).split('').map(char => char.charCodeAt(0)));
      const blob = new Blob([audioData], { type: 'audio/webm' });
      
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper API error:', errorText);
        throw new Error(`Whisper API error: ${errorText}`);
      }

      const data = await response.json();
      console.log('Transcribed text:', data.text);
      
      // Store user message if session exists
      if (sessionId) {
        await supabase
          .from('roleplay_messages')
          .insert({
            session_id: sessionId,
            role: 'user',
            content: data.text
          });
      }

      // If we have context, get AI response
      if (context) {
        // Get previous messages for context
        const { data: previousMessages } = await supabase
          .from('roleplay_messages')
          .select('content, role')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(10);

        const messages = [
          {
            role: 'system',
            content: `You are ${context.avatar_id}, engaged in a ${context.roleplay_type}. 
                     Scenario: ${context.scenario_description}
                     Respond naturally and conversationally, keeping responses concise.`
          },
          ...(previousMessages?.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })) || []),
          {
            role: 'user',
            content: data.text
          }
        ];

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: messages,
          temperature: 0.7,
          max_tokens: 150
        });

        const aiResponse = completion.choices[0].message.content;
        console.log('AI response:', aiResponse);

        // Store AI response
        if (sessionId) {
          await supabase
            .from('roleplay_messages')
            .insert({
              session_id: sessionId,
              role: 'assistant',
              content: aiResponse
            });
        }

        return new Response(
          JSON.stringify({ text: data.text, response: aiResponse }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ text: data.text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (type === 'text-to-speech') {
      if (!text) {
        throw new Error('Text is required for text-to-speech');
      }

      try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1',
            voice: 'alloy',
            input: text,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Text-to-speech API error:', errorData);
          throw new Error('Failed to generate speech: ' + errorData);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(arrayBuffer))
        );

        return new Response(
          JSON.stringify({ audioContent: base64Audio }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error in text-to-speech:', error);
        throw error;
      }
    }

    throw new Error('Invalid type specified');
  } catch (error) {
    console.error('Error in handle-speech function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
