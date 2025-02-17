
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";
import NewsletterSection from "@/components/NewsletterSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-[#FFFFFF] flex flex-col">
      <Header />
      <div className="pt-16 flex-1">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <NewsletterSection />
      </div>
      <Footer />
    </main>
  );
};

export default Index;
