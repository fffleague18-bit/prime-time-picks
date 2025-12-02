
import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { SendEmail } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, X, Send } from "lucide-react";
import { format } from "date-fns";
import { createPageUrl } from "@/utils";

const delay = ms => new Promise(res => setTimeout(res, ms));

export default function GameNotificationForm({ game, onClose }) {
  const [players, setPlayers] = useState([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);
  const [subject, setSubject] = useState(`Reminder: Picks for ${game.away_team} @ ${game.home_team}`);
  
  // Get the current domain for the prediction link - use proper page URL
  const baseUrl = window.location.origin;
  const predictionLink = `${baseUrl}${createPageUrl("Dashboard")}`;
  
  const [body, setBody] = useState(`Just a friendly reminder to get your picks in for the upcoming game!

${game.away_team} vs. ${game.home_team}
Date: ${format(new Date(game.game_date), 'EEEE, MMMM d, yyyy h:mm a')}
Spread: ${game.spread < 0 ? `${game.home_team} ${game.spread}` : `${game.away_team} +${game.spread}`}
Over/Under: ${game.over_under}

Click here to submit your predictions:
${predictionLink}

Good luck!`);
  
  const [isSending, setIsSending] = useState(false);
  const [sendingStatus, setSendingStatus] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoadingPlayers(true);
      try {
        const allPlayers = await User.list(undefined, 2000);
        console.log("Loaded players:", allPlayers.length); // Debug log
        setPlayers(allPlayers);
      } catch (err) {
        console.error("Failed to load players:", err);
        setError("Failed to load players. Please try again.");
      } finally {
        setIsLoadingPlayers(false);
      }
    };
    loadPlayers();
  }, []);

  const handleSend = async () => {
    if (!subject || !body) {
      setError("Subject and body are required.");
      return;
    }
    
    // Filter players who are eligible to receive emails
    const playersToSend = players.filter(p => p.email_notifications !== false && p.email);
    if (playersToSend.length === 0) {
      setError("No players found with email notifications enabled.");
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      let sentCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < playersToSend.length; i++) {
        const player = playersToSend[i];
        setSendingStatus(`Sending ${i + 1} of ${playersToSend.length}...`);
        
        try {
          await SendEmail({
            to: player.email,
            subject: subject,
            body: body,
            from_name: "Football League Admin"
          });
          sentCount++;
        } catch (emailError) {
          console.error(`Failed to send email to ${player.email}:`, emailError);
          failedCount++;
          if (emailError.response && emailError.response.status === 429) {
            setSendingStatus("Rate limit hit. Pausing for 5 seconds...");
            await delay(5000); // Wait longer if we detect a rate limit error
            i--; // Decrement i to retry the current email
            continue; // Continue to the next iteration (which will re-process the same 'i')
          }
        }
        
        // Add a small delay between each email to avoid general rate limiting
        await delay(500); // 0.5 second delay
      }
      
      if (sentCount > 0) {
        setSuccess(`Email sent to ${sentCount} players!${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
      } else {
        setError("No emails were sent. Check logs for details.");
      }
    } catch (err) {
      setError("An unexpected error occurred while sending emails.");
      console.error("Email sending error:", err);
    } finally {
      setIsSending(false);
      setSendingStatus("");
      if (success) { // Only close if success message is set
        setTimeout(() => {
          onClose();
        }, 3000); // Increased delay for better user experience after sending
      }
    }
  };

  // Count players who will receive emails (default to true if email_notifications not set)
  const emailEnabledCount = players.filter(p => p.email_notifications !== false && p.email).length;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Notify Players</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5"/></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="bg-red-100 text-red-700 p-3 rounded flex items-center"><AlertCircle className="w-5 h-5 mr-2"/>{error}</div>}
          {success && <div className="bg-green-100 text-green-700 p-3 rounded flex items-center"><CheckCircle className="w-5 h-5 mr-2"/>{success}</div>}
          
          {isLoadingPlayers ? (
            <p className="text-sm text-slate-600">Loading players...</p>
          ) : (
            <p className="text-sm text-slate-600">
              This will send an email to all players with email notifications enabled ({emailEnabledCount} players).
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} className="h-40" />
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
            <strong>Link included:</strong> {predictionLink}
          </div>
          <Button 
            onClick={handleSend} 
            disabled={isSending || isLoadingPlayers || emailEnabledCount === 0} 
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSending ? sendingStatus : `Send Notification`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
