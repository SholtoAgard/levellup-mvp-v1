
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ThankYou = () => {
  const [firstName, setFirstName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [scriptUrl, setScriptUrl] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem("newsletter_firstName");
    if (storedName) {
      setFirstName(storedName);
    }

    // Get the public URLs for the assets
    const getAssetUrls = async () => {
      const photoPath = 'profile-photo.jpg';
      const scriptPath = 'cold-call-script.pdf';
      
      const { data: photoData } = await supabase.storage
        .from('assets')
        .getPublicUrl(photoPath);
      
      const { data: scriptData } = await supabase.storage
        .from('assets')
        .getPublicUrl(scriptPath);

      if (photoData) setPhotoUrl(photoData.publicUrl);
      if (scriptData) setScriptUrl(scriptData.publicUrl);
    };

    getAssetUrls();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <img 
          src={photoUrl || '/placeholder.svg'} 
          alt="Your Name" 
          className="w-32 h-32 rounded-full mx-auto mb-8 object-cover"
        />
        <h1 className="text-3xl md:text-4xl font-bold text-[#222222] mb-8">
          Thank you for subscribing to my newsletter, {firstName}!
        </h1>
        
        <Button 
          className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white text-lg py-6 px-8 mb-12"
          onClick={() => scriptUrl && window.open(scriptUrl, "_blank")}
        >
          Download your $50K SaaS Cold Call Script
        </Button>

        <div className="space-y-6 text-left max-w-2xl mx-auto">
          <p className="text-xl text-gray-700">Here's the thing.</p>
          
          <p className="text-lg text-gray-600">
            You can let this be just another email sign-up.
          </p>

          <p className="text-lg text-gray-600">
            Or...
          </p>

          <p className="text-lg text-gray-600 mb-8">
            Do you mark today as the day you started taking massive action towards building a thriving, high-income sales career?
          </p>

          <p className="text-lg text-gray-600 mb-8">
            But the truth is… I know you're here because you want more from your sales career.
          </p>

          <Button 
            className="w-full bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white text-lg py-6"
            onClick={() => navigate("/subscription")}
          >
            Get started today. Try LevellUp free for 4 days. Cancel anytime.
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;
