
import { Users, MessageSquare, Settings } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Realistic AI Avatars",
      description: "Talk to lifelike, customizable AI avatars that respond with natural emotions and tones. Feel like you're practicing with real people, helping you stay calm and confident during sales calls."
    },
    {
      icon: Users,
      title: "Diverse Buyer Personas & Scenarios",
      description: "Train with different decision-makers across industries. Face real-world objections and challenges, so you're always prepared for any sales conversation."
    },
    {
      icon: Settings,
      title: "Customizable Training",
      description: "Create and edit your own sales scenarios to match your company's process. Practice exactly the way you sell."
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-[#222222] mb-4" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
            Features that Empower Your Sales
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to improve your sales skills and close more deals
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Icon className="w-8 h-8 text-[#1E90FF]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#222222] mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
