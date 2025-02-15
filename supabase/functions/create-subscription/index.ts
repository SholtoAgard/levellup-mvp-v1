
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
      throw userError
    }
    if (!user) {
      console.error('User not found for ID:', userId)
      throw new Error('User not found')
    }
    console.log('Found user:', { email: user.email })

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
      items: [
        { 
          price: 'price_1OymKQHYcRfijJBsKTfxmhD7' // Monthly subscription price ID
        }
      ],
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
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      throw updateError
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
