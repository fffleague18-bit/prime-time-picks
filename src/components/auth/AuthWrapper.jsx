import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import LoginForm from "./LoginForm";
import { useLocation } from "react-router-dom";

export default function AuthWrapper({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    // Pass the intended destination to the login form
    const intendedDestination = location.pathname + location.search;
    return <LoginForm redirectUrl={intendedDestination} />;
  }

  return <>{children}</>;
}