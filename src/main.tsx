
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import App from './App.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Account from './pages/Account.tsx';
import Auth from './pages/Auth.tsx';
import Index from './pages/Index.tsx';
import NotFound from './pages/NotFound.tsx';
import RolePlay from './pages/RolePlay.tsx';
import CallSession from './pages/CallSession.tsx';
import CallScore from './pages/CallScore.tsx';
import Subscription from './pages/Subscription.tsx';
import SupportCenter from './pages/SupportCenter.tsx';
import TermsOfService from './pages/TermsOfService.tsx';
import ThankYou from './pages/ThankYou.tsx';
import Feedback from './pages/Feedback.tsx';
import Refer from './pages/Refer.tsx';
import './index.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "account",
        element: <Account />,
      },
      {
        path: "auth",
        element: <Auth />,
      },
      {
        path: "roleplay",
        element: <RolePlay />,
      },
      {
        path: "call-session",
        element: <CallSession />,
      },
      {
        path: "call-score",
        element: <CallScore />,
      },
      {
        path: "subscription",
        element: <Subscription />,
      },
      {
        path: "support",
        element: <SupportCenter />,
      },
      {
        path: "terms",
        element: <TermsOfService />,
      },
      {
        path: "thank-you",
        element: <ThankYou />,
      },
      {
        path: "feedback",
        element: <Feedback />,
      },
      {
        path: "feedback/:sessionId",
        element: <Feedback />,
      },
      {
        path: "refer",
        element: <Refer />,
      }
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <>
    <RouterProvider router={router} />
    <Toaster />
  </>
);
