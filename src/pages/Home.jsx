import React, { useEffect, useState } from "react";
import { User } from "@/entities/User";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy } from "lucide-react";
import LoginForm from "../components/auth/LoginForm";

const roleRedirects = {
  "admin": "/dashboard",
  "user": "/dashboard"
};

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        // Get redirect path based on user role
        const redirectPath = roleRedirects[user.role] || roleRedirects.user;
        
        // Small delay to show loading state, then redirect
        setTimeout(() => {
          navigate(redirectPath);
        }, 1000);
        
      } catch (error) {
        // User not authenticated, show login
        setCurrentUser(null);
        setIsLoading(false);
      }
    };

    checkUserAndRedirect();
  }, [navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white">
          <Trophy className="w-16 h-16 mx-auto text-emerald-400 mb-6 animate-bounce" />
          <h1 className="text-4xl font-bold mb-4">Football League</h1>
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">
            {currentUser ? `Welcome back, ${currentUser.display_name || currentUser.full_name}!` : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!currentUser) {
    return <LoginForm />;
  }

  // This shouldn't normally be reached due to redirect, but just in case
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="text-center text-white">
        <Trophy className="w-16 h-16 mx-auto text-emerald-400 mb-6" />
        <h1 className="text-4xl font-bold mb-4">Redirecting...</h1>
        <p className="text-slate-300">Taking you to your dashboard...</p>
      </div>
    </div>
  );
}