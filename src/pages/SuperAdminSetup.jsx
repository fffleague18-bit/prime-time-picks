
import React, { useState, useEffect } from 'react';
import { makeBossLadySuperAdmin } from '@/functions/makeBossLadySuperAdmin';
import AuthWrapper from '../components/auth/AuthWrapper';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { User } from '@/entities/User';

function SuperAdminSetupContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
            } catch (e) {
                // Not logged in
            }
        };
        fetchUser();
    }, []);

    const handleGrantAccess = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const { data } = await makeBossLadySuperAdmin();
            if (data.error) {
                throw new Error(data.error);
            }
            setSuccess(data.message);
            // Refresh user data
            const user = await User.me();
            setCurrentUser(user);
        } catch (err) {
            setError(err.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const isAlreadySuperAdmin = currentUser?.display_name?.toLowerCase().includes('boss') && currentUser?.super_admin_level >= 3;

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex items-center justify-center">
            <div className="max-w-xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-8 h-8 text-emerald-600" />
                            Super Admin Grant Utility
                        </CardTitle>
                        <CardDescription>
                            Use this one-time utility to grant the user with email "fffleague18@gmail.com" the highest level of administrative access (Super Admin - Level 3).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && <div className="bg-red-100 text-red-700 p-4 rounded flex items-center"><AlertCircle className="w-5 h-5 mr-2"/>{error}</div>}
                        {success && <div className="bg-green-100 text-green-700 p-4 rounded flex items-center"><CheckCircle className="w-5 h-5 mr-2"/>{success}</div>}
                        
                        <p className="text-sm text-slate-600">
                            Clicking the button below will find the user with the email <span className="font-mono bg-slate-200 px-1 py-0.5 rounded">fffleague18@gmail.com</span> and elevate their privileges to Super Admin. This action is permanent.
                        </p>

                        <Button 
                            onClick={handleGrantAccess} 
                            disabled={isLoading || !!success || isAlreadySuperAdmin} 
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isLoading ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Promoting...</>
                            ) : (
                                "Grant Super Admin Access"
                            )}
                        </Button>
                        
                        {isAlreadySuperAdmin && (
                             <p className="text-center text-sm text-green-600 pt-2">
                                ✅ You are already a Super Admin. No action needed.
                            </p>
                        )}

                        {success && !isAlreadySuperAdmin && (
                            <p className="text-center text-sm text-slate-500 pt-2">
                                Access has been granted. Please refresh the page to see your new role.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function SuperAdminSetupPage() {
    return (
        <AuthWrapper>
            {/* No admin level required, allowing the user to click the button once */}
            <SuperAdminSetupContent />
        </AuthWrapper>
    );
}
