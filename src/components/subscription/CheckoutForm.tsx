
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { SignupForm } from "./SignupForm";
import { PaymentForm } from "./PaymentForm";

export const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<'payment' | 'signup' | 'signin'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      console.error('Stripe.js has not loaded');
      toast({
        title: "Error",
        description: "Payment processing is not available. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.error('Card Element not found');
      return;
    }

    try {
      setLoading(true);
      
      const { error: stripeError, paymentMethod: pm } = await stripe.createPaymentMethod({
        card: cardElement,
        type: 'card'
      });

      if (stripeError) {
        console.error('Stripe error:', stripeError);
        throw stripeError;
      }

      if (!pm) {
        throw new Error('No payment method created');
      }

      console.log('Payment method created:', pm.id);
      setPaymentMethod(pm.id);
      setStep('signup');
      
      toast({
        title: "Payment method saved!",
        description: "Now create your account to start your free trial.",
      });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (userId: string) => {
    try {
      console.log('Creating subscription for user:', userId);
      
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('create-subscription', {
        body: { 
          paymentMethodId: paymentMethod, 
          userId: userId,
          email: email
        }
      });

      if (subscriptionError) {
        console.error('Subscription creation failed:', subscriptionError);
        throw new Error(subscriptionError.message || 'Failed to create subscription');
      }

      if (!subscriptionData) {
        console.error('No subscription data returned');
        throw new Error('Failed to create subscription - no data returned');
      }

      console.log('Subscription created successfully:', subscriptionData);

      // Add user to trial separately - don't block on this
      try {
        const { error: trialError } = await supabase.functions.invoke('add-trial-user', {
          body: { 
            email,
            userId: userId
          }
        });

        if (trialError) {
          console.error('Error adding trial user:', trialError);
        }
      } catch (error) {
        console.error('Error adding trial user:', error);
        // Continue even if this fails
      }

      toast({
        title: "Success!",
        description: "Your free trial has started. Welcome to LevellUp!",
      });

      // Small delay to ensure toast is visible
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate("/dashboard", { replace: true });

    } catch (error: any) {
      console.error("Subscription creation error:", error);
      setLoading(false);
      toast({
        title: "Subscription Error",
        description: error.message || "Failed to set up subscription. Please try again or contact support.",
        variant: "destructive",
      });
      throw error; // Re-throw to be caught by the signup handler
    }
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentMethod) {
      console.error('No payment method available');
      toast({
        title: "Error",
        description: "Please enter payment information first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Starting signup process...');

      // First try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInData.user) {
        console.log('Existing user signed in:', signInData.user.id);
        await createSubscription(signInData.user.id);
        return;
      }

      // If sign in fails, try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        if (signUpError.message.toLowerCase().includes('already registered')) {
          toast({
            title: "Account exists",
            description: "Please use the correct password for your existing account.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        throw signUpError;
      }

      if (!signUpData.user?.id) {
        throw new Error("Failed to create account - no user ID received");
      }

      await createSubscription(signUpData.user.id);

    } catch (error: any) {
      console.error("Error during signup:", error);
      setLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to create your account. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (step === 'signup') {
    return (
      <SignupForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        onSubmit={handleSignupSubmit}
      />
    );
  }

  return (
    <PaymentForm
      onSubmit={handlePaymentSubmit}
      loading={loading}
      stripeReady={!!stripe}
    />
  );
};
