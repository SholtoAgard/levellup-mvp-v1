
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  firstName: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, email }: WelcomeEmailRequest = await req.json();
    console.log(`Sending welcome email to ${email}`);

    const emailResponse = await resend.emails.send({
      from: "LevellUp Sales <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to LevellUp Sales Newsletter! 🚀",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to LevellUp Sales, ${firstName}! 🎉</h1>
          
          <p>I'm thrilled to have you join our community of ambitious sales professionals!</p>
          
          <p>Here's what you can expect from the LevellUp Sales Newsletter:</p>
          
          <ul>
            <li>Weekly tactical tips to improve your sales game</li>
            <li>Proven strategies from top performers</li>
            <li>Exclusive resources and templates</li>
            <li>Real-world examples and case studies</li>
          </ul>
          
          <p>As promised, here's your <a href="https://docs.google.com/document/d/1jMLzuxKaRcTB1qLulwOFYu_YmOyECmerFGkqW-r_ooQ/edit?tab=t.0">FREE SaaS Cold Call Script</a> that has generated over $50K in commission & bonuses!</p>
          
          <p>Keep an eye on your inbox - your first valuable insights are coming soon!</p>
          
          <p>To your success,<br>Ian Agard<br>Founder, LevellUp Sales</p>
        </div>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
