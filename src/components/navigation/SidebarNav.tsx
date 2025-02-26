
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UserCircle,
  Receipt,
  HelpCircle,
  FileText,
  Share2,
  MessageCircle,
  ClipboardList,
} from "lucide-react";

interface SidebarNavProps {
  onNavigation?: () => void;
}

export const SidebarNav = ({ onNavigation }: SidebarNavProps) => {
  const handleClick = () => {
    if (onNavigation) {
      onNavigation();
    }
  };

  return (
    <nav className="space-y-2">
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
            isActive ? "bg-gray-100 text-gray-900" : ""
          }`
        }
        onClick={handleClick}
      >
        <LayoutDashboard className="h-4 w-4" />
        Dashboard
      </NavLink>
      <NavLink
        to="/account"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
            isActive ? "bg-gray-100 text-gray-900" : ""
          }`
        }
        onClick={handleClick}
      >
        <UserCircle className="h-4 w-4" />
        Account
      </NavLink>
      <NavLink
        to="/subscription"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
            isActive ? "bg-gray-100 text-gray-900" : ""
          }`
        }
        onClick={handleClick}
      >
        <Receipt className="h-4 w-4" />
        Subscription
      </NavLink>
      <NavLink
        to="/support"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
            isActive ? "bg-gray-100 text-gray-900" : ""
          }`
        }
        onClick={handleClick}
      >
        <HelpCircle className="h-4 w-4" />
        Support
      </NavLink>
      <NavLink
        to="/terms"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
            isActive ? "bg-gray-100 text-gray-900" : ""
          }`
        }
        onClick={handleClick}
      >
        <FileText className="h-4 w-4" />
        Terms
      </NavLink>
      <NavLink
        to="/refer"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
            isActive ? "bg-gray-100 text-gray-900" : ""
          }`
        }
        onClick={handleClick}
      >
        <Share2 className="h-4 w-4" />
        Refer
      </NavLink>
      <NavLink
        to="/feedback"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
            isActive ? "bg-gray-100 text-gray-900" : ""
          }`
        }
        onClick={handleClick}
      >
        <MessageCircle className="h-4 w-4" />
        Feedback
      </NavLink>
      <NavLink
        to="/user-survey"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ${
            isActive ? "bg-gray-100 text-gray-900" : ""
          }`
        }
        onClick={handleClick}
      >
        <ClipboardList className="h-4 w-4" />
        Survey
      </NavLink>
    </nav>
  );
};
