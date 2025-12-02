import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Minus } from "lucide-react";
import { format } from 'date-fns';

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

export default function PredictionsBreakdownTable({ games, predictions }) {
  const getSpreadDisplayForPick = (game, prediction) => {
    if (!prediction) return "No Pick";
    const teamName = prediction.spread_pick === 'away' ? game.away_team : game.home_team;
    if (game.spread === 0) return teamName;
    if (prediction.spread_pick === 'home') {
        return `${teamName} ${game.spread < 0 ? game.spread : `+${game.spread}`}`;
    }
    // away pick
    return `${teamName} ${game.spread > 0 ? -game.spread : `+${-game.spread}`}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Predictions Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Game</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Final Score</TableHead>
              <TableHead>Your Spread Pick</TableHead>
              <TableHead>Spread Result</TableHead>
              <TableHead>Your O/U Pick</TableHead>
              <TableHead>O/U Result</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.length > 0 ? games.map(game => {
              const userPrediction = predictions.find(p => p.game_id === game.id);
              const spreadResult = getPickResult(game, userPrediction, 'spread');
              const ouResult = getPickResult(game, userPrediction, 'over_under');
              
              return (
                <TableRow key={game.id}>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div>{game.away_team} @ {game.home_team}</div>
                      <Badge variant="outline" className="text-xs">{game.game_type}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(game.game_date), 'MMM d')}
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    {game.away_score} - {game.home_score}
                  </TableCell>
                  <TableCell className="text-sm">
                    {userPrediction ? getSpreadDisplayForPick(game, userPrediction) : "No Pick"}
                  </TableCell>
                  <TableCell>
                    {userPrediction ? spreadResult.component : <Badge variant="outline">No Pick</Badge>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {userPrediction ? userPrediction.over_under_pick.toUpperCase() : "No Pick"}
                  </TableCell>
                  <TableCell>
                    {userPrediction ? ouResult.component : <Badge variant="outline">No Pick</Badge>}
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {userPrediction ? userPrediction.points_earned : 0}
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center">No completed games yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}