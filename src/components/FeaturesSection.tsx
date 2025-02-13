
import { Star, Users, Award, ChartBar } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Star,
      title: "Smart Role-Playing",
      description: "Practice with AI that adapts to your style and industry, providing personalized feedback."
    },
    {
      icon: Users,
      title: "Team Analytics",
      description: "Track progress across your team and identify areas for improvement."
    },
    {
      icon: Award,
      title: "Expert Scenarios",
      description: "Access hundreds of real-world sales scenarios crafted by industry experts."
    },
    {
      icon: ChartBar,
      title: "Performance Tracking",
      description: "Monitor your improvement with detailed analytics and progress reports."
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Icon className="w-6 h-6 text-[#1E90FF]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#222222] mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
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
