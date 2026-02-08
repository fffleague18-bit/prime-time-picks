import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Trophy } from "lucide-react";

export default function PredictionForm({ game, existingPrediction, onSubmit, onCancel, isSubmitting }) {
  const [prediction, setPrediction] = useState({
    spread_pick: existingPrediction?.spread_pick || '',
    over_under_pick: existingPrediction?.over_under_pick || '',
    super_bowl_total_guess: existingPrediction?.super_bowl_total_guess || ''
  });

  const [formError, setFormError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!prediction.spread_pick) {
      setFormError('Please select a team for the spread.');
      return;
    }
    
    if (!prediction.over_under_pick) {
      setFormError('Please select Over or Under.');
      return;
    }
    
    if (game.game_type?.toLowerCase().includes('super bowl') && (!prediction.super_bowl_total_guess || prediction.super_bowl_total_guess.trim() === '')) {
      setFormError('Super Bowl total points guess is required.');
      return;
    }
    
    // Clean the prediction data before submitting
    const cleanPrediction = {
      spread_pick: prediction.spread_pick,
      over_under_pick: prediction.over_under_pick
    };
    
    // Only include Super Bowl guess if it's valid
    if (game.game_type?.toLowerCase().includes('super bowl') && prediction.super_bowl_total_guess && prediction.super_bowl_total_guess.trim() !== '') {
      const guess = parseInt(prediction.super_bowl_total_guess.trim(), 10);
      if (!isNaN(guess) && guess >= 0) {
        cleanPrediction.super_bowl_total_guess = guess;
      }
    }
    
    onSubmit(cleanPrediction);
  };
  
  const getSpreadDisplay = (team) => {
    if (game.spread < 0) {
      return team === 'away' ? `+${Math.abs(game.spread)}` : game.spread;
    }
    if (game.spread > 0) {
      return team === 'away' ? -game.spread : `+${game.spread}`;
    }
    return "PICK";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Your Prediction</CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel} disabled={isSubmitting}>
              <X className="w-5 h-5"/>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold">{game.away_team} @ {game.home_team}</h3>
            <p className="text-slate-500">{game.game_type}</p>
          </div>

          {formError && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="font-semibold text-lg">Spread Pick</Label>
              <RadioGroup 
                value={prediction.spread_pick} 
                onValueChange={(v) => setPrediction(p => ({...p, spread_pick: v}))} 
                className="grid grid-cols-2 gap-4 mt-2"
              >
                <div>
                  <Label className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="away" id="away"/>
                    {game.away_team} ({getSpreadDisplay('away')})
                  </Label>
                </div>
                <div>
                  <Label className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="home" id="home"/>
                    {game.home_team} ({getSpreadDisplay('home')})
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label className="font-semibold text-lg">Total Points (O/U: {game.over_under})</Label>
              <RadioGroup 
                value={prediction.over_under_pick} 
                onValueChange={(v) => setPrediction(p => ({...p, over_under_pick: v}))} 
                className="grid grid-cols-2 gap-4 mt-2"
              >
                <div>
                  <Label className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="over" id="over"/>
                    Over {game.over_under}
                  </Label>
                </div>
                <div>
                  <Label className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="under" id="under"/>
                    Under {game.over_under}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            {game.game_type?.toLowerCase().includes('super bowl') && (
              <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
                <Label htmlFor="total-guess" className="font-semibold text-lg">
                  Tiebreaker: Total Points Guess
                </Label>
                <p className="text-sm text-slate-600 mb-3">Guess the combined final score</p>
                <Input 
                  id="total-guess" 
                  type="number" 
                  placeholder="e.g., 52" 
                  value={prediction.super_bowl_total_guess} 
                  onChange={(e) => setPrediction(p => ({...p, super_bowl_total_guess: e.target.value}))} 
                  min="0"
                  max="200"
                  step="1"
                  className="bg-white"
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                className="w-full" 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !prediction.spread_pick || !prediction.over_under_pick} 
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <Trophy className="w-4 h-4 mr-2"/>
                {isSubmitting ? "Saving..." : "Save Prediction"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}