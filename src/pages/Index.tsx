
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";

const Index = () => {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="py-16"> {/* Changed pt-16 to py-16 for better spacing */}
        <HeroSection />
      </div>
    </main>
  );
};

export default Index;
