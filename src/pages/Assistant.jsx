import React, { useState, useEffect } from 'react';
import { agentSDK } from '@/agents';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AuthWrapper from "../components/auth/AuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, Plus, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

function AssistantContent() {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const loadConversations = async () => {
            setIsLoading(true);
            try {
                const convos = await agentSDK.listConversations({ agent_name: "league_assistant" });
                setConversations(convos.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
            } catch (error) {
                console.error("Failed to load conversations:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConversations();
    }, []);

    const handleCreateConversation = async () => {
        setIsCreating(true);
        try {
            const newConversation = await agentSDK.createConversation({
                agent_name: "league_assistant",
                metadata: {
                    name: `Conversation on ${format(new Date(), 'MMM d, yyyy')}`,
                }
            });
            window.location.href = createPageUrl(`Conversation?id=${newConversation.id}`);
        } catch (error) {
            console.error("Failed to create conversation:", error);
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Bot className="w-16 h-16 mx-auto text-slate-300 animate-pulse" />
                    <p className="text-slate-500 mt-2">Loading conversations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-900">AI Assistant</h1>
                    <Button onClick={handleCreateConversation} disabled={isCreating} className="mt-4 sm:mt-0">
                        <Plus className="w-5 h-5 mr-2" />
                        {isCreating ? "Starting..." : "Start New Chat"}
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-emerald-600" />
                            Your Conversations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {conversations.length > 0 ? (
                            <div className="space-y-2">
                                {conversations.map(convo => (
                                    <Link key={convo.id} to={createPageUrl(`Conversation?id=${convo.id}`)}>
                                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-100 transition-colors">
                                            <div>
                                                <p className="font-semibold text-slate-800">{convo.metadata?.name || 'Untitled Conversation'}</p>
                                                <p className="text-sm text-slate-500">
                                                    Last updated: {format(new Date(convo.updated_date), 'PPP p')}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-400" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700">No conversations yet</h3>
                                <p className="text-slate-500 mt-1">Click "Start New Chat" to ask the assistant a question.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function AssistantPage() {
    return <AuthWrapper><AssistantContent /></AuthWrapper>;
}