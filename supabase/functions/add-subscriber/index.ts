
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const MAILERLITE_API_KEY = Deno.env.get("MAILERLITE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubscriberRequest {
  firstName: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, email }: SubscriberRequest = await req.json();
    console.log(`Adding subscriber to MailerLite newsletter list: ${email}`);

    // First, get the groups to find the newsletter list group ID
    const groupsResponse = await fetch('https://connect.mailerlite.com/api/groups', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
      },
    });

    const groupsData = await groupsResponse.json();
    console.log("MailerLite groups:", groupsData);

    // Find the newsletter list group
    const newsletterGroup = groupsData.data.find((group: any) => group.name === "newsletter list");
    
    if (!newsletterGroup) {
      throw new Error("Newsletter list group not found in MailerLite. Please create a group named 'newsletter list'");
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
        fields: {
          name: firstName,
        },
        groups: [newsletterGroup.id],
        status: 'active',
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
    console.error("Error adding subscriber:", error);
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
