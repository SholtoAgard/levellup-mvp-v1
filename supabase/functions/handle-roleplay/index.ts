
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoleplayRequest {
  sessionId: string;
  message: string;
  context?: {
    avatar_id: string;
    roleplay_type: string;
    scenario_description: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { sessionId, message, context } = await req.json() as RoleplayRequest;

    let systemPrompt = "You are an AI sales roleplay partner. ";
    if (context) {
      systemPrompt += `You are playing the role of a prospect in a ${context.roleplay_type} scenario. ${context.scenario_description}
      Provide realistic responses, objections, and challenges that a prospect might raise. Be engaging but also challenging.
      After a few exchanges, provide a score out of 100 and specific feedback on the user's sales approach.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store the message in the database
    await supabaseClient
      .from('roleplay_messages')
      .insert([
        { session_id: sessionId, role: 'user', content: message },
        { session_id: sessionId, role: 'ai', content: aiResponse }
      ]);

    // Check if the response includes a score (assuming the AI includes it in a specific format)
    if (aiResponse.includes('SCORE:')) {
      const scoreMatch = aiResponse.match(/SCORE:\s*(\d+)/);
      const feedbackMatch = aiResponse.match(/FEEDBACK:([\s\S]+)/);
      
      if (scoreMatch && feedbackMatch) {
        const score = parseInt(scoreMatch[1]);
        const feedback = feedbackMatch[1].trim();
        
        await supabaseClient
          .from('roleplay_sessions')
          .update({ 
            score, 
            feedback,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
