
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, Trophy, Edit, Star } from "lucide-react";
import { format } from "date-fns";
import PlayerAvatar from "../shared/PlayerAvatar";

const gameTypeColors = {
  "Monday Night Football": "border-l-4 border-l-blue-500 bg-blue-50/30",
  "Thursday Night Football": "border-l-4 border-l-purple-500 bg-purple-50/30",
  "Sunday Night Football": "border-l-4 border-l-green-500 bg-green-50/30",
  "Saturday Night Football": "border-l-4 border-l-orange-500 bg-orange-50/30",
  "Super Bowl": "border-l-4 border-l-yellow-500 bg-yellow-50/30",
  "Playoff Game": "border-l-4 border-l-red-500 bg-red-50/30",
  "Default": "border-l-4 border-l-slate-300"
};

export default function GameCard({ game, userPrediction, isLocked, isCompleted, onMakePrediction, formatDate }) {
  const getStatusBadge = () => {
    if (isCompleted) {
        const points = userPrediction?.points_earned;
        if (typeof points !== 'undefined') {
            return <Badge className="bg-emerald-100 text-emerald-800">{points} pt{points !== 1 ? 's' : ''} earned</Badge>
        }
        return <Badge variant="outline">Completed</Badge>;
    }
    if (isLocked) return <Badge variant="secondary">Locked</Badge>;
    if (userPrediction) return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-1"/>Submitted</Badge>;
    return null;
  };
  
  const spreadDisplay = game.spread < 0 
    ? `${game.home_team} ${game.spread}` 
    : `${game.away_team} ${-game.spread}`;

  const cardColor = gameTypeColors[game.game_type] || gameTypeColors.Default;
  
  const displayDate = formatDate 
    ? formatDate(game.game_date) 
    : format(new Date(game.game_date), 'EEE, MMM d • h:mm a');

  return (
    <Card className={`shadow-lg transition-all duration-300 ${isCompleted || !game.is_active ? 'bg-slate-50' : 'bg-white'} ${cardColor}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Badge className="font-semibold mb-2">{game.game_type}</Badge>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              {displayDate}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="grid grid-cols-3 items-center text-center gap-4 mb-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <PlayerAvatar icon={game.away_team_icon} name={game.away_team} className="w-12 h-12" />
            <span className="font-bold text-lg">{game.away_team}</span>
          </div>
          <div className="text-slate-500 font-bold text-lg">VS</div>
          <div className="flex flex-col items-center justify-center gap-2">
            <PlayerAvatar icon={game.home_team_icon} name={game.home_team} className="w-12 h-12" />
            <span className="font-bold text-lg">{game.home_team}</span>
          </div>
        </div>

        <div className="text-center text-sm text-slate-600 bg-slate-100 p-2 rounded-md mb-4">
          Spread: {spreadDisplay} | Over/Under: {game.over_under}
        </div>

        {userPrediction && !isCompleted && (
             <div className="bg-blue-50 p-3 rounded-lg text-center mb-4">
                <p className="font-semibold text-blue-800 flex items-center justify-center gap-2"><Star className="w-4 h-4 text-yellow-500"/> Your Pick</p>
                <p className="text-sm text-slate-700">
                  {userPrediction.spread_pick === 'away' ? game.away_team : game.home_team} & {userPrediction.over_under_pick.toUpperCase()}
                </p>
             </div>
        )}

        {isCompleted && userPrediction && (
             <div className="bg-slate-100 p-3 rounded-lg text-center mb-4">
                <p className="font-semibold">Your Pick: {userPrediction.spread_pick === 'away' ? game.away_team : game.home_team} & {userPrediction.over_under_pick.toUpperCase()}</p>
             </div>
        )}

        {!isLocked && game.is_active && (
            <Button 
              onClick={() => onMakePrediction(game)}
              className={`w-full ${!userPrediction ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
              variant={userPrediction ? "outline" : "default"}
            >
              {userPrediction ? <><Edit className="w-4 h-4 mr-2"/>Edit Prediction</> : <><Trophy className="w-4 h-4 mr-2"/>Make Prediction</>}
            </Button>
        )}
         {!game.is_active && !isCompleted && <div className="text-center text-sm text-slate-500">Predictions will open soon.</div>}
      </CardContent>
    </Card>
  );
}
