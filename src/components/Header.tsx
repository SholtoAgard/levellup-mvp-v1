
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";

const Header = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local session state
      setSession(null);
      
      // Show success message
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      });
      
      // Navigate to home page
      navigate("/");
      
      // Close mobile menu if open
      setIsOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 64;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setIsOpen(false);
  };

  const renderNavItems = () => (
    <>
      <Link to="/" className="text-[#222222] hover:text-gray-900 text-base font-medium" onClick={() => setIsOpen(false)}>HOME</Link>
      <button onClick={() => scrollToSection('features')} className="text-[#222222] hover:text-gray-900 text-base font-medium">FEATURES</button>
      <button onClick={() => scrollToSection('pricing')} className="text-[#222222] hover:text-gray-900 text-base font-medium">PRICING</button>
      <button onClick={() => scrollToSection('newsletter')} className="text-[#222222] hover:text-gray-900 text-base font-medium">JOIN NEWSLETTER</button>
      {session ? (
        <>
          <Link to="/dashboard" className="text-[#222222] hover:text-gray-900 text-base font-medium" onClick={() => setIsOpen(false)}>DASHBOARD</Link>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-[#222222] hover:text-gray-900 text-base font-medium"
          >
            LOG OUT
          </Button>
        </>
      ) : (
        <Link to="/auth" className="text-[#222222] hover:text-gray-900 text-base font-medium" onClick={() => setIsOpen(false)}>LOG IN</Link>
      )}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 bg-white z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>LevellUp</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {renderNavItems()}
          </nav>

          {/* Mobile Navigation */}
          {isMobile && (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-6 mt-6">
                  {renderNavItems()}
                </nav>
              </SheetContent>
            </Sheet>
          )}

          {/* CTA Button */}
          <Button 
            className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white rounded-lg px-6 py-2 text-base font-medium"
            onClick={() => {
              navigate(session ? "/dashboard" : "/subscription");
              setIsOpen(false);
            }}
          >
            FREE TRIAL
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
