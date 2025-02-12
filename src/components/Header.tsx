
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-gray-900">LevellUp</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-700 hover:text-gray-900">HOME</Link>
            <Link to="/features" className="text-gray-700 hover:text-gray-900">FEATURES</Link>
            <Link to="/pricing" className="text-gray-700 hover:text-gray-900">PRICING</Link>
            <Link to="/newsletter" className="text-gray-700 hover:text-gray-900">JOIN NEWSLETTER</Link>
            <Link to="/login" className="text-gray-700 hover:text-gray-900">LOG IN</Link>
          </nav>

          {/* CTA Button */}
          <Button className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white">
            FREE TRIAL
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
