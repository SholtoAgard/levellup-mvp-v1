
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
        throw new Error(`Whisper API error: ${await response.text()}`);
      }

      const data = await response.json();
      
      // If we have context, process the message through the roleplay handler
      if (sessionId && context) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Store user message
        await supabase
          .from('roleplay_messages')
          .insert({
            session_id: sessionId,
            role: 'user',
            content: data.text
          });

        // Get AI response
        const completion = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: `You are ${context.avatar_id}, an AI avatar engaged in a ${context.roleplay_type}. 
                         Scenario: ${context.scenario_description}
                         Respond naturally and conversationally, keeping responses concise.`
              },
              {
                role: 'user',
                content: data.text
              }
            ]
          })
        });

        if (!completion.ok) {
          throw new Error('Failed to get AI response');
        }

        const aiResponse = await completion.json();
        const aiMessage = aiResponse.choices[0].message.content;

        // Store AI response
        await supabase
          .from('roleplay_messages')
          .insert({
            session_id: sessionId,
            role: 'ai',
            content: aiMessage
          });

        return new Response(
          JSON.stringify({ text: data.text, response: aiMessage }),
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

      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': Deno.env.get('ELEVEN_LABS_API_KEY') || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', errorText);
        throw new Error('Failed to generate speech: ' + errorText);
      }

      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const chunks = [];
      const chunkSize = 8192;
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        chunks.push(String.fromCharCode.apply(null, bytes.slice(i, i + chunkSize)));
      }
      
      const base64Audio = btoa(chunks.join(''));

      return new Response(
        JSON.stringify({ audioContent: base64Audio }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
