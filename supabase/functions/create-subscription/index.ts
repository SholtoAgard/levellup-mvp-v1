
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { stripe } from '../_shared/stripe.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Get the request body
    const { paymentMethodId, userId } = await req.json()

    // Get user's email from auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user) throw new Error('User not found')

    // Create a customer in Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    // Create a subscription with a trial period
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: 'price_1QsYdjHYcRfijJBsdznMm16k' }], // Updated with the correct price ID
      trial_period_days: 4,
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
    })

    // Update user's profile with trial information
    const trialEnd = new Date(subscription.trial_end * 1000)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEnd.toISOString(),
        is_trial_used: true,
      })
      .eq('id', userId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        subscription,
        customer,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
