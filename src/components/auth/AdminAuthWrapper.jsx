import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import AccessDenied from "../shared/AccessDenied";

export default function AdminAuthWrapper({ children, requiredLevel = 1 }) {
  const [authStatus, setAuthStatus] = useState('pending'); // 'pending', 'authorized', 'unauthorized'

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const user = await User.me();
        // Check admin level: 1 = Admin 2, 2 = Super Admin
        if (user && user.super_admin_level >= requiredLevel) {
          setAuthStatus('authorized');
        } else {
          setAuthStatus('unauthorized');
        }
      } catch (e) {
        // Not logged in or some other error
        setAuthStatus('unauthorized');
      }
    };
    
    checkAuthorization();
  }, [requiredLevel]);

  if (authStatus === 'pending') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return <AccessDenied />;
  }

  // If authorized, render children
  return <>{children}</>;
}