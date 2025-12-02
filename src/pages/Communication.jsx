
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import { Message } from "@/entities/Message";
import { SendEmail } from "@/integrations/Core";
import AuthWrapper from "../components/auth/AuthWrapper";
import AdminAuthWrapper from "../components/auth/AdminAuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageSquare, Send, Users, AlertCircle, CheckCircle } from "lucide-react";
import PlayerAvatar from "../components/shared/PlayerAvatar";

function CommunicationContent() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [user, userData] = await Promise.all([
        User.me(),
        User.list(undefined, 2000)
      ]);
      setCurrentUser(user);
      setPlayers(userData);
    } catch (err) {
      setError("Failed to load initial data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handlePlayerToggle = (playerId) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const selectAllPlayers = () => {
    setSelectedPlayers(players.map(p => p.id));
  };

  const clearSelection = () => {
    setSelectedPlayers([]);
  };

  const sendEmails = async () => {
    if (!emailSubject.trim() || !emailBody.trim() || selectedPlayers.length === 0) {
      setError("Please fill in subject, message, and select at least one player.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const selectedPlayerData = players.filter(p => selectedPlayers.includes(p.id));
      
      for (const player of selectedPlayerData) {
        await SendEmail({
          to: player.email,
          subject: emailSubject,
          body: emailBody,
          from_name: "Football League Admin"
        });
      }

      setSuccess(`Email sent successfully to ${selectedPlayers.length} player${selectedPlayers.length > 1 ? 's' : ''}!`);
      setEmailSubject("");
      setEmailBody("");
      setSelectedPlayers([]);
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError("Failed to send emails. Please try again.");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) {
      setError("Please enter a message.");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await Message.create({
        player_id: currentUser.id,
        player_name: `${currentUser.display_name || currentUser.full_name} (Admin)`,
        player_icon: currentUser.profile_icon || '👑',
        message: chatMessage
      });

      setSuccess("Message posted to league chat!");
      setChatMessage("");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to send chat message.");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Communication Center</h1>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 flex items-center"><AlertCircle className="w-5 h-5 mr-2"/>{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2"/>{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Email Communication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-6 h-6" />
                Send Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g., Important League Update"
                />
              </div>
              
              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="h-32"
                />
              </div>

              <Button 
                onClick={sendEmails} 
                disabled={isSending || selectedPlayers.length === 0}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? "Sending..." : `Send Email to ${selectedPlayers.length} Player${selectedPlayers.length !== 1 ? 's' : ''}`}
              </Button>
            </CardContent>
          </Card>

          {/* Chat Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Post to League Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="chat">Admin Message</Label>
                <Textarea
                  id="chat"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Post an admin message to the league chat..."
                  className="h-32"
                />
              </div>

              <Button 
                onClick={sendChatMessage} 
                disabled={isSending || !chatMessage.trim() || !currentUser}
                className="w-full bg-emerald-500 hover:bg-emerald-600"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {isSending ? "Posting..." : "Post to Chat"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Player Selection */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                Select Players for Email ({selectedPlayers.length}/{players.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllPlayers}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map(player => (
                <div 
                  key={player.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPlayers.includes(player.id) ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => handlePlayerToggle(player.id)}
                >
                  <Checkbox 
                    checked={selectedPlayers.includes(player.id)}
                    onChange={() => handlePlayerToggle(player.id)}
                  />
                  <PlayerAvatar icon={player.profile_icon} name={player.display_name || player.full_name} className="w-8 h-8" />
                  <div>
                    <p className="font-semibold text-sm">{player.display_name || player.full_name}</p>
                    <p className="text-xs text-slate-500">{player.email}</p>
                  </div>
                  {player.role === 'admin' && <Badge variant="outline">Admin</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CommunicationPage() {
  return (
    <AuthWrapper>
      <AdminAuthWrapper requiredLevel={2}>
        <CommunicationContent />
      </AdminAuthWrapper>
    </AuthWrapper>
  );
}
