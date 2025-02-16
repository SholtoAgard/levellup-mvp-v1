
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import RolePlay from "@/pages/RolePlay";
import Feedback from "@/pages/Feedback";
import Subscription from "@/pages/Subscription";
import ThankYou from "@/pages/ThankYou";
import SupportCenter from "@/pages/SupportCenter";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/roleplay" element={<RolePlay />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/support" element={<SupportCenter />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
