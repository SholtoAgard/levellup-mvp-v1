
import React from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const SupportCenter = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-black mb-6">Need Help?</h1>
        <p className="text-lg text-gray-700 mb-8">
          Our customer success team is here to help you succeed. Feel free to reach out to us anytime.
        </p>
        <a 
          href="mailto:ian@levellup.co"
          className="inline-block"
        >
          <Button className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white">
            <Mail className="mr-2 h-4 w-4" />
            Contact Support Team
          </Button>
        </a>
      </div>
    </div>
  );
};

export default SupportCenter;
