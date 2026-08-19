import React, { useState, useEffect } from "react";
import { isAfter, format } from 'date-fns';
import { Game } from "@/entities/Game";
import { Prediction } from "@/entities/Prediction";
import { User } from "@/entities/User";
import AuthWrapper from "../components/auth/AuthWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Archive, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import GameCard from "../components/games/GameCard";
import PredictionForm from "../components/games/PredictionForm";
import { Button } from "@/components/ui/button";
import GameRules from "../components/games/GameRules";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSeason } from "@/lib/SeasonContext";

const gameTypeColors = {
  "Monday Night Football": "border-l-4 border-l-blue-500 bg-blue-50/30",
  "Thursday Night Football": "border-l-4 border-l-purple-500 bg-purple-50/30",
  "Sunday Night Football": "border-l-4 border-l-green-500 bg-green-50/30",
  "Saturday Night Football": "border-l-4 border-l-orange-500 bg-orange-50/30",
  "Super Bowl": "border-l-4 border-l-yellow-500 bg-yellow-50/30",
  "Playoff Game": "border-l-4 border-l-red-500 bg-red-50/30",
  "Default": "border-l-4 border-l-slate-300"
};

// Helper to ensure game_date from DB is always interpreted as UTC
const parseGameDateAsUTC = (dateString) => {
  if (!dateString) return new Date();
  // Force UTC interpretation by appending 'Z' if it's missing
  const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  return new Date(utcString);
};

