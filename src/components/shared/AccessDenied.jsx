import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShieldAlert } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-red-100 rounded-full p-3 w-fit">
                    <ShieldAlert className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl mt-4">Access Denied</CardTitle>
                <CardDescription>You do not have the required permissions to view this page.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-slate-600">This administrative section is restricted to the super administrator.</p>
                <Link to={createPageUrl("Dashboard")}>
                    <Button className="mt-6 w-full">Return to Dashboard</Button>
                </Link>
            </CardContent>
        </Card>
    </div>
  );
}