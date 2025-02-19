
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MAILERLITE_API_KEY = Deno.env.get("MAILERLITE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TrialUserRequest {
  email: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId }: TrialUserRequest = await req.json();
    console.log(`Adding trial user to MailerLite onboarding sequence: ${email}`);

    // First, get the groups to find the trial-users group ID
    const groupsResponse = await fetch('https://connect.mailerlite.com/api/groups', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      },
    });

    const groupsData = await groupsResponse.json();
    console.log("MailerLite groups:", groupsData);

    // Find the trial-users group
    const trialGroup = groupsData.data.find((group: any) => group.name === "trial-users");
    
    if (!trialGroup) {
      throw new Error("Trial users group not found in MailerLite. Please create a group named 'trial-users'");
    }

    // Add subscriber using the group ID
    const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({
        email: email,
        groups: [trialGroup.id], // Using the group ID instead of name
        status: 'active',
        fields: {
          user_id: userId,
          signup_date: new Date().toISOString(),
        }
      }),
    });

    const data = await response.json();
    console.log("MailerLite API response:", data);

    if (!response.ok) {
      throw new Error(data.message || 'Failed to add subscriber to MailerLite');
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error adding trial user:", error);
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
