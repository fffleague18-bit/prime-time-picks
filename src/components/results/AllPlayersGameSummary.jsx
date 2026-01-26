import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ShieldQuestion, Lock } from "lucide-react";
import { format, isBefore, compareDesc } from "date-fns";
import PlayerAvatar from "../shared/PlayerAvatar";

// A more versatile card that can show anonymous counts or revealed player picks.
const PredictionCategoryCard = ({ title, picks, showNames }) => (
    <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
            {showNames ? (
                // Revealed view: Show player names and avatars
                picks.length > 0 ? (
                    <div className="space-y-3">
                        {picks.map(p => (
                            <div key={p.id} className="flex items-center gap-2">
                                <PlayerAvatar icon={p.player_icon} name={p.player_name} className="w-8 h-8" textClassName="text-sm" />
                                <span className="text-sm font-medium text-slate-700">{p.player_name}</span>
                                {p.super_bowl_total_guess && (
                                    <span className="text-xs text-slate-500 ml-auto">{p.super_bowl_total_guess}</span>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-500 pt-6">No picks in this category.</div>
                )
            ) : (
                // Anonymous view: Show only the count
                <div className="text-center pt-4">
                    <p className="text-4xl font-bold text-emerald-600">{picks.length}</p>
                    <p className="text-sm text-slate-500">Prediction{picks.length !== 1 ? 's' : ''}</p>
                </div>
            )}
        </CardContent>
    </Card>
);

export default function AllPlayersGameSummary({ games, allPredictions }) {
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => compareDesc(new Date(a.game_date), new Date(b.game_date)));
  }, [games]);

  const defaultGameId = sortedGames.length > 0 ? sortedGames[0].id : "";
  const [selectedGameId, setSelectedGameId] = useState(defaultGameId);

  if (games.length === 0) {
    return (
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-slate-600" />
                Prediction Breakdown
            </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-slate-500">No games available for prediction breakdown.</p>
        </CardContent>
      </Card>
    );
  }

  const selectedGameData = games.find(g => g.id === selectedGameId);
  
  if (!selectedGameData) return null;

  const gameHasStarted = !isBefore(new Date(), new Date(selectedGameData.game_date));

  // Determine favorite and underdog
  const homeIsFav = selectedGameData.spread < 0;
  const favTeamName = homeIsFav ? selectedGameData.home_team : selectedGameData.away_team;
  const dogTeamName = homeIsFav ? selectedGameData.away_team : selectedGameData.home_team;
  const favSpread = Math.abs(selectedGameData.spread); // This variable is no longer used but kept as per existing code structure.

  // Get all unique predictions for the selected game
  const gamePredictions = allPredictions.filter(p => p.game_id === selectedGameId);
  const uniquePredictions = Object.values(gamePredictions.reduce((acc, p) => {
    if (!acc[p.player_id] || new Date(p.created_date) > new Date(acc[p.player_id].created_date)) {
      acc[p.player_id] = p;
    }
    return acc;
  }, {}));

  // Categorize predictions
  const favPickValue = homeIsFav ? 'home' : 'away';
  const dogPickValue = homeIsFav ? 'away' : 'home';
  const categories = {
    fav_over: uniquePredictions.filter(p => p.spread_pick === favPickValue && p.over_under_pick === 'over'),
    fav_under: uniquePredictions.filter(p => p.spread_pick === favPickValue && p.over_under_pick === 'under'),
    dog_over: uniquePredictions.filter(p => p.spread_pick === dogPickValue && p.over_under_pick === 'over'),
    dog_under: uniquePredictions.filter(p => p.spread_pick === dogPickValue && p.over_under_pick === 'under'),
  };

  const getSpreadText = (spread) => {
    if (spread === 0) return 'PICK';
    return spread > 0 ? `+${spread}` : spread;
  }
  
  const homeSpreadText = getSpreadText(selectedGameData.spread);
  const awaySpreadText = getSpreadText(-selectedGameData.spread);
  
  const pickForFav = homeIsFav ? { team: selectedGameData.home_team, spread: homeSpreadText } : { team: selectedGameData.away_team, spread: awaySpreadText };
  const pickForDog = homeIsFav ? { team: selectedGameData.away_team, spread: awaySpreadText } : { team: selectedGameData.home_team, spread: homeSpreadText };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-6 h-6 text-slate-600" />
          Prediction Breakdown
        </CardTitle>
        <CardDescription>
          {!gameHasStarted 
            ? "Predictions are anonymous until the game starts. Counts are displayed below."
            : "The game has started! See who picked what."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Select value={selectedGameId} onValueChange={setSelectedGameId}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Select a game..." />
            </SelectTrigger>
            <SelectContent>
              {sortedGames.map(game => (
                <SelectItem key={game.id} value={game.id}>
                  {game.away_team} @ {game.home_team} - {format(new Date(game.game_date), 'MMM d, yyyy')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-slate-100 p-4 rounded-lg">
          <div className="text-center mb-3">
            <h3 className="text-xl font-bold">
              {selectedGameData.away_team} @ {selectedGameData.home_team}
            </h3>
            <p className="text-sm text-slate-600">
              {format(new Date(selectedGameData.game_date), 'EEEE, MMM d, yyyy @ h:mm a')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center text-sm">
            <div><span className="font-semibold">Favorite:</span><br />{favTeamName} ({getSpreadText(homeIsFav ? selectedGameData.spread : -selectedGameData.spread)})</div>
            <div><span className="font-semibold">Over/Under:</span><br />{selectedGameData.over_under}</div>
            <div><span className="font-semibold">Total Predictions:</span><br />{uniquePredictions.length}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PredictionCategoryCard 
            title={`${pickForFav.team} ${pickForFav.spread} & Over`}
            picks={categories.fav_over}
            showNames={gameHasStarted}
          />
          <PredictionCategoryCard 
            title={`${pickForFav.team} ${pickForFav.spread} & Under`}
            picks={categories.fav_under}
            showNames={gameHasStarted}
          />
          <PredictionCategoryCard 
            title={`${pickForDog.team} ${pickForDog.spread} & Over`}
            picks={categories.dog_over}
            showNames={gameHasStarted}
          />
          <PredictionCategoryCard 
            title={`${pickForDog.team} ${pickForDog.spread} & Under`}
            picks={categories.dog_under}
            showNames={gameHasStarted}
          />
        </div>
      </CardContent>
    </Card>
  );
}