
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { stripe } from '../_shared/stripe.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const STRIPE_PRICE_ID = Deno.env.get('STRIPE_PRICE_ID')!

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Get the request body
    const { paymentMethodId, userId, email } = await req.json()
    console.log('Received request:', { paymentMethodId, userId, email })

    if (!paymentMethodId || !userId || !email) {
      console.error('Missing required fields:', { paymentMethodId, userId, email })
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if user already has a subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // If user already has a subscription, return success
    if (profile?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ message: 'Subscription already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create or get existing Stripe customer
    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
      customerId = customer.id
    }

    // Create subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: STRIPE_PRICE_ID }],
      trial_period_days: 4,
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
    })

    // Update user's profile with subscription info
    const trialEnd = new Date(subscription.trial_end! * 1000)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEnd.toISOString(),
        is_trial_used: true,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Attempt to clean up Stripe resources
      await stripe.subscriptions.del(subscription.id)
      return new Response(
        JSON.stringify({ error: 'Failed to update user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    return new Response(
      JSON.stringify({ 
        message: 'Subscription created successfully',
        subscription: subscription.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error occurred',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
