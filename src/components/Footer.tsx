
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-6 border-t mt-auto">
      <div className="container mx-auto px-4 text-center text-sm text-gray-600">
        ©2025 LevellUp. All rights reserved.{" "}
        <Link to="/terms" className="hover:text-gray-900 underline">
          Terms of service
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
