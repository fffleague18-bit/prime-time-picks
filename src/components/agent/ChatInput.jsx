import React, { useState, useRef } from 'react';
import { agentSDK } from "@/agents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from 'lucide-react';

export default function ChatInput({ conversation, disabled }) {
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const textareaRef = useRef(null);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || disabled || isSending) return;

        setIsSending(true);
        const messageContent = input;
        setInput('');

        try {
            await agentSDK.addMessage(conversation, {
                role: "user",
                content: messageContent
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            // Optionally, restore input so user can retry
            setInput(messageContent);
        } finally {
            setIsSending(false);
            textareaRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    return (
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask the assistant anything..."
                    className="pr-20 min-h-[52px]"
                    disabled={disabled || isSending}
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    disabled={!input.trim() || disabled || isSending}
                >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
            </div>
        </form>
    );
}