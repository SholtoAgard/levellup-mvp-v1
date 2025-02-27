
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutForm } from "@/components/subscription/CheckoutForm";
import { FeaturesList } from "@/components/subscription/FeaturesList";
import Footer from "@/components/Footer";

const stripePromise = loadStripe("pk_test_51HA5oHHYcRfijJBsAxDzfvHf4LhhKoQputSDEU0rQcBTQvYWQi9ci76CAxSVIcRMjYDuzshvbK0qcxl8gSYnrXIc00axV69scf");

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

            <FeaturesList />

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
