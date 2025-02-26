import { useState, useEffect } from "react";
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
import { Check, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Initialize Stripe with live publishable key
const stripePromise = loadStripe("pk_live_51HA5oHHYcRfijJBsAxDzfvHf4LhhKoQputSDEU0rQcBTQvYWQi9ci76CAxSVIcRMjYDuzshvbK0qcxl8gSYnrXIc00axV69scf");

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
      
      // Create payment method
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

      // Sign up the user with additional metadata
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

      // Create subscription
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

      // Add user to onboarding email sequence
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
        // Don't throw here as it's not critical to the signup process
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

      // If the error indicates the user already exists, show a specific message
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

const SubscriptionPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="text-2xl font-bold text-gray-900 px-0 hover:bg-transparent"
                onClick={() => navigate("/")}
              >
                LEVELLUP
              </Button>
            </div>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-6">
                  <Button variant="ghost" className="justify-start" onClick={() => {
                    setIsOpen(false);
                    window.location.href = "/";
                  }}>
                    Home
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => {
                    setIsOpen(false);
                    window.location.href = "/auth";
                  }}>
                    Sign In
                  </Button>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

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
