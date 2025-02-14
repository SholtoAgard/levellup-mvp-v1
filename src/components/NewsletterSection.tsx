
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const NewsletterSection = () => {
  return (
    <section id="newsletter" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#222222] mb-6">
            Learn The Tactics & Mindset To Become a Top 1% Sales Rep
          </h2>
          <h3 className="text-xl md:text-2xl font-semibold text-[#1E90FF] mb-4">
            LEVELLUP SALES NEWSLETTER
          </h3>
          <p className="text-lg text-gray-600 mb-8">
            A five-minute weekly newsletter to help BDRs, SDRs, and AEs master sales, hit quota consistently, and level up their career.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚀</span>
            <p className="text-gray-700">
              Start your Mondays with a tactical tip, mindset shift, and sales strategy you can apply immediately.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📈</span>
            <p className="text-gray-700">
              Learn the exact tactics top SaaS sellers use to book more meetings, crush quotas, and close bigger deals.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🎯</span>
            <p className="text-gray-700">
              Get exclusive downloads, scripts, and insider insights—only available to subscribers.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <p className="text-gray-700">
              Engage with me and the LevellUp team to sharpen your skills and stay ahead of the competition.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <p className="text-lg font-medium text-[#222222] mb-6 text-center">
            + Get a FREE SaaS Cold Call Script that has generated over $50K in commission & bonuses!
          </p>
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="First Name"
              className="flex-1"
            />
            <Input
              type="email"
              placeholder="Email Address"
              className="flex-1"
            />
            <Button 
              className="w-full bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
            >
              Join Newsletter
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
