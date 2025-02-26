
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [step, setStep] = useState<'payment' | 'signup'>('payment');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    try {
      setLoading(true);
      
      const { error: stripeError, paymentMethod: pm } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement)!,
      });

      if (stripeError) {
        throw stripeError;
      }

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
    if (!paymentMethod) return;

    try {
      setLoading(true);

      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        throw signUpError;
      }

      if (!user?.id) {
        throw new Error("Failed to create account - no user ID received");
      }

      console.log('User created successfully:', user.id);

      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('create-subscription', {
        body: { 
          paymentMethodId: paymentMethod, 
          userId: user.id 
        }
      });

      if (subscriptionError) {
        console.error('Subscription error:', subscriptionError);
        throw new Error(subscriptionError.message || 'Failed to set up subscription');
      }

      if (!subscriptionData) {
        throw new Error('No subscription data received');
      }

      const { error: onboardingError } = await supabase.functions.invoke('add-trial-user', {
        body: { 
          email,
          userId: user.id,
          firstName,
          lastName
        }
      });

      if (onboardingError) {
        console.error('Error adding to onboarding sequence:', onboardingError);
      }

      console.log('Subscription created successfully:', subscriptionData);

      toast({
        title: "Success!",
        description: "Your free trial has started. Enjoy LevellUp!",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create your account. Please try again.",
        variant: "destructive",
      });

      if (error.message?.toLowerCase().includes('already registered')) {
        toast({
          title: "Account exists",
          description: "Please log in to your existing account instead.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'signup') {
    return (
      <form onSubmit={handleSignupSubmit} className="space-y-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
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
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1E90FF] hover:bg-[#1E90FF]/90"
        >
          {loading ? "Creating Account..." : "Create Account & Start Free Trial"}
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

export default CheckoutForm;
