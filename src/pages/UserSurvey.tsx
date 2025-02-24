
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarProvider } from "@/components/ui/sidebar";
import Footer from "@/components/Footer";

const UserSurvey = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && (
          <Sidebar>
            <SidebarContent>
              <div className="p-4 mb-4">
                <h1 className="text-2xl font-bold text-black">LEVELLUP</h1>
              </div>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarNav />
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        )}

        <div className="flex-1 flex flex-col">
          {isMobile && (
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-black">LEVELLUP</h1>
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <nav className="flex flex-col gap-6 mt-6">
                      <SidebarNav onNavigation={() => setIsOpen(false)} />
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          )}

          <main className="flex-1">
            <div className="max-w-3xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
              <div className="text-center space-y-8">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                  Help me build the #1 sales training platform
                </h1>
                <p className="text-lg leading-8 text-gray-600">
                  I'm on a mission to build the #1 sales training platform in the world—but I can't do it without you. Your honest feedback is key to making LevellUp better for you and every sales rep who uses it. It'll only take 2-3 minutes, and your insights will help shape the future of LevellUp.
                  <br /><br />
                  Click the link below to share your feedback.
                  <br /><br />
                  Thank you for being part of this journey
                </p>
                <Button
                  className="bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white px-8 py-6 text-lg"
                  onClick={() => navigate("/feedback")}
                >
                  Give your feedback
                </Button>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserSurvey;
