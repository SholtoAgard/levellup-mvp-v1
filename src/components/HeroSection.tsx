
import { MessageSquare, Trophy, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-emerald-400" />,
      title: "AI-Powered Conversations",
      description: "Practice with dynamic, realistic sales scenarios",
    },
    {
      icon: <Trophy className="w-6 h-6 text-emerald-400" />,
      title: "Track Progress",
      description: "Earn XP and level up your sales skills",
    },
    {
      icon: <UserPlus className="w-6 h-6 text-emerald-400" />,
      title: "Expert Coaching",
      description: "Get personalized feedback and improvement tips",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 text-white">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-sm font-medium text-emerald-400">Sales Training Reimagined</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold max-w-3xl">
          Level Up Your Sales Skills with AI-Powered Roleplay
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Practice sales conversations, handle objections, and receive instant feedback to improve your performance.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white">
            Start Training
          </Button>
          <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-white">
            Watch Demo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-6xl w-full px-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 hover:scale-105 transition-transform duration-200"
          >
            <div className="h-12 w-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
            <p className="text-gray-400">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
