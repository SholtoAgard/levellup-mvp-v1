
import { Card } from "@/components/ui/card";

const Refer = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-12">Refer a Friend</h1>
        
        <div className="space-y-8">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Referrals</h2>
            <p className="text-gray-700 leading-relaxed">
              Share LevellUp with your friends & co-workers and you'll earn up to $100 in VISA gift cards when they sign up with a paid plan. The more you refer, the bigger your reward. Start sharing today!
            </p>
          </Card>

          {/* Additional sections will be added here */}
        </div>
      </div>
    </div>
  );
};

export default Refer;
