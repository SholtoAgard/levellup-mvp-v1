
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const PricingSection = () => {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for trying out LevellUp",
      features: [
        "5 AI role-play sessions per month",
        "Basic performance analytics",
        "Standard scenarios library",
        "Email support"
      ]
    },
    {
      name: "Professional",
      price: "$49",
      period: "per month",
      description: "Ideal for individual sales professionals",
      features: [
        "Unlimited AI role-play sessions",
        "Advanced performance analytics",
        "Full scenarios library",
        "Priority support",
        "Custom scenario creation",
        "Personal improvement roadmap"
      ],
      featured: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For teams and organizations",
      features: [
        "Everything in Professional",
        "Team analytics dashboard",
        "Custom training modules",
        "Dedicated account manager",
        "API access",
        "SSO integration"
      ]
    }
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#222222] mb-4" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that best fits your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-white rounded-2xl p-8 ${
                plan.featured 
                  ? 'ring-2 ring-[#1E90FF] shadow-lg' 
                  : 'border border-gray-200'
              }`}
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#222222] mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-[#222222]">{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-600 ml-1">{plan.period}</span>
                  )}
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
                className={`w-full ${
                  plan.featured
                    ? 'bg-[#1E90FF] hover:bg-[#1E90FF]/90'
                    : 'bg-gray-900 hover:bg-gray-800'
                } text-white`}
              >
                {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
