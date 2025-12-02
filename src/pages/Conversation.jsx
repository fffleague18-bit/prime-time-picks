import React, { useState, useEffect, useRef } from 'react';
import { agentSDK } from '@/agents';
import { User } from "@/entities/User";
import { createPageUrl } from "@/utils";
import AuthWrapper from "../components/auth/AuthWrapper";
import MessageBubble from "../components/agent/MessageBubble";
import ChatInput from "../components/agent/ChatInput";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

function ConversationContent() {
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const conversationId = new URLSearchParams(window.location.search).get("id");

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const user = await User.me();
                setCurrentUser(user);

                const convo = await agentSDK.getConversation(conversationId);
                setConversation(convo);
                setMessages(convo.messages);
            } catch (error) {
                console.error("Failed to load conversation", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [conversationId]);

    useEffect(() => {
        if (!conversationId) return;
        const unsubscribe = agentSDK.subscribeToConversation(conversationId, (data) => {
            setMessages(data.messages);
        });
        return () => unsubscribe();
    }, [conversationId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const isAgentThinking = messages.length > 0 && messages[messages.length - 1].role !== 'user' && !messages[messages.length - 1].content && messages[messages.length - 1].tool_calls?.some(tc => tc.status !== 'completed');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Bot className="w-16 h-16 mx-auto text-slate-300 animate-pulse" />
                    <p className="text-slate-500 mt-2">Loading conversation...</p>
                </div>
            </div>
        );
    }
    
    if (!conversation) {
        return <div className="p-8">Conversation not found.</div>;
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50">
            <header className="p-4 border-b bg-white flex items-center gap-4 sticky top-0 z-10">
                <Link to={createPageUrl("Assistant")}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-bold text-lg text-slate-900">{conversation.metadata?.name || 'Conversation'}</h1>
                    <p className="text-sm text-slate-500">With the League Assistant</p>
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && (
                    <div className="text-center text-slate-500 pt-16">
                        <MessageSquare className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h2 className="text-xl font-semibold">Start of your conversation</h2>
                        <p>Ask a question to get started.</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} currentUser={currentUser} />
                ))}
                <div ref={messagesEndRef} />
            </main>
            
            <ChatInput conversation={conversation} disabled={isAgentThinking} />
        </div>
    );
}

export default function ConversationPage() {
    return <AuthWrapper><ConversationContent /></AuthWrapper>;
}