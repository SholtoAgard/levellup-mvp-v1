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
  const {
    userEmail = "Anonymous",
    roleplay_type = "cold_call",
    meetingDuration = 0,
  } = sessionData;

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

    // Extract the main feedback text
    const feedbackPart =
      feedbackText.split("FEEDBACK:")[1]?.trim() || feedbackText;

    // Set the first sentence as summary
    const sentences = feedbackPart.split(/[.!?]+/).filter((s) => s.trim());
    sections.summary = sentences[0]?.trim() || "";

    // Extract strengths
    const strengthPatterns = [
      /displays? (?:a )?(?:high|good|strong|effective|successful|excellent|polite)[^.!?]*[.!?]/gi,
      /(?:good|high|strong|effective|successful|excellent|polite)[^.!?]*[.!?]/gi,
      /(?:was able to|managed to|successfully)[^.!?]*[.!?]/gi,
      /maintaining professionalism[^.!?]*[.!?]/gi,
    ];

    strengthPatterns.forEach((pattern) => {
      const matches = feedbackPart.match(pattern) || [];
      sections.strengths.push(
        ...matches
          .filter(
            (match) =>
              !match.toLowerCase().includes("however") &&
              !match.toLowerCase().includes("could")
          )
          .map((match) => match.trim())
      );
    });

    // Extract areas to improve
    const improvementPatterns = [
      /could be improved[^.!?]*[.!?]/gi,
      /(?:did not|didn't|could|should)[^.!?]*[.!?]/gi,
      /(?:to improve)[^.!?]*[.!?]/gi,
    ];

    improvementPatterns.forEach((pattern) => {
      const matches = feedbackPart.match(pattern) || [];
      sections.areasToImprove.push(
        ...matches
          .filter((match) => !sections.strengths.includes(match.trim()))
          .map((match) => match.trim())
      );
    });

    // Extract recommendations
    const recommendationMatches =
      feedbackPart.match(
        /(?:could|should|needs? to|try to|work on|focus on)[^.!?]*[.!?]/gi
      ) || [];
    sections.recommendations = recommendationMatches
      .filter(
        (rec) =>
          !sections.strengths.includes(rec.trim()) &&
          !sections.areasToImprove.includes(rec.trim())
      )
      .map((rec) => rec.trim());

    // Clean up duplicates
    sections.strengths = [...new Set(sections.strengths)];
    sections.areasToImprove = [...new Set(sections.areasToImprove)];
    sections.recommendations = [...new Set(sections.recommendations)];

    // Add default message if no strengths found
    if (sections.strengths.length === 0) {
      sections.strengths.push(
        "Maintained professional communication throughout the conversation."
      );
    }

    // Extract metrics if present
    const metricsPatterns = {
      objectionHandling: /objection handling[^.!?]*[.!?]/gi,
      valueProposition: /value proposition[^.!?]*[.!?]/gi,
      closingEffectiveness: /closing[^.!?]*[.!?]/gi,
    };

    Object.entries(metricsPatterns).forEach(([key, pattern]) => {
      const matches = feedbackPart.match(pattern);
      if (matches?.length > 0) {
        // @ts-ignore
        sections[key as keyof typeof sections] = matches[0].trim();
      }
    });

    return sections;
  };

  const feedbackSections = parseFeedback(feedback);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getCallType = () => {
    return sessionData.roleplay_type === "discovery_call"
      ? "Discovery Call"
      : "Cold Call";
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
              <div className="flex justify-center mb-6">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/dashboard")}
                  className="w-full sm:w-auto"
                >
                  Back to Dashboard
                </Button>
              </div>

              <div className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row items-start gap-2 mb-4 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-semibold text-gray-900">
                      {roleplay_type === "discovery_call"
                        ? "Discovery Call"
                        : "Cold Call"}
                    </span>
                    <span className="text-xl text-gray-400">•</span>
                    <span className="text-xl text-gray-600 font-medium">
                      {userEmail}
                    </span>
                  </div>
                  {meetingDuration > 0 && (
                    <span className="text-sm text-gray-500 sm:ml-auto">
                      Duration: {Math.floor(meetingDuration)}m{" "}
                      {Math.round((meetingDuration % 1) * 60)}s
                    </span>
                  )}
                </div>

                <h2 className="text-2xl">Overall Call Score:</h2>
                <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
                  {score === 0 ? 30 : score}/100
                </div>

                <h3 className="text-lg font-small">Understanding Your Score</h3>

                <Card>
                  {meetingDuration < 1 ? (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                      <div className="flex">
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            For better evaluation, please conduct calls for at
                            least 2 minutes. Short calls may not provide enough
                            context for accurate feedback.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <CardContent className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 gap-6">
                        {/* Strengths Section */}
                        <div>
                          <h4 className="text-left mb-2">
                            What you did well in this call
                          </h4>
                        </div>
                        <div>
                          <h4 className="text-left mb-2">Key Strengths</h4>
                          <ol className="list-decimal pl-5 space-y-2">
                            {feedbackSections.strengths.map(
                              (strength, index) => (
                                <li
                                  key={index}
                                  className="text-gray-700 text-left"
                                >
                                  {strength}
                                </li>
                              )
                            )}
                          </ol>
                        </div>

                        {/* Areas to Improve Section */}
                        <div>
                          <h4 className="text-left mb-2">Areas to Improve</h4>
                          <ol className="list-decimal pl-5 space-y-2">
                            {feedbackSections.areasToImprove.map(
                              (area, index) => (
                                <li
                                  key={index}
                                  className="text-gray-700 text-left"
                                >
                                  {area}
                                </li>
                              )
                            )}
                          </ol>
                        </div>

                        {/* Recommendations Section */}
                        <div>
                          <h4 className="text-left mb-2">Recommendations</h4>
                          <ol className="list-decimal pl-5 space-y-2">
                            {feedbackSections.recommendations.map(
                              (rec, index) => (
                                <li
                                  key={index}
                                  className="text-gray-700 text-left"
                                >
                                  {rec}
                                </li>
                              )
                            )}
                          </ol>
                        </div>

                        {/* Additional Metrics Section
                      <div>
                        <h4 className="text-left mb-2">Additional Metrics</h4>
                        <div className="space-y-2">
                          <p className="text-gray-700 text-left">
                            Objection Handling:{" "}
                            {feedbackSections.objectionHandling}
                          </p>
                          <p className="text-gray-700 text-left">
                            Value Proposition:{" "}
                            {feedbackSections.valueProposition}
                          </p>
                          <p className="text-gray-700 text-left">
                            Closing Effectiveness:{" "}
                            {feedbackSections.closingEffectiveness}
                          </p>
                        </div>
                      </div> */}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              {showButton && (
                <div className="flex justify-center">
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
