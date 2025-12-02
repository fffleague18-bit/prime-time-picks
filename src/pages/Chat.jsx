
import React, { useState, useEffect, useRef } from "react";
import { Message } from "@/entities/Message";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import AuthWrapper from "../components/auth/AuthWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Upload, Trash2, Paperclip, X } from "lucide-react";
import PlayerAvatar from "../components/shared/PlayerAvatar";

function ChatContent() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  const loadMessages = async () => {
    try {
      const fetchedMessages = await Message.list('-created_date', 100);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);
        
        // Update last seen chat timestamp
        await User.updateMyUserData({
          last_seen_chat: new Date().toISOString()
        });
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    fetchUser();
    loadMessages();

    const interval = setInterval(loadMessages, 5000); // Check for new messages every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file) return;

    setIsSending(true);
    let fileUrl = null;
    let fileType = null;

    try {
      if (file) {
        const { file_url } = await UploadFile({ file });
        fileUrl = file_url;
        fileType = file.type;
      }
      
      await Message.create({
        player_id: currentUser.id,
        player_name: currentUser.display_name || currentUser.full_name,
        player_icon: currentUser.profile_icon || '🏈',
        message: newMessage,
        file_url: fileUrl,
        file_type: fileType,
      });

      setNewMessage("");
      setFile(null);
      await loadMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await Message.delete(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };
  
  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
  };

  const renderFile = (msg) => {
    if (!msg.file_url) return null;
    
    if (msg.file_type && msg.file_type.startsWith('image/')) {
      return <img src={msg.file_url} alt="Uploaded content" className="mt-2 rounded-lg max-w-full h-auto" />;
    }
    
    return (
      <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 bg-slate-200 p-2 rounded-lg text-slate-800 hover:bg-slate-300">
        <Paperclip className="w-4 h-4" />
        <span className="truncate text-sm">View Attached File</span>
      </a>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <header className="p-4 border-b bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900">League Chat</h1>
      </header>
      
      <main className="flex-1 flex flex-col-reverse overflow-y-auto p-4 space-y-4 space-y-reverse">
        {messages.map((msg) => (
          <div key={msg.id} className={`group flex items-start gap-3 ${msg.player_id === currentUser?.id ? "flex-row-reverse" : ""}`}>
            <PlayerAvatar icon={msg.player_icon} name={msg.player_name} className="w-10 h-10 shrink-0" textClassName="text-xl" />
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.player_id === currentUser?.id ? "bg-emerald-500 text-white" : "bg-white shadow-sm"}`}>
              <p className="font-bold text-sm">{msg.player_name}</p>
              {msg.message && <p>{msg.message}</p>}
              {renderFile(msg)}
              <p className={`text-xs mt-1 ${msg.player_id === currentUser?.id ? "text-emerald-100" : "text-slate-400"}`}>{new Date(msg.created_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
            </div>
            
            {/* Only show delete button for user's own messages */}
            {msg.player_id === currentUser?.id && (
              <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteMessage(msg.id)}>
                <Trash2 className="w-4 h-4 text-slate-500" />
              </Button>
            )}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-8 text-slate-500 m-auto">
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        )}
      </main>
      
      <footer className="p-4 border-t bg-white sticky bottom-0">
        <form onSubmit={handleSendMessage} className="space-y-2">
          {file && (
            <div className="flex items-center gap-2 text-sm bg-slate-100 p-2 rounded">
              <Paperclip className="w-4 h-4" />
              <span className="truncate">{file.name}</span>
              <Button variant="ghost" size="icon" className="w-6 h-6 ml-auto" onClick={() => setFile(null)}><X className="w-4 h-4" /></Button>
            </div>
          )}
          <div className="flex gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current.click()}>
              <Upload className="w-5 h-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={isSending}
            />
            <Button type="submit" size="icon" disabled={isSending || (!newMessage.trim() && !file)}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </footer>
    </div>
  );
}

export default function ChatPage() {
  return <AuthWrapper><ChatContent /></AuthWrapper>;
}
