
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import RolePlay from "@/pages/RolePlay";
import StartCall from "@/pages/StartCall";
import Account from "@/pages/Account";
import Support from "@/pages/SupportCenter";
import Feedback from "@/pages/Feedback";
import NotFound from "@/pages/NotFound";
import ThankYou from "@/pages/ThankYou";
import TermsOfService from "@/pages/TermsOfService";
import { Toaster } from "@/components/ui/toaster";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/roleplay" element={<RolePlay />} />
        <Route path="/start-call" element={<StartCall />} />
        <Route path="/account" element={<Account />} />
        <Route path="/support" element={<Support />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
