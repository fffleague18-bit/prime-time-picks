import React, { useState, useEffect } from "react";
import { Game, Prediction, User } from "@/entities/all";
import AuthWrapper from "../components/auth/AuthWrapper";
import AdminAuthWrapper from "../components/auth/AdminAuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, Trash2, Plus } from "lucide-react";
import PlayerAvatar from "../components/shared/PlayerAvatar";
import { useSeason } from "@/lib/SeasonContext";

function ManualPredictionsContent() {
  const { currentSeason } = useSeason();
  const [games, setGames] = useState([]);
  const [players, setPlayers] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [spreadPick, setSpreadPick] = useState('');
  const [overUnderPick, setOverUnderPick] = useState('');
  const [superBowlGuess, setSuperBowlGuess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, [currentSeason]);

  useEffect(() => {
    if (selectedGame) {
      loadPredictionsForGame(selectedGame.id);
    } else {
      setPredictions([]); // Clear predictions if no game is selected
    }
  }, [selectedGame]);

  const loadInitialData = async () => {
    if (!currentSeason) return;
    setIsLoading(true);
    try {
      const [gamesData, playersData] = await Promise.all([
        Game.filter({ season: currentSeason }, 'game_date', 1000),
        User.list(undefined, 1000)
      ]);
      setGames(gamesData);
      setPlayers(playersData);
    } catch (err) {
      setError("Failed to load data.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPredictionsForGame = async (gameId) => {
    try {
      // Fetch predictions specifically for the selected game
      const predsData = await Prediction.filter({ game_id: gameId }, '-created_date', 1000);
      setPredictions(predsData);
    } catch (err) {
      console.error("Failed to load predictions:", err);
      setError("Failed to load predictions for the selected game.");
    }
  };

  const resetForm = () => {
    setSelectedPlayer(null);
    setSpreadPick('');
    setOverUnderPick('');
    setSuperBowlGuess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedGame?.id || !selectedPlayer || !spreadPick || !overUnderPick) {
      setError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const player = players.find(p => p.id === selectedPlayer);
      if (!player) {
        throw new Error("Selected player not found.");
      }
      
      const existingPrediction = predictions.find(p => 
        p.game_id === selectedGame.id && p.player_id === selectedPlayer
      );

      const payload = {
        game_id: selectedGame.id,
        player_id: selectedPlayer,
        player_name: player.display_name || player.full_name || player.email || "Player",
        player_icon: player.profile_icon || '🏈',
        spread_pick: spreadPick,
        over_under_pick: overUnderPick,
        season: selectedGame.season || currentSeason,
      };

      if (selectedGame.game_type === 'Super Bowl' && superBowlGuess && !isNaN(parseInt(superBowlGuess))) {
        payload.super_bowl_total_guess = parseInt(superBowlGuess);
      }

      if (existingPrediction) {
        await Prediction.update(existingPrediction.id, payload);
        setSuccess("Prediction updated successfully!");
      } else {
        await Prediction.create(payload);
        setSuccess("Prediction created successfully!");
      }

      await loadPredictionsForGame(selectedGame.id); // Reload predictions for the current game
      resetForm(); // Clear the form after submission
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(`Failed to save prediction: ${err.message}`);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (predictionId, playerName) => {
    if (!confirm(`Are you sure you want to delete the prediction for ${playerName}? This action cannot be undone.`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await Prediction.delete(predictionId);
      setSuccess("Prediction deleted successfully!");
      await loadPredictionsForGame(selectedGame.id); // Reload predictions for the current game
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to delete prediction: ${err.message}`);
      console.error(err);
    }
  };

  const getSpreadDisplay = (team) => {
    if (!selectedGame) return '';
    const spread = selectedGame.spread;
    if (spread === 0) return "PICK";
    if (team === 'home') { // Home team
      return spread < 0 ? `${spread}` : `+${spread}`; // If spread is -7, home team is -7. If spread is +7, home team is +7 (underdog).
    }
    if (team === 'away') { // Away team
      return spread > 0 ? `-${spread}` : `+${Math.abs(spread)}`; // If spread is +7, away team is -7. If spread is -7, away team is +7 (underdog).
    }
    return ''; // Should not reach here
  };


  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Manual Predictions Entry</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add/Edit Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="game">Select Game</Label>
                  <Select 
                    value={selectedGame?.id || ''} 
                    onValueChange={(value) => {
                      const game = games.find(g => g.id === value);
                      setSelectedGame(game); // Store the full game object
                      resetForm(); // Reset form when game changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a game..." />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map(game => (
                        <SelectItem key={game.id} value={game.id}>
                          Week {game.week}: {game.away_team} @ {game.home_team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="player">Select Player</Label>
                  <Select value={selectedPlayer || ''} onValueChange={setSelectedPlayer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a player..." />
                    </SelectTrigger>
                    <SelectContent>
                      {players.map(player => (
                        <SelectItem key={player.id} value={player.id}>
                          <div className="flex items-center gap-2">
                            <PlayerAvatar 
                              icon={player.profile_icon} 
                              name={player.display_name || player.full_name} 
                              className="w-6 h-6" 
                            />
                            {player.display_name || player.full_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedGame && (
                <>
                  <div className="bg-slate-100 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Game Details</h3>
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold">Spread:</span> {selectedGame.spread} | 
                      <span className="font-semibold"> Over/Under:</span> {selectedGame.over_under}
                    </p>
                  </div>

                  <div>
                    <Label className="font-semibold text-lg">Spread Pick</Label>
                    <RadioGroup value={spreadPick} onValueChange={setSpreadPick} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                          <RadioGroupItem value="away" id="away" />
                          {selectedGame.away_team} ({getSpreadDisplay('away')})
                        </Label>
                      </div>
                      <div>
                        <Label className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                          <RadioGroupItem value="home" id="home" />
                          {selectedGame.home_team} ({getSpreadDisplay('home')})
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="font-semibold text-lg">Over/Under Pick</Label>
                    <RadioGroup value={overUnderPick} onValueChange={setOverUnderPick} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                          <RadioGroupItem value="over" id="over" />
                          Over {selectedGame.over_under}
                        </Label>
                      </div>
                      <div>
                        <Label className="flex items-center gap-2 border p-4 rounded-lg cursor-pointer hover:bg-slate-50">
                          <RadioGroupItem value="under" id="under" />
                          Under {selectedGame.over_under}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {selectedGame.game_type === 'Super Bowl' && (
                    <div>
                      <Label htmlFor="super-bowl-guess" className="font-semibold">
                        Super Bowl Total Points Guess (Tiebreaker)
                      </Label>
                      <Input
                        id="super-bowl-guess"
                        type="number"
                        placeholder="e.g., 52"
                        value={superBowlGuess}
                        onChange={(e) => setSuperBowlGuess(e.target.value)}
                        min="0"
                        max="200"
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !selectedGame?.id || !selectedPlayer || !spreadPick || !overUnderPick}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Saving..." : "Save Prediction"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {selectedGame ? (
          <Card>
            <CardHeader>
              <CardTitle>
                Predictions for {selectedGame.away_team} @ {selectedGame.home_team}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {predictions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Spread Pick</TableHead>
                      <TableHead>O/U Pick</TableHead>
                      <TableHead>SB Guess</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {predictions.map(pred => (
                      <TableRow key={pred.id}>
                        <TableCell className="flex items-center gap-2">
                          <PlayerAvatar icon={pred.player_icon} name={pred.player_name} className="w-8 h-8" />
                          {pred.player_name}
                        </TableCell>
                        <TableCell>
                          {pred.spread_pick === 'away' ? selectedGame.away_team : selectedGame.home_team}
                          {` (${getSpreadDisplay(pred.spread_pick)})`}
                        </TableCell>
                        <TableCell className="uppercase">{pred.over_under_pick}</TableCell>
                        <TableCell>{pred.super_bowl_total_guess || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(pred.id, pred.player_name)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-slate-500 py-8">No predictions yet for this game.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <p className="text-center text-slate-500 py-6">Select a game above to view and manage its predictions.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ManualPredictionsPage() {
  return (
    <AuthWrapper>
      <AdminAuthWrapper>
        <ManualPredictionsContent />
      </AdminAuthWrapper>
    </AuthWrapper>
  );
}