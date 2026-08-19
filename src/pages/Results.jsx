import React, { useState, useEffect } from "react";
import { Game } from "@/entities/Game";
import { Prediction } from "@/entities/Prediction";
import { User } from "@/entities/User";
import AuthWrapper from "../components/auth/AuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, BarChartHorizontal, Home, TrendingUp, TrendingDown, Percent, Award } from "lucide-react";
import { format } from 'date-fns';
import PredictionsBreakdownTable from "../components/results/PredictionsBreakdownTable";
import AllPlayersGameSummary from "../components/results/AllPlayersGameSummary";
import { useSeason } from "@/lib/SeasonContext";

function ResultsContent() {
  const { currentSeason } = useSeason();
  const [completedGames, setCompletedGames] = useState([]);
  const [gamesForBreakdown, setGamesForBreakdown] = useState([]); // New state for the breakdown component
  const [predictions, setPredictions] = useState([]);
  const [allPredictions, setAllPredictions] = useState([]); // Add this for all players' predictions
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState("game-summary"); // New state for dropdown
  const [stats, setStats] = useState({
    totalPoints: 0,
    winningGames: 0,
    totalPlayed: 0,
  });
  const [gameStats, setGameStats] = useState({
    homeWinPercentage: 0,
    favoriteCoverPercentage: 0,
    overs: 0,
    unders: 0,
    pushes: 0,
    averageTotalPoints: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentSeason) return;
      try {
        const user = await User.me();
        setCurrentUser(user);
        const [completedGamesData, inProgressGamesData, predsData, allPredsData] = await Promise.all([
          Game.filter({ status: "completed", season: currentSeason }, "-game_date", 1000),
          Game.filter({ status: "in_progress", season: currentSeason }, "-game_date", 100),
          Prediction.filter({ player_id: user.id, season: currentSeason }, undefined, 1000),
          Prediction.filter({ season: currentSeason }, undefined, 5000)
        ]);
        setCompletedGames(completedGamesData);
        setGamesForBreakdown([...inProgressGamesData, ...completedGamesData]); // Combine for breakdown view
        setPredictions(predsData);
        setAllPredictions(allPredsData); // Store all predictions

        // Calculate User Performance Stats based on COMPLETED games
        const userPredictionsForCompletedGames = predsData.filter(p => 
          completedGamesData.some(g => g.id === p.game_id)
        );

        const totalPoints = userPredictionsForCompletedGames.reduce((acc, p) => acc + (p.points_earned || 0), 0);
        const winningGames = userPredictionsForCompletedGames.filter(p => p.points_earned > 0).length;
        const totalPlayed = userPredictionsForCompletedGames.length;

        setStats({ totalPoints, winningGames, totalPlayed });

        // Calculate Game Result Analytics based on COMPLETED games
        if (completedGamesData.length > 0) {
          let homeWins = 0;
          let favoriteCovers = 0;
          let overs = 0;
          let unders = 0;
          let pushesOU = 0;
          let totalPointsSum = 0;
          let gamesWithSpread = 0;

          completedGamesData.forEach(game => {
            if (game.home_score == null || game.away_score == null) return;
            
            totalPointsSum += game.home_score + game.away_score;
            if (game.home_score > game.away_score) homeWins++;

            // Favorite covers spread
            if (game.spread !== null && game.spread !== undefined) {
              gamesWithSpread++;
              const actualSpread = game.home_score - game.away_score;
              if (game.spread < 0) { // Home team is favorite (negative spread)
                if ((game.home_score - game.away_score) > Math.abs(game.spread)) { // Home wins by more than spread
                  favoriteCovers++;
                }
              } else if (game.spread > 0) { // Away team is favorite (positive spread)
                if ((game.away_score - game.home_score) > Math.abs(game.spread)) { // Away wins by more than spread
                  favoriteCovers++;
                }
              } else { // Spread is 0, typically means no favorite or even odds. Exclude from cover calculation if we only count favorites.
                gamesWithSpread--; // Don't count games with 0 spread towards favorite cover percentage if not explicitly defined.
              }
            }
            
            // Over/Under
            if (game.over_under !== null && game.over_under !== undefined) {
              const total = game.home_score + game.away_score;
              if (total > game.over_under) overs++;
              else if (total < game.over_under) unders++;
              else pushesOU++;
            }
          });
          
          setGameStats({
            homeWinPercentage: completedGamesData.length > 0 ? (homeWins / completedGamesData.length * 100).toFixed(1) : 0,
            favoriteCoverPercentage: gamesWithSpread > 0 ? (favoriteCovers / gamesWithSpread * 100).toFixed(1) : 0,
            overs: overs,
            unders: unders,
            pushes: pushesOU,
            averageTotalPoints: completedGamesData.length > 0 ? (totalPointsSum / completedGamesData.length).toFixed(1) : 0,
          });
        }
      } catch (err) {
        console.error("Failed to load results data:", err);
      } finally {
        setIsLoading(false);
      }
      };
      loadData();
      }, [currentSeason]);

      if (isLoading) {
    return <div className="p-8">Loading results...</div>;
  }

  const winRate = stats.totalPlayed > 0 ? ((stats.winningGames / stats.totalPlayed) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Game Results</h1>
          <div className="w-64">
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger>
                <SelectValue placeholder="Select a view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="game-summary">Game Summary</SelectItem>
                <SelectItem value="predictions-breakdown">Your Predictions Breakdown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartHorizontal className="w-6 h-6 text-emerald-600" />
              Your Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-100 rounded-lg">
              <h3 className="font-semibold text-slate-700">Total Points</h3>
              <p className="text-2xl font-bold">{stats.totalPoints}</p>
            </div>
            <div className="p-4 bg-slate-100 rounded-lg">
              <h3 className="font-semibold text-slate-700">Winning Games</h3>
              <p className="text-2xl font-bold">{stats.winningGames} / {stats.totalPlayed}</p>
            </div>
            <div className="p-4 bg-slate-100 rounded-lg">
              <h3 className="font-semibold text-slate-700">Win Rate</h3>
              <p className="text-2xl font-bold">{winRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChartHorizontal className="w-6 h-6 text-blue-600" />
                    League-Wide Game Analytics
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 flex items-center justify-center gap-1"><Home className="w-4 h-4"/> Home Win %</h3>
                    <p className="text-2xl font-bold">{gameStats.homeWinPercentage}%</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 flex items-center justify-center gap-1"><Percent className="w-4 h-4"/> Favorite Cover %</h3>
                    <p className="text-2xl font-bold">{gameStats.favoriteCoverPercentage}%</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Over/Under Record</h3>
                    <div className="flex justify-center items-center gap-2">
                        <div className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-green-600"/><span className="text-lg font-bold">{gameStats.overs}</span></div>
                        <span className="text-slate-400">/</span>
                        <div className="flex items-center gap-1"><TrendingDown className="w-4 h-4 text-red-600"/><span className="text-lg font-bold">{gameStats.unders}</span></div>
                    </div>
                     <p className="text-sm text-slate-500">Over-Under</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Avg. Total Pts</h3>
                    <p className="text-2xl font-bold">{gameStats.averageTotalPoints}</p>
                </div>
            </CardContent>
        </Card>

        {/* Conditional Content Based on Selected View */}
        {selectedView === "game-summary" && (
          <>
            {/* Add the All Players Game Summary */}
            <div className="mb-8">
              <AllPlayersGameSummary games={gamesForBreakdown} allPredictions={allPredictions} />
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Individual Game Results</h2>
              {completedGames.length > 0 ? completedGames.map(game => {
                const userPrediction = predictions.find(p => p.game_id === game.id);
                return (
                  <Card key={game.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{game.away_team} @ {game.home_team}</span>
                        <Badge variant="outline">{game.game_type}</Badge>
                      </CardTitle>
                      <p className="text-sm text-slate-500">{format(new Date(game.game_date), 'EEEE, MMMM d, yyyy')}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 text-center items-center mb-4">
                         <p className="text-2xl font-bold">{game.away_team} {game.away_score}</p>
                         <p className="text-lg text-slate-500">FINAL</p>
                         <p className="text-2xl font-bold">{game.home_team} {game.home_score}</p>
                      </div>
                      {userPrediction ? (
                        <div className="bg-slate-100 p-4 rounded-lg space-y-2">
                           <h4 className="font-semibold text-center mb-2">Your Picks & Result</h4>
                           <div className="flex justify-around items-center">
                              <div className="text-center">
                                <p className="text-sm text-slate-600">Your Pick</p>
                                <p className="font-semibold">{userPrediction.spread_pick === 'away' ? game.away_team : game.home_team} & {userPrediction.over_under_pick.toUpperCase()}</p>
                              </div>
                               <div className="text-center">
                                <p className="text-sm text-slate-600">Points Earned</p>
                                <p className="font-bold text-2xl text-emerald-600">{userPrediction.points_earned}</p>
                              </div>
                           </div>
                        </div>
                      ) : (
                        <div className="text-center text-slate-500 p-4 bg-slate-100 rounded-lg">You did not make a prediction for this game.</div>
                      )}
                    </CardContent>
                  </Card>
                );
              }) : <p>No completed games yet.</p>}
            </div>
          </>
        )}

        {selectedView === "predictions-breakdown" && (
          <div className="mb-8">
            <PredictionsBreakdownTable games={gamesForBreakdown} predictions={predictions} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return <AuthWrapper><ResultsContent /></AuthWrapper>;
}