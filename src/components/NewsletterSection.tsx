
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const NewsletterSection = () => {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Store the form data in localStorage to access it on the thank you page
      localStorage.setItem("newsletter_firstName", firstName);
      localStorage.setItem("newsletter_email", email);

      // Send welcome email
      const { error } = await supabase.functions.invoke('send-welcome-email', {
        body: { firstName, email }
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        toast({
          title: "Newsletter Signup Successful",
          description: "You've been added to our newsletter, but there was an issue sending the welcome email. Don't worry, you'll still receive our updates!",
          variant: "default",
        });
      }

      navigate("/thank-you");
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error",
        description: "There was an issue processing your signup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <p className="text-lg font-medium text-[#222222] mb-6 text-center">
            + Get a FREE SaaS Cold Call Script that has generated over $50K in commission & bonuses!
          </p>
          <div className="flex flex-col gap-4 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="First Name"
              className="flex-1"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email Address"
              className="flex-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button 
              type="submit"
              className="w-full bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Joining..." : "Join Newsletter"}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default NewsletterSection;
