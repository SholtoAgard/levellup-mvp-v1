
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import PricingSection from "@/components/PricingSection";

const Index = () => {
  return (
    <main className="min-h-screen bg-[#FFFFFF]">
      <Header />
      <div className="pt-16">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
      </div>
    </main>
  );
};

export default Index;
