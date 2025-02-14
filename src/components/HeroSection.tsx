import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
const HeroSection = () => {
  const navigate = useNavigate();
  const features = [{
    title: "User-Friendly",
    description: "AI sales coaching that's built for you, not a sales trainer."
  }, {
    title: "Rep-Friendly",
    description: "You'll love how easy it is to practice and improve your sales skills."
  }, {
    title: "Professional",
    description: "Sharpen your pitch, handle objections, and close deals with confidence."
  }];
  return <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-start px-4 py-12 text-black">
      <div className="w-full max-w-6xl mx-auto space-y-12">
        {/* Hero Content */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-[#222222]" style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}>
            AI-powered role-playing for sales reps
          </h1>
          <p className="text-xl text-[#222222] max-w-2xl mx-auto">
            Get better at sales within 3 days - AI sales coaching that sharpens your skills instantly.
          </p>
          <div className="mt-8">
            <Button size="lg" className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white text-lg px-8 py-6 h-auto rounded-xl" onClick={() => navigate('/auth')}>
              Try LevellUp For Free
            </Button>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center">
          <h2 style={{
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }} className="text-3xl font-bold text-[#222222] md:text-4xl">
            Practise. Improve. Book More Meetings. Close More Deals.
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
          {features.map((feature, index) => <div key={index} className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-[#222222]" style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }}>{feature.title}</h3>
              <p className="text-[#222222] text-lg">{feature.description}</p>
            </div>)}
        </div>
      </div>
    </div>;
};
export default HeroSection;