import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.3.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoleplayContext {
  avatar_id: string;
  roleplay_type: string;
  scenario_description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, message, requestScoring, context } = await req.json();

    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const openai = new OpenAIApi(configuration);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (requestScoring) {
      // Fetch all messages from the session for analysis
      const { data: messages, error: messagesError } = await supabaseClient
        .from('roleplay_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Prepare conversation history for analysis
      const conversationHistory = messages.map(msg => 
        `${msg.role.toUpperCase()}: ${msg.content}`
      ).join('\n');

      // Generate the scoring prompt
      const scoringPrompt = `
        You are an expert sales coach analyzing a sales conversation. Below is a conversation between a salesperson and a potential customer.
        
        CONVERSATION:
        ${conversationHistory}
        
        Based on this conversation, provide:
        1. A score out of 100
        2. 3-5 specific strengths demonstrated by the salesperson
        3. 3-5 specific areas for improvement, including practical examples
        
        Focus on evaluating:
        - Opening and rapport building
        - Question quality and active listening
        - Pain point identification
        - Value proposition presentation
        - Objection handling
        - Call control and confidence
        - Solution positioning
        
        Format your response exactly as follows:
        SCORE: [number]
        STRENGTHS:
        - [strength 1]
        - [strength 2]
        - [strength 3]
        IMPROVEMENTS:
        - [improvement 1]
        - [improvement 2]
        - [improvement 3]
      `;

      const completion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{
          role: "system",
          content: scoringPrompt
        }],
        temperature: 0.7,
      });

      const response = completion.data.choices[0].message?.content;
      console.log("AI Response:", response);

      if (!response) {
        throw new Error("Failed to generate feedback");
      }

      // Parse the response
      const scoreMatch = response.match(/SCORE:\s*(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

      // Extract strengths
      const strengthsMatch = response.match(/STRENGTHS:\n((?:- .*\n?)*)/);
      const strengths = strengthsMatch
        ? strengthsMatch[1]
            .split('\n')
            .filter(line => line.startsWith('- '))
            .map(line => line.substring(2).trim())
        : [];

      // Extract improvements
      const improvementsMatch = response.match(/IMPROVEMENTS:\n((?:- .*\n?)*)/);
      const improvements = improvementsMatch
        ? improvementsMatch[1]
            .split('\n')
            .filter(line => line.startsWith('- '))
            .map(line => line.substring(2).trim())
        : [];

      return new Response(
        JSON.stringify({
          score,
          strengths,
          improvements
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle regular message exchange
    let systemPrompt = "You are an AI sales roleplay partner acting as a potential buyer. ";
    
    if (context) {
      systemPrompt += `You are evaluating ${context.scenario_description}
      
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
      8. Keep your responses focused on the specific ${context.roleplay_type} context
      
      Remember: Your goal is to help the user improve their sales skills by providing realistic buyer challenges.`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Store the message in the database
    if (message) {
      await supabaseClient.from("roleplay_messages").insert([
        { session_id: sessionId, role: "user", content: message },
        { session_id: sessionId, role: "ai", content: aiResponse },
      ]);
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
