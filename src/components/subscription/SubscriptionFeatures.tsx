
import { Check } from "lucide-react";

const subscriptionFeatures = [
  "120 minutes of AI role-playing per month",
  "Email customer support (standard response time)",
  "Basic AI-generated feedback & scoring (e.g., tone, confidence, objection handling)",
  "Practice cold calls, discovery calls, and objection handling",
  "Track your progress & improve faster"
];

const SubscriptionFeatures = () => {
  return (
    <ul className="mt-6 space-y-4 text-left mb-8">
      {subscriptionFeatures.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          <Check className="h-[20px] w-[20px] min-w-[20px] mt-1 text-[#1E90FF]" />
          <span className="text-gray-600">{feature}</span>
        </li>
      ))}
    </ul>
  );
};

export default SubscriptionFeatures;
