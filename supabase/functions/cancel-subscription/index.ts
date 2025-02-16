
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { stripe } from '../_shared/stripe.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get the user ID from the request
    const { user_id } = await req.json()
    
    if (!user_id) {
      throw new Error('User ID is required')
    }

    // Get the user's profile to find their Stripe subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', user_id)
      .single()

    if (profileError || !profile?.stripe_subscription_id) {
      throw new Error('No active subscription found')
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.cancel(profile.stripe_subscription_id)

    // Update the profile to reflect cancellation
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        trial_ends_at: null,
        is_trial_used: true,
        stripe_subscription_id: null
      })
      .eq('id', user_id)

    if (updateError) {
      throw new Error('Failed to update profile')
    }

    return new Response(
      JSON.stringify({ success: true, subscription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
