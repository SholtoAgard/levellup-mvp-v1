
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
    console.log('Received request:', { paymentMethodId, userId })

    // Get user's email from auth.users
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError) {
      console.error('User fetch error:', userError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user details' }),
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
      .select('is_trial_used, trial_ends_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (profile?.is_trial_used) {
      console.error('User has already used their trial')
      return new Response(
        JSON.stringify({ error: 'Trial has already been used for this account' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create a customer in Stripe
    console.log('Creating Stripe customer...')
    const customer = await stripe.customers.create({
      email: user.email,
      payment_method: paymentMethodId,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })
    console.log('Created Stripe customer:', customer.id)

    // Create a subscription with a trial period
    console.log('Creating Stripe subscription...')
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: 'price_1OymKQHYcRfijJBsKTfxmhD7' }], // Monthly subscription price ID
      trial_period_days: 4,
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
    })
    console.log('Created subscription:', subscription.id)

    // Update user's profile with trial information
    const trialEnd = new Date(subscription.trial_end * 1000)
    console.log('Updating user profile with trial info:', {
      trial_started_at: new Date().toISOString(),
      trial_ends_at: trialEnd.toISOString(),
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
        JSON.stringify({ error: 'Failed to update user profile' }),
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
    console.error('Error in create-subscription:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.raw ? error.raw : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
