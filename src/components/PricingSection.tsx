
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const navigate = useNavigate();
  const plan = {
    name: "Professional",
    price: "$49 USD",
    period: "user/month",
    description: "Ideal for individual sales professionals",
    features: [
      "120 minutes of AI role-playing per month",
      "Email customer support (standard response time)",
      "Real-time AI-generated feedback & scoring (e.g., tone, confidence, objection handling)",
      "Practice cold calls, discovery calls, and objection handling",
      "Track your progress & improve faster"
    ]
  };

  return (
    <section id="pricing" className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 
            className="text-4xl font-bold text-[#222222] mb-4"
            style={{
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}
          >
            Get started today. Try LevellUp free for 4 days. Cancel anytime.
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
                <li key={featureIndex} className="flex items-start gap-3">
                  <Check className="h-[20px] w-[20px] min-w-[20px] mt-1 text-[#1E90FF]" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white" 
              onClick={() => navigate('/subscription')}
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
