
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStripe, useElements } from "@stripe/react-stripe-js";
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
        type: "card",
        card: cardElement,
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
      
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { 
          paymentMethodId: paymentMethod, 
          userId: userId,
          email: email
        }
      });

      if (error || !data) {
        console.error('Subscription error:', error);
        throw new Error(error?.message || 'Failed to create subscription');
      }

      console.log('Subscription created successfully:', data);

      try {
        await supabase.functions.invoke('add-trial-user', {
          body: { 
            email,
            userId: userId
          }
        });
      } catch (error) {
        console.error('Error adding trial user:', error);
      }

      toast({
        title: "Success!",
        description: "Your free trial has started. Welcome to LevellUp!",
      });

      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      throw new Error(error.message || "Failed to set up subscription");
    }
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentMethod) {
      console.error('No payment method available');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting signup process...');

      const { data: { user: existingUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (existingUser) {
        console.log('Existing user signed in:', existingUser.id);
        await createSubscription(existingUser.id);
        return;
      }

      const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
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

      if (!newUser?.id) {
        throw new Error("Failed to create account - no user ID received");
      }

      await createSubscription(newUser.id);

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
