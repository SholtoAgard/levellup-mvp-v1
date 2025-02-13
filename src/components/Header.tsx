
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";

const Header = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 64; // Height of the fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>LevellUp</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-[#222222] hover:text-gray-900 text-base font-medium">HOME</Link>
            <button onClick={() => scrollToSection('features')} className="text-[#222222] hover:text-gray-900 text-base font-medium">FEATURES</button>
            <button onClick={() => scrollToSection('pricing')} className="text-[#222222] hover:text-gray-900 text-base font-medium">PRICING</button>
            <Link to="/newsletter" className="text-[#222222] hover:text-gray-900 text-base font-medium">JOIN NEWSLETTER</Link>
            {session ? (
              <>
                <Link to="/dashboard" className="text-[#222222] hover:text-gray-900 text-base font-medium">DASHBOARD</Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-[#222222] hover:text-gray-900 text-base font-medium"
                >
                  LOG OUT
                </Button>
              </>
            ) : (
              <Link to="/auth" className="text-[#222222] hover:text-gray-900 text-base font-medium">LOG IN</Link>
            )}
          </nav>

          {/* CTA Button */}
          <Button 
            className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white rounded-lg px-6 py-2 text-base font-medium"
            onClick={() => navigate(session ? "/dashboard" : "/auth")}
          >
            FREE TRIAL
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
