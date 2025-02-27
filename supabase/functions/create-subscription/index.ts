
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { stripe } from '../_shared/stripe.ts'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Fetch this from environment variable instead of hardcoding
const STRIPE_PRICE_ID = Deno.env.get('STRIPE_PRICE_ID')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    // Get the request body
    const { paymentMethodId, userId } = await req.json()
    console.log('Received request:', { paymentMethodId, userId })

    if (!paymentMethodId || !userId) {
      console.error('Missing required fields:', { paymentMethodId, userId })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: paymentMethodId or userId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!STRIPE_PRICE_ID) {
      console.error('Missing STRIPE_PRICE_ID environment variable')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing price ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get user's email from auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError) {
      console.error('User fetch error:', userError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user details', details: userError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    if (!user) {
      console.error('User not found for ID:', userId)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }
    console.log('Found user:', { email: user.email })

    // Check if user already has an active subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_trial_used, trial_ends_at, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile', details: profileError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (profile?.stripe_customer_id) {
      console.error('User already has a Stripe customer ID:', profile.stripe_customer_id)
      return new Response(
        JSON.stringify({ error: 'User already has an active subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create a customer in Stripe
    console.log('Creating Stripe customer...')
    let customer;
    try {
      customer = await stripe.customers.create({
        email: user.email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
      console.log('Created Stripe customer:', customer.id)
    } catch (stripeError) {
      console.error('Stripe customer creation error:', stripeError)
      return new Response(
        JSON.stringify({ error: 'Failed to create Stripe customer', details: stripeError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create a subscription with a trial period
    console.log('Creating Stripe subscription...')
    let subscription;
    try {
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: STRIPE_PRICE_ID }],
        trial_period_days: 4,
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
      })
      console.log('Created subscription:', subscription.id)
    } catch (stripeError) {
      console.error('Stripe subscription creation error:', stripeError)
      // Clean up the customer if subscription creation fails
      await stripe.customers.del(customer.id)
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription', details: stripeError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Update user's profile with trial information
    const trialEnd = new Date(subscription.trial_end * 1000)
    console.log('Updating user profile with trial info:', {
      trial_started_at: new Date().toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
    })

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        trial_started_at: new Date().toISOString(),
        trial_ends_at: trialEnd.toISOString(),
        is_trial_used: true,
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Attempt to clean up Stripe resources on failure
      await stripe.subscriptions.del(subscription.id)
      await stripe.customers.del(customer.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to update user profile', details: updateError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Successfully completed subscription setup')
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
    console.error('Unexpected error in create-subscription:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected error occurred',
        message: error.message,
        details: error.raw ? error.raw : error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
