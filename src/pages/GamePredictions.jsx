
import React, { useState, useEffect } from "react";
import { Game, Prediction, User } from "@/entities/all";
import { Link, useLocation } from "react-router-dom";
import AuthWrapper from "../components/auth/AuthWrapper";
import AdminAuthWrapper from "../components/auth/AdminAuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Minus } from "lucide-react";
import PlayerAvatar from "../components/shared/PlayerAvatar";

const getPickResult = (game, prediction, type) => {
    if (!prediction || game.home_score === null || game.away_score === null) {
      return { status: 'pending', component: <Badge variant="outline">Pending</Badge> };
    }
  
    let correct = false;
    let push = false;
  
    if (type === 'spread') {
      const actualSpread = game.home_score - game.away_score;
      const pickedSpread = game.spread;
      if (prediction.spread_pick === 'home') {
        if (actualSpread + pickedSpread > 0) correct = true;
        if (actualSpread + pickedSpread === 0) push = true;
      } else { // away
        if (actualSpread + pickedSpread < 0) correct = true;
        if (actualSpread + pickedSpread === 0) push = true;
      }
    } else { // over_under
      const total = game.home_score + game.away_score;
      if (total === game.over_under) {
        push = true;
      } else if (prediction.over_under_pick === 'over' && total > game.over_under) {
        correct = true;
      } else if (prediction.over_under_pick === 'under' && total < game.over_under) {
        correct = true;
      }
    }
  
    if (push) return { status: 'push', component: <Badge variant="secondary" className="flex items-center gap-1"><Minus className="w-3 h-3"/> Push</Badge> };
    if (correct) return { status: 'win', component: <Badge className="bg-green-100 text-green-800 flex items-center gap-1"><Check className="w-3 h-3"/> Win</Badge> };
    return { status: 'loss', component: <Badge variant="destructive" className="flex items-center gap-1"><X className="w-3 h-3"/> Loss</Badge> };
};

function GamePredictionsContent() {
  const [game, setGame] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const gameId = params.get('gameId');

    if (!gameId) {
      setError("No game ID provided.");
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [gameData, predsData] = await Promise.all([
          Game.get(gameId),
          Prediction.filter({ game_id: gameId }, '-created_date', 1000)
        ]);
        setGame(gameData);
        setPredictions(predsData);
      } catch (err) {
        setError("Failed to load game prediction data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [location.search]);

  if (isLoading) {
    return <div className="p-8">Loading game predictions...</div>;
  }
  
  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!game) {
    return <div className="p-8">Game not found.</div>;
  }

  const getSpreadDisplayForPick = (pick) => {
    const teamName = pick.spread_pick === 'away' ? game.away_team : game.home_team;
    if (game.spread === 0) return teamName;
    if (pick.spread_pick === 'home') {
        return `${teamName} ${game.spread < 0 ? game.spread : `+${game.spread}`}`;
    }
    // away pick
    return `${teamName} ${game.spread > 0 ? -game.spread : `+${-game.spread}`}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-slate-900">{game.away_team} @ {game.home_team}</h1>
            <p className="text-slate-600">Prediction Breakdown</p>
        </div>

        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Game Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><span className="font-semibold">Final Score:</span> {game.status === 'completed' ? `${game.away_score} - ${game.home_score}`: 'Pending'}</div>
                <div><span className="font-semibold">Spread:</span> {game.spread}</div>
                <div><span className="font-semibold">Over/Under:</span> {game.over_under}</div>
                <div><span className="font-semibold">Status:</span> <Badge variant={game.status === 'completed' ? 'default' : 'outline'}>{game.status}</Badge></div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Player Picks</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Spread Pick</TableHead>
                  <TableHead>Spread Result</TableHead>
                  <TableHead>O/U Pick</TableHead>
                  <TableHead>O/U Result</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {predictions.length > 0 ? predictions.map(p => {
                    const spreadResult = getPickResult(game, p, 'spread');
                    const ouResult = getPickResult(game, p, 'over_under');
                    return (
                        <TableRow key={p.id}>
                            <TableCell className="flex items-center gap-2">
                                <PlayerAvatar icon={p.player_icon} name={p.player_name} className="w-8 h-8"/>
                                {p.player_name}
                            </TableCell>
                            <TableCell>{getSpreadDisplayForPick(p)}</TableCell>
                            <TableCell>{spreadResult.component}</TableCell>
                            <TableCell>{p.over_under_pick.toUpperCase()}</TableCell>
                            <TableCell>{ouResult.component}</TableCell>
                            <TableCell className="text-right font-bold">{p.points_earned}</TableCell>
                        </TableRow>
                    )
                }) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">No predictions were made for this game.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GamePredictionsPage() {
    return (
        <AuthWrapper>
            <AdminAuthWrapper>
                <GamePredictionsContent />
            </AdminAuthWrapper>
        </AuthWrapper>
    )
}
