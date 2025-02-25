import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Menu, ArrowLeft } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import Footer from "@/components/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
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
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);

  const sessionData = location.state || {};

  console.log("sessionData", sessionData.userName);
  const score = parseInt(sessionData.score) || 0;
  const feedback = sessionData.feedback || "";
  const detailedScores = sessionData.detailedScores || {
    confidence: 0,
    clarity: 0,
    engagement: 0,
  };
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

    // Handle the case with specific sections
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

    // Extract the main feedback part
    const feedbackPart =
      feedbackText.split("FEEDBACK:")[1]?.trim() || feedbackText;
    const paragraphs = feedbackPart.split("\n\n").filter((p) => p.trim());

    // Set summary from first paragraph
    sections.summary = paragraphs[0]?.trim() || "";

    // Process the rest of the text
    const remainingText = paragraphs.slice(1).join(" ");

    // Extract strengths
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

    // Extract areas to improve
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

    // Extract recommendations
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

    // Remove duplicates
    sections.strengths = [...new Set(sections.strengths)];
    sections.areasToImprove = [...new Set(sections.areasToImprove)];
    sections.recommendations = [...new Set(sections.recommendations)];

    // Add default strength if none found
    if (sections.strengths.length === 0) {
      sections.strengths.push(
        "Focus on the areas of improvement to enhance your performance."
      );
    }

    return sections;
  };

  const feedbackSections = parseFeedback(feedback);

  useEffect(() => {
    const data = [
      {
        name: "Confidence",
        value: detailedScores.confidence,
      },
      {
        name: "Clarity",
        value: detailedScores.clarity,
      },
      {
        name: "Engagement",
        value: detailedScores.engagement,
      },
      {
        name: "Overall",
        value: score,
      },
    ];
    setChartData(data);
  }, [score, detailedScores]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
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
              {/* <Button
                variant="ghost"
                className="mb-6"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Button> */}
              {/* <div className="mb-8 text-left flex flex-col">
                <Avatar className="w-54 h-54 mb-4">
                  <AvatarImage src={sessionData.userImage || ""} />
                  <AvatarFallback className="bg-blue-500 text-white text-2xl">
                    {sessionData.userName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {sessionData.userName || "User"}
                </h2>
                <p className="text-gray-600">
                  {new Date().toLocaleDateString()}
                </p>
              </div> */}
              <Card className="overflow-hidden">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-lg sm:text-xl">
                      Your Performance Score
                    </span>
                    <span
                      className={`text-3xl sm:text-4xl ${getScoreColor(score)}`}
                    >
                      {score}/100
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full overflow-x-auto">
                    <div className="min-w-[600px] h-[300px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#1E90FF"
                            strokeWidth={2}
                            dot={{ strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle>Detailed Feedback</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="prose max-w-none space-y-4 sm:space-y-6 text-left">
                    {feedbackSections.summary && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Summary
                        </h3>
                        <p className="text-gray-700">
                          {feedbackSections.summary}
                        </p>
                      </div>
                    )}

                    {feedbackSections.strengths.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-green-700">
                          Key Strengths
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                          {feedbackSections.strengths.map((strength, index) => (
                            <li key={index} className="text-gray-700">
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {feedbackSections.areasToImprove.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-amber-700">
                          Areas to Improve
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                          {feedbackSections.areasToImprove.map(
                            (area, index) => (
                              <li key={index} className="text-gray-700">
                                {area}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {feedbackSections.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-blue-700">
                          Recommendations
                        </h3>
                        <ul className="list-disc pl-6 space-y-1">
                          {feedbackSections.recommendations.map(
                            (rec, index) => (
                              <li key={index} className="text-gray-700">
                                {rec}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 sm:mt-8 text-center">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#1E90FF] hover:bg-[#1E90FF]/90 text-white"
                  onClick={() => navigate("/dashboard")}
                >
                  Start New Practice
                </Button>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Feedback;
