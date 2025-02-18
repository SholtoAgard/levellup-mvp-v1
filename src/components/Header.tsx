
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="font-bold text-xl text-[#1E90FF]"
          >
            LevellUp
          </Button>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="text-[#222222] hover:text-gray-900 text-base font-medium"
          >
            HOME
          </Button>
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="text-[#222222] hover:text-gray-900 text-base font-medium"
          >
            FEATURES
          </Button>
          <Button
            variant="link"
            onClick={() => navigate("/")}
            className="text-[#222222] hover:text-gray-900 text-base font-medium"
          >
            PRICING
          </Button>
        </nav>

        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/roleplay")}
            className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
          >
            Try For Free
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
