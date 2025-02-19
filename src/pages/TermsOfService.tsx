
import React from "react";
import Footer from "@/components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">LevellUp Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last Updated: February 18, 2025</p>
        
        <p className="mb-8">Welcome to LevellUp! By signing up for an account, using our services, or starting your free trial, you agree to these Terms of Service ("Terms"). If you do not agree, please do not use LevellUp.</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>By creating an account or using LevellUp, you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Free Trial and Payment Terms</h2>
            <p className="space-y-4">
              <p>Users receive a 4-day free trial (with credit card required) to explore LevellUp.</p>
              <p>After the trial period ends, your selected subscription plan will automatically begin, and your credit card will be charged unless you cancel before the trial expires.</p>
              <p>Subscription fees are non-refundable once the charge has been processed.</p>
              <p>LevellUp reserves the right to change pricing at any time with notice.</p>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="space-y-4">
              <p>You agree to use LevellUp only for lawful purposes.</p>
              <p>You may not attempt to copy, reverse-engineer, exploit, or resell LevellUp in any form.</p>
              <p>You are responsible for maintaining the confidentiality of your account credentials.</p>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Cancellation & Refund Policy</h2>
            <p className="space-y-4">
              <p>You can cancel your subscription at any time before the trial ends to avoid charges.</p>
              <p>No refunds will be issued once a subscription payment has been processed.</p>
              <p>If you cancel, your account will remain active until the end of the billing period.</p>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Account & Data Usage</h2>
            <p className="space-y-4">
              <p>LevellUp may collect and store user data as outlined in our Privacy Policy.</p>
              <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
              <p>LevellUp is not responsible for any data loss or security breaches beyond our control.</p>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="space-y-4">
              <p>LevellUp is provided "as is" and "as available" without any guarantees of success in sales performance.</p>
              <p>We are not liable for lost revenue, indirect damages, or any negative outcomes resulting from using our platform.</p>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Modifications to the Service</h2>
            <p>LevellUp reserves the right to modify, update, or discontinue any features of the platform at our discretion, with reasonable notice when applicable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Governing Law</h2>
            <p>These Terms shall be governed by and interpreted in accordance with the laws of Ontario, Canada. Any disputes arising from these Terms shall be resolved in a court of competent jurisdiction in Ontario.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Contact Information</h2>
            <p>If you have any questions about these Terms, please contact me at ian@levellup.co</p>
          </section>

          <p className="mt-8">By using LevellUp, you agree to these Terms and acknowledge that you have read and understood them.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
