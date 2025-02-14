
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PricingSection = () => {
  const plan = {
    name: "Professional",
    price: "$49 USD",
    period: "user/month",
    description: "Ideal for individual sales professionals",
    features: [
      "Unlimited AI role-play sessions",
      "Advanced performance analytics",
      "Full scenarios library",
      "Priority support",
      "Custom scenario creation",
      "Personal improvement roadmap"
    ]
  };

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#222222] mb-4" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            Get started in minutes. Try it free for 4 days. Cancel anytime.
          </h2>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-8 ring-2 ring-[#1E90FF] shadow-lg">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-[#222222] mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold text-[#222222]">{plan.price}</span>
                <span className="text-gray-600 ml-1">{plan.period}</span>
              </div>
              <p className="text-gray-600">{plan.description}</p>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#1E90FF]" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
            >
              Try For Free
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
