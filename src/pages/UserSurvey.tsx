
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const UserSurvey = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center space-y-8">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Help me build the #1 sales training platform
            </h1>
            <p className="text-lg leading-8 text-gray-600">
              I'm on a mission to build the #1 sales training platform in the world—but I can't do it without you. Your honest feedback is key to making LevellUp better for you and every sales rep who uses it. It'll only take 2-3 minutes, and your insights will help shape the future of LevellUp.
              <br /><br />
              Click the link below to share your feedback.
              <br /><br />
              Thank you for being part of this journey
            </p>
            <Button
              className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white px-8 py-6 text-lg"
              onClick={() => navigate("/feedback")}
            >
              Give your feedback
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserSurvey;
