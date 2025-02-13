
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
            {session ? (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-gray-900">DASHBOARD</Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-gray-900"
                >
                  LOG OUT
                </Button>
              </>
            ) : (
              <Link to="/auth" className="text-gray-700 hover:text-gray-900">LOG IN</Link>
            )}
          </nav>

          {/* CTA Button */}
          <Button 
            className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
            onClick={() => navigate(session ? "/dashboard" : "/auth")}
          >
            {session ? "GO TO DASHBOARD" : "FREE TRIAL"}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
