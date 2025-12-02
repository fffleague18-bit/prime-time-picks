import React, { useState } from "react";
import { User } from "@/entities/User";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Trophy } from "lucide-react";

export default function LoginForm({ redirectUrl }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      // Use the redirectUrl to ensure users land on the correct page after login
      await User.loginWithRedirect(redirectUrl || "/");
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 text-white border-slate-700 shadow-2xl shadow-emerald-500/10">
        <CardHeader className="text-center">
          <Trophy className="w-16 h-16 mx-auto text-emerald-400 mb-4" />
          <CardTitle className="text-3xl font-bold">Welcome to the League</CardTitle>
          <CardDescription className="text-slate-400">Sign in to make your picks and view standings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-6 text-lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {isLoggingIn ? "Redirecting..." : "Sign In with Google"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}