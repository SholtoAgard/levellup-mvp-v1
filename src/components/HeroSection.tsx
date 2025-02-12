
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const features = [
    {
      title: "User-Friendly",
      description: "AI sales coaching that's built for you, not a sales trainer.",
    },
    {
      title: "Rep-Friendly",
      description: "You'll love how easy it is to practice and improve your sales skills.",
    },
    {
      title: "Professional",
      description: "Sharpen your pitch, handle objections, and close deals with confidence.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-8 text-black">
      <div className="w-full max-w-6xl mx-auto space-y-16">
        {/* Hero Content */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800">
            AI-powered role-playing for sales reps
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get better at sales within 3 days - AI sales coaching that sharpens your skills instantly.
          </p>
          <div className="mt-8">
            <Button 
              size="lg" 
              className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white text-lg px-8 py-6 h-auto rounded-xl"
            >
              Try LevellUp For Free
            </Button>
          </div>
        </div>

        {/* Video Preview Section */}
        <div className="relative w-full max-w-4xl mx-auto">
          <div className="aspect-video rounded-2xl bg-gray-200 overflow-hidden">
            {/* You can add the video/image here */}
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-800">
            Practise. Improve. Book More Meetings. Close More Deals.
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
          {features.map((feature, index) => (
            <div key={index} className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-gray-800">{feature.title}</h3>
              <p className="text-gray-600 text-lg">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
