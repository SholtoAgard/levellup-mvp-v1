
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Refer = () => {
  const [emails, setEmails] = useState("");

  const handleSendInvite = () => {
    // Future functionality for sending invites
    console.log("Sending invites to:", emails.split(",").map(email => email.trim()));
  };

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

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Invite Friends by Email</h2>
            <p className="text-gray-700 mb-6">
              Insert your friends' email addresses and send them invitation to LevellUp.
            </p>
            <div className="flex gap-4">
              <Input
                placeholder="Enter up to 4 emails separated by comma"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSendInvite}
                className="bg-green-500 hover:bg-green-600 text-white whitespace-nowrap"
              >
                Send invite
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Refer;
