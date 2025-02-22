import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const coldCallPersonas = {
  // Executive personas with specific behaviors
  chloe: {
    initialResponses: [
      "I'm in the middle of something, make it quick.",
      "Who is this? How did you get my number?",
      "*sounds of typing* Yes, what is it?",
    ],
    traits: {
      patience: 2, // 1-10 scale, lower means more likely to hang up
      interruptionThreshold: 3, // How many times they'll let the rep speak before interrupting
      emailDeflection: true, // Likely to ask for email instead
    }
  },
  noah: {
    initialResponses: [
      "*sigh* I'm walking into a meeting in 2 minutes.",
      "Look, I'm really busy right now.",
      "Not interested, unless you can tell me something valuable in 10 seconds.",
    ],
    traits: {
      patience: 3,
      interruptionThreshold: 2,
      emailDeflection: true,
    }
  },
  // Add similar configurations for other avatars...
};

const generateColdCallResponse = (avatar: string, message: string, context: any) => {
  const persona = coldCallPersonas[avatar as keyof typeof coldCallPersonas];
  
  // Initial call behavior
  if (!context.conversationStarted) {
    const randomResponse = persona.initialResponses[Math.floor(Math.random() * persona.initialResponses.length)];
    return {
      response: randomResponse,
      context: { ...context, conversationStarted: true, interruptionCount: 0 }
    };
  }

  // Implement gatekeeping behavior
  if (message.length > 100 && persona.traits.interruptionThreshold > context.interruptionCount) {
    return {
      response: "Sorry, but could you get to the point? What exactly are you offering?",
      context: { ...context, interruptionCount: context.interruptionCount + 1 }
    };
  }

  // Email deflection behavior
  if (persona.traits.emailDeflection && !context.hasRequestedEmail && Math.random() < 0.3) {
    return {
      response: "Look, why don't you just send me an email with the details? I'll take a look when I have time.",
      context: { ...context, hasRequestedEmail: true }
    };
  }

  return { response: "", context }; // Allow normal response generation if no special behavior is triggered
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, context, requestScoring } = await req.json();

    // Set up Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // If scoring is requested, handle that separately
    if (requestScoring) {
      const { data: messages } = await supabaseClient
        .from('roleplay_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n');

      const { data: session } = await supabaseClient
        .from('roleplay_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `You are an expert sales coach. Analyze the following ${session.roleplay_type} conversation and provide:
              1. A score out of 100
              2. Detailed feedback on what went well and what could be improved
              3. Specific suggestions for improvement
              
              Consider factors like:
              - Opening effectiveness
              - Questioning technique
              - Value proposition
              - Objection handling
              - Call control
              - Next steps/closure`
            },
            {
              role: 'user',
              content: conversation
            }
          ],
          temperature: 0.7,
        })
      });

      const openaiData = await openaiResponse.json();
      const feedback = openaiData.choices[0].message.content;

      // Extract score from feedback (assuming it's in the first line)
      const scoreMatch = feedback.match(/(\d+)\/100/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : null;

      // Update session with score and feedback
      await supabaseClient
        .from('roleplay_sessions')
        .update({
          score: score,
          feedback: feedback,
          status: 'completed'
        })
        .eq('id', sessionId);

      return new Response(
        JSON.stringify({ score, feedback }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the session to get avatar and roleplay type
    const { data: session, error: sessionError } = await supabaseClient
      .from('roleplay_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Store the message in the database
    const { error: messageError } = await supabaseClient
      .from('roleplay_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      });

    if (messageError) throw messageError;

    // Generate response based on roleplay type
    let aiResponse = "";
    let updatedContext = context;

    if (session.roleplay_type === "cold call") {
      // Check for cold call specific behaviors
      const coldCallBehavior = generateColdCallResponse(session.avatar_id, message, context);
      
      if (coldCallBehavior.response) {
        aiResponse = coldCallBehavior.response;
        updatedContext = coldCallBehavior.context;
      } else {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: `You are ${session.avatar_id}, a ${session.roleplay_type} participant. ${session.scenario_description}`
              },
              {
                role: 'user',
                content: message
              }
            ],
            temperature: 0.7,
          })
        });

        const openaiData = await openaiResponse.json();
        aiResponse = openaiData.choices[0].message.content;
      }
    } else {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: `You are ${session.avatar_id}, a ${session.roleplay_type} participant. ${session.scenario_description}`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
        })
      });

      const openaiData = await openaiResponse.json();
      aiResponse = openaiData.choices[0].message.content;
    }

    // Store AI response in the database
    const { error: aiMessageError } = await supabaseClient
      .from('roleplay_messages')
      .insert({
        session_id: sessionId,
        role: 'ai',
        content: aiResponse,
      });

    if (aiMessageError) throw aiMessageError;

    return new Response(
      JSON.stringify({ response: aiResponse, context: updatedContext }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
