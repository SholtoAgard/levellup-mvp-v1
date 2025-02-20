
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Account from "@/pages/Account";
import Subscription from "@/pages/Subscription";
import Feedback from "@/pages/Feedback";
import RolePlay from "@/pages/RolePlay";
import ThankYou from "@/pages/ThankYou";
import SupportCenter from "@/pages/SupportCenter";
import NotFound from "@/pages/NotFound";
import TermsOfService from "@/pages/TermsOfService";
import "./App.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/account" element={<Account />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/roleplay" element={<RolePlay />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/support" element={<SupportCenter />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
