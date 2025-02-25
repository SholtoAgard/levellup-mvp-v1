import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import Footer from "@/components/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface FeedbackSections {
  strengths: string[];
  areasToImprove: string[];
  recommendations: string[];
  summary: string;
  objectionHandling: string;
  valueProposition: string;
  closingEffectiveness: string;
}

const Feedback = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const sessionData = location.state || {};
  const score = parseInt(sessionData.score) || 0;
  const feedback = sessionData.feedback || "";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const parseFeedback = (feedbackText: string): FeedbackSections => {
    console.log("feedbackText", feedbackText);
    const sections: FeedbackSections = {
      strengths: [],
      areasToImprove: [],
      recommendations: [],
      summary: "",
      objectionHandling: "N/A",
      valueProposition: "N/A",
      closingEffectiveness: "N/A",
    };

    const lines = feedbackText.split("\n");
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("Objection Handling:")) {
        sections.objectionHandling = trimmedLine
          .replace("Objection Handling:", "")
          .trim();
      } else if (trimmedLine.startsWith("Value Proposition:")) {
        sections.valueProposition = trimmedLine
          .replace("Value Proposition:", "")
          .trim();
      } else if (trimmedLine.startsWith("Closing Effectiveness:")) {
        sections.closingEffectiveness = trimmedLine
          .replace("Closing Effectiveness:", "")
          .trim();
      }
    });

    const feedbackPart =
      feedbackText.split("FEEDBACK:")[1]?.trim() || feedbackText;
    const paragraphs = feedbackPart.split("\n\n").filter((p) => p.trim());

    sections.summary = paragraphs[0]?.trim() || "";

    const remainingText = paragraphs.slice(1).join(" ");

    const strengthPatterns = [
      /(?:demonstrated|showed|exhibited|displayed|had|was|were)\s+(?:good|high|strong|effective|successful|excellent|polite)[^.!?]*[.!?]/gi,
      /(?:good|high|strong|effective|successful|excellent|polite)[^.!?]*[.!?]/gi,
    ];

    strengthPatterns.forEach((pattern) => {
      const matches = remainingText.match(pattern) || [];
      sections.strengths.push(
        ...matches
          .filter((match) => !match.toLowerCase().includes("however"))
          .map((match) => match.trim())
      );
    });

    const improvementPatterns = [
      /Areas for improvement include[^.]*(?:[^.]*\.)/gi,
      /(?:need to|failed to|lack of|weak|improve|better|could have)[^.!?]*[.!?]/gi,
      /(?:room for improvement)[^.!?]*[.!?]/gi,
    ];

    improvementPatterns.forEach((pattern) => {
      const matches = remainingText.match(pattern) || [];
      sections.areasToImprove.push(
        ...matches
          .map((match) =>
            match.replace(/Areas for improvement include/i, "").trim()
          )
          .filter((match) => match.length > 0)
      );
    });

    const recommendationPatterns = [
      /(?:should|could|needs? to|try to|work on|focus on)[^.!?]*[.!?]/gi,
    ];

    recommendationPatterns.forEach((pattern) => {
      const matches = remainingText.match(pattern) || [];
      sections.recommendations.push(
        ...matches
          .filter((rec) => !sections.areasToImprove.includes(rec.trim()))
          .map((rec) => rec.trim())
      );
    });

    sections.strengths = [...new Set(sections.strengths)];
    sections.areasToImprove = [...new Set(sections.areasToImprove)];
    sections.recommendations = [...new Set(sections.recommendations)];

    if (sections.strengths.length === 0) {
      sections.strengths.push(
        "Focus on the areas of improvement to enhance your performance."
      );
    }

    return sections;
  };

  const feedbackSections = parseFeedback(feedback);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getCallType = () => {
    return sessionData.roleplay_type === "discovery_call" ? "Discovery Call" : "Cold Call";
  };

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

          <div className="p-4 sm:p-8 flex-1">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="space-y-6 text-left">
                <h2 className="text-2xl">
                  {getCallType()} -- {sessionData.avatarName || "AI Assistant"}
                </h2>
                
                <div className="w-32 h-32 overflow-hidden">
                  <img 
                    src={sessionData.avatarImage || ""} 
                    alt={sessionData.avatarName || "AI Assistant"}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                  {score}/100
                </div>

                <h3 className="text-lg font-medium">Understanding Your Score</h3>
                
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-6">
                      {/* Strengths Section */}
                      <div>
                        <h4 className="text-left mb-2">Key Strengths</h4>
                        <ol className="list-decimal pl-5 space-y-2">
                          {feedbackSections.strengths.map((strength, index) => (
                            <li key={index} className="text-gray-700 text-left">
                              {strength}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Areas to Improve Section */}
                      <div>
                        <h4 className="text-left mb-2">Areas to Improve</h4>
                        <ol className="list-decimal pl-5 space-y-2">
                          {feedbackSections.areasToImprove.map((area, index) => (
                            <li key={index} className="text-gray-700 text-left">
                              {area}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Recommendations Section */}
                      <div>
                        <h4 className="text-left mb-2">Recommendations</h4>
                        <ol className="list-decimal pl-5 space-y-2">
                          {feedbackSections.recommendations.map((rec, index) => (
                            <li key={index} className="text-gray-700 text-left">
                              {rec}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Additional Metrics Section */}
                      <div>
                        <h4 className="text-left mb-2">Additional Metrics</h4>
                        <div className="space-y-2">
                          <p className="text-gray-700 text-left">
                            Objection Handling: {feedbackSections.objectionHandling}
                          </p>
                          <p className="text-gray-700 text-left">
                            Value Proposition: {feedbackSections.valueProposition}
                          </p>
                          <p className="text-gray-700 text-left">
                            Closing Effectiveness: {feedbackSections.closingEffectiveness}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {showButton && (
                <div className="text-left">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
                    onClick={() => navigate("/dashboard")}
                  >
                    Start New Practice
                  </Button>
                </div>
              )}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Feedback;
