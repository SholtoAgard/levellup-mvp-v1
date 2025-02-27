
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import Footer from "@/components/Footer";
import { Check } from "lucide-react";

const stripePromise = loadStripe("pk_test_51HA5oHHYcRfijJBsAxDzfvHf4LhhKoQputSDEU0rQcBTQvYWQi9ci76CAxSVIcRMjYDuzshvbK0qcxl8gSYnrXIc00axV69scf");

const CheckoutForm = () => {
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

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!paymentMethod) {
      console.error('No payment method available');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting signup process...');

      // First check if user exists
      const { data: { user: existingUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (existingUser) {
        console.log('Existing user signed in:', existingUser.id);
        await createSubscription(existingUser.id);
        return;
      }

      // User doesn't exist or password is wrong, try to sign up
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
        // Continue even if this fails
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

  if (step === 'signup') {
    return (
      <form onSubmit={handleSignupSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            minLength={6}
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1E90FF] hover:bg-[#1E90FF]/90"
        >
          {loading ? "Processing..." : "Create Account & Start Free Trial"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handlePaymentSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#1E90FF] hover:bg-[#1E90FF]/90"
      >
        {loading ? "Processing..." : "Start Your 4-Day Free Trial"}
      </Button>
    </form>
  );
};

const SubscriptionPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="py-12 px-4 sm:px-6 lg:px-8 flex-1">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Get started in minutes
            </h2>
            <p className="mt-2 text-gray-600">
              Try it free for 4 days. Cancel anytime.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center mb-8">
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-900">$49</span>
                <span className="text-gray-600 ml-2">USD/month</span>
              </div>
              <p className="text-gray-600">after your free trial ends</p>
            </div>

            <ul className="mt-6 space-y-4 text-left mb-8">
              {[
                "120 minutes of AI role-playing per month",
                "Email customer support (standard response time)",
                "Basic AI-generated feedback & scoring (e.g., tone, confidence, objection handling)",
                "Real-time AI feedback on objections, tonality, and confidence",
                "Practice cold calls, discovery calls, and objection handling",
                "Track your progress & improve faster"
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-[20px] w-[20px] min-w-[20px] mt-1 text-[#1E90FF]" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <Elements stripe={stripePromise}>
              <CheckoutForm />
            </Elements>

            <p className="mt-4 text-sm text-gray-500 text-center">
              By starting your trial, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubscriptionPage;
