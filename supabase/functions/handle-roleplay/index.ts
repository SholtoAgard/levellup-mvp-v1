
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoleplayRequest {
  sessionId: string;
  message?: string;
  context?: {
    avatar_id: string;
    roleplay_type: string;
    scenario_description: string;
  };
  requestScoring?: boolean;
}

// Define available avatars with their images and buyer personas
const avatars = {
  'chloe': {
    name: 'Chloe',
    image: 'avatars/chloe.jpg',
    personality: 'Detail-oriented procurement manager who focuses on ROI and needs extensive data to make decisions'
  },
  'noah': {
    name: 'Noah',
    image: 'avatars/noah.jpg',
    personality: 'Skeptical IT director who prioritizes security and integration capabilities'
  },
  'veronica': {
    name: 'Veronica',
    image: 'avatars/veronica.jpg',
    personality: 'Budget-conscious operations manager who needs convincing on value proposition'
  },
  'marcus': {
    name: 'Marcus',
    image: 'avatars/marcus.jpg',
    personality: 'Innovation-focused CTO who challenges vendors on technical specifications and scalability'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { sessionId, message, context, requestScoring } = await req.json() as RoleplayRequest;

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (requestScoring) {
      // Fetch all messages for analysis
      const { data: messages } = await supabaseClient
        .from('roleplay_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      const conversation = messages?.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');

      const systemPrompt = `You are an expert sales coach. Analyze this sales roleplay conversation and provide:
1. Scores out of 100 for: Confidence, Clarity, Engagement, Objection Handling, Value Proposition, and Closing Effectiveness
2. An overall score (average of all scores)
3. Specific feedback on strengths and areas for improvement
4. Format the response exactly like this:
SCORE: [overall score]
FEEDBACK: [detailed feedback]`;

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
            { role: 'user', content: conversation }
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Update session with score and feedback
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

      return new Response(JSON.stringify({ response: aiResponse }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle regular message exchange
    let systemPrompt = "You are an AI sales roleplay partner acting as a potential buyer. ";
    if (context) {
      const avatar = avatars[context.avatar_id as keyof typeof avatars];
      systemPrompt += `You are playing the role of ${avatar.name}, ${avatar.personality}. 
      You are evaluating ${context.scenario_description}
      
      Important guidelines:
      1. Always stay in character as a buyer who needs convincing
      2. Ask challenging but realistic questions about:
         - Pricing and ROI
         - Implementation and integration
         - Security and compliance (if relevant)
         - Competitor comparisons
         - Success stories and case studies
      3. Raise common objections naturally in the conversation
      4. Make the user work to earn your trust and business
      5. Don't be too easy to convince - make them properly address your concerns
      6. If they make good points, acknowledge them but raise new concerns
      7. Base your responses and objections on their previous statements
      8. Use your specific buyer persona to frame your concerns
      
      Remember: Your goal is to help the user improve their sales skills by providing realistic buyer challenges.`;
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

    // Store the message in the database
    if (message) {
      await supabaseClient
        .from('roleplay_messages')
        .insert([
          { session_id: sessionId, role: 'user', content: message },
          { session_id: sessionId, role: 'ai', content: aiResponse }
        ]);
    }

    // Get the public URL for the avatar image
    let avatarUrl = null;
    if (context?.avatar_id) {
      const avatar = avatars[context.avatar_id as keyof typeof avatars];
      const { data } = await supabaseClient
        .storage
        .from('avatars')
        .getPublicUrl(avatar.image);
      avatarUrl = data.publicUrl;
    }

    return new Response(JSON.stringify({ 
      response: aiResponse,
      avatar: avatarUrl 
    }), {
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