function GamesContent() {
  const { currentSeason } = useSeason();
  const [games, setGames] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [thisWeekGames, setThisWeekGames] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!currentSeason) return;
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);
        const [gamesData, predsData] = await Promise.all([
          Game.filter({ season: currentSeason }, 'game_date', 2000),
          Prediction.filter({ player_id: user.id, season: currentSeason }, '-created_date', 1000)
        ]);
        setGames(gamesData);
        setPredictions(predsData);
        
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const weekly = gamesData.filter(g => {
          const gameDate = parseGameDateAsUTC(g.game_date);
          return g.status === 'upcoming' && gameDate <= nextWeek;
        });
        setThisWeekGames(weekly);

      } catch (err) {
        setError("Failed to load game data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
      };
      loadData();
      }, [currentSeason]);

      const formatInUserTimezone = (dateString) => {
    // Parse the date as UTC
    const utcDate = parseGameDateAsUTC(dateString);
    let tz = currentUser?.time_zone;

    // Normalize common timezone issues
    if (tz) {
      tz = tz.replace(/\s+/g, '_');
      tz = tz.replace(/^america\//i, 'America/');
      tz = tz.replace(/^europe\//i, 'Europe/');
      tz = tz.replace(/^pacific\//i, 'Pacific/');
    }

    // Fallback if timezone is not set or Intl is not supported
    if (!tz || typeof Intl.DateTimeFormat?.prototype.formatToParts !== 'function') {
        return format(utcDate, 'EEE, MMM d, h:mm a');
    }

    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: tz,
        }).formatToParts(utcDate).reduce((acc, part) => {
            acc[part.type] = part.value;
            return acc;
        }, {});
        
        return `${parts.weekday}, ${parts.month} ${parts.day} • ${parts.hour}:${parts.minute} ${parts.dayPeriod}`;
    } catch (e) {
        console.warn(`Invalid timezone "${tz}" for user ${currentUser?.email}, falling back to local time`);
        return format(utcDate, 'EEE, MMM d, h:mm a');
    }
  };

  const handleSubmitPrediction = async (predictionData) => {
    if (!currentUser || !selectedGame) {
      setError("Unable to submit prediction. Please try refreshing the page.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      const existingPrediction = predictions.find(p => 
        p.game_id === selectedGame.id && p.player_id === currentUser.id
      );
      
      const payload = {
        game_id: selectedGame.id,
        player_id: currentUser.id,
        player_name: currentUser.display_name || currentUser.full_name || currentUser.email || "Player",
        player_icon: currentUser.profile_icon || '🏈',
        spread_pick: predictionData.spread_pick,
        over_under_pick: predictionData.over_under_pick,
        season: selectedGame.season || currentSeason,
      };

      if (predictionData.super_bowl_total_guess && !isNaN(predictionData.super_bowl_total_guess)) {
        payload.super_bowl_total_guess = predictionData.super_bowl_total_guess;
      }

      console.log("Submitting prediction:", payload);

      let newOrUpdatedPrediction;
      if (existingPrediction) {
        newOrUpdatedPrediction = await Prediction.update(existingPrediction.id, payload);
        setSuccess("Prediction updated!");
      } else {
        newOrUpdatedPrediction = await Prediction.create(payload);
        setSuccess("Prediction saved!");
      }
      
      console.log("Prediction operation successful:", newOrUpdatedPrediction);
      
      setPredictions(prev => {
        const otherPredictions = prev.filter(p => p.id !== newOrUpdatedPrediction.id);
        return [newOrUpdatedPrediction, ...otherPredictions];
      });
      
      setSelectedGame(null);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error("Prediction error:", err);
      setError("Failed to save prediction. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const upcomingGames = games.filter(g => g.status === 'upcoming');
  const completedGames = games.filter(g => g.status === 'completed').sort((a, b) => {
    const dateA = parseGameDateAsUTC(a.game_date);
    const dateB = parseGameDateAsUTC(b.game_date);
    return dateB - dateA;
  });

  if(isLoading) {
    return <div className="p-8">Loading games...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Games & Predictions</h1>
          <Button variant="outline" onClick={() => setShowRules(true)} className="mt-2 sm:mt-0">
            <HelpCircle className="w-4 h-4 mr-2" />
            View Game Rules
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2"/>
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2"/>
            {success}
          </div>
        )}
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">This Week's Games</h2>
          <div className="space-y-4">
            {thisWeekGames.length > 0 ? thisWeekGames.map(game => {
              const cardColor = gameTypeColors[game.game_type] || gameTypeColors.Default;
              const isSuperBowl = game.game_type?.toLowerCase().includes('super bowl');
              
              let spreadDisplay;
              if (game.spread < 0) {
                spreadDisplay = `${game.home_team} ${game.spread}`;
              } else if (game.spread > 0) {
                spreadDisplay = `${game.away_team} ${-game.spread}`;
              } else {
                spreadDisplay = "Pick'em";
              }

              return (
                <Card key={game.id} className={`p-4 ${cardColor}`}>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                      <p className="font-bold">{game.away_team} @ {game.home_team}</p>
                      <p className="text-sm text-slate-500">
                        {formatInUserTimezone(game.game_date)}
                      </p>
                    </div>
                    <Badge className="mt-2 sm:mt-0 self-start sm:self-center">{game.game_type}</Badge>
                  </div>
                  <div className="text-sm text-slate-600 bg-slate-100 p-2 rounded-md mt-3">
                    <span className="font-semibold">Spread:</span> {spreadDisplay} | <span className="font-semibold">Over/Under:</span> {game.over_under}
                  </div>
                  {isSuperBowl && (
                    <div className="mt-3 text-sm text-slate-700 bg-yellow-50 border border-yellow-200 p-2 rounded-md">
                      ⚡ <span className="font-semibold">Tiebreaker:</span> Submit your total game score guess when making your prediction
                    </div>
                  )}
                </Card>
              )
            }) : <p className="text-slate-500">No games scheduled for this week.</p>}
          </div>
        </div>

        {selectedGame && (
          <PredictionForm
            game={selectedGame}
            existingPrediction={predictions.find(p => p.game_id === selectedGame.id)}
            onSubmit={handleSubmitPrediction}
            onCancel={() => setSelectedGame(null)}
            isSubmitting={isSubmitting}
          />
        )}
        
        {showRules && <GameRules onClose={() => setShowRules(false)} />}
        
        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-2 md:w-96">
            <TabsTrigger value="upcoming"><Calendar className="w-4 h-4 mr-2"/>All Upcoming</TabsTrigger>
            <TabsTrigger value="archive"><Archive className="w-4 h-4 mr-2"/>Archive</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-6 space-y-6">
            {upcomingGames.length > 0 ? upcomingGames.map(game => {
              // Check if game is locked - CRITICAL: Compare UTC times
              const gameTimeUTC = parseGameDateAsUTC(game.game_date);
              const nowUTC = new Date();
              const isLocked = nowUTC >= gameTimeUTC;
              
              return (
                <GameCard 
                  key={game.id}
                  game={game}
                  userPrediction={predictions.find(p => p.game_id === game.id)}
                  isLocked={isLocked}
                  onMakePrediction={setSelectedGame}
                  formatDate={formatInUserTimezone}
                />
              );
            }) : <p>No upcoming games.</p>}
          </TabsContent>
          <TabsContent value="archive" className="mt-6 space-y-6">
            {completedGames.length > 0 ? completedGames.map(game => (
              <GameCard 
                key={game.id}
                game={game}
                userPrediction={predictions.find(p => p.game_id === game.id)}
                isLocked={true}
                isCompleted={true}
                formatDate={formatInUserTimezone}
              />
            )) : <p>No completed games yet.</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function GamesPage() {
  return <AuthWrapper><GamesContent /></AuthWrapper>;
}