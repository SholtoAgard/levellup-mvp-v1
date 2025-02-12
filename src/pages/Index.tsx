
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";

const Index = () => {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="pt-16"> {/* Add padding to account for fixed header */}
        <HeroSection />
      </div>
    </main>
  );
};

export default Index;
