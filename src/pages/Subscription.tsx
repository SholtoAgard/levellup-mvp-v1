
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import CheckoutForm from "@/components/subscription/CheckoutForm";
import SubscriptionFeatures from "@/components/subscription/SubscriptionFeatures";

// Initialize Stripe with live publishable key
const stripePromise = loadStripe("pk_live_51HA5oHHYcRfijJBsAxDzfvHf4LhhKoQputSDEU0rQcBTQvYWQi9ci76CAxSVIcRMjYDuzshvbK0qcxl8gSYnrXIc00axV69scf");

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

            <SubscriptionFeatures />

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
