import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, CheckCircle, Loader2 } from "lucide-react";

export default function ScoreUpdateForm({ game, onClose, onSubmit, isSubmitting }) {
  const [scores, setScores] = useState({
    away_score: game.away_score || '',
    home_score: game.home_score || ''
  });
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const awayScore = parseInt(scores.away_score, 10);
    const homeScore = parseInt(scores.home_score, 10);

    if (isNaN(awayScore) || isNaN(homeScore) || awayScore < 0 || homeScore < 0) {
      setError("Please enter valid, non-negative scores for both teams.");
      return;
    }
    
    onSubmit({ away_score: awayScore, home_score: homeScore });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Update Final Score</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
              <X className="w-5 h-5"/>
            </Button>
          </div>
          <p className="text-sm text-slate-500">{game.away_team} @ {game.home_team}</p>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="away_score">{game.away_team}</Label>
                <Input 
                  id="away_score" 
                  type="number" 
                  value={scores.away_score}
                  onChange={(e) => setScores({...scores, away_score: e.target.value})}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="home_score">{game.home_team}</Label>
                <Input 
                  id="home_score" 
                  type="number" 
                  value={scores.home_score}
                  onChange={(e) => setScores({...scores, home_score: e.target.value})}
                  required 
                />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Finalizing...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2"/> Save & Calculate Results</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}