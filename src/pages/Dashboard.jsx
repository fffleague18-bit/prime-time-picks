import React, { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Prize } from "@/entities/Prize";
import AuthWrapper from "../components/auth/AuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, Users, Calendar } from "lucide-react";
import PlayerAvatar from "../components/shared/PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import { useSeason } from "@/lib/SeasonContext";

// COMPLETELY RESTRUCTURED DASHBOARD - NO PREDICTION BREAKDOWN ANYWHERE
function DashboardContent() {
  const { currentSeason } = useSeason();
  const [currentUser, setCurrentUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentSeason) return;
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        // Fetch all necessary data
        // We now assume total_score, record, and games_played are calculated and overridden on the backend
        const [allUsers, allPrizes] = await Promise.all([
          User.list('-total_score', 2000), // Sort by score directly from the API
          Prize.filter({ season: currentSeason }, 'place', 100),
        ]);

        setPrizes(allPrizes);
        
        // Sort by score, then by name for ties (secondary sort on frontend)
        const sortedLeaderboard = allUsers.sort((a, b) => {
          const scoreA = a.total_score ?? 0;
          const scoreB = b.total_score ?? 0;
          if (scoreB !== scoreA) {
            return scoreB - scoreA;
          }
          // Secondary sort by name for ties
          return (a.display_name || a.full_name || '').localeCompare(b.display_name || b.full_name || '');
        });
        
        setLeaderboard(sortedLeaderboard);

      } catch (err) {
        console.error("Dashboard loading error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [currentSeason]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* PRIMARY ACTION: Make Your Predictions */}
        <div className="text-center">
          <Link to={createPageUrl("Games")}>
            <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-xl font-semibold shadow-lg">
              <Calendar className="w-6 h-6 mr-3" />
              Make Your Predictions
            </Button>
          </Link>
        </div>

        {/* SEASON PRIZES SECTION */}
        {prizes.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="w-7 h-7 text-yellow-500" />
                Season Prizes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-center">
                {prizes.map(prize => (
                  <div key={prize.id} className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-lg font-bold text-emerald-600 mb-2">${prize.amount.toLocaleString()}</div>
                    <div className="text-sm font-semibold text-slate-700">{prize.description}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEASON STANDINGS SECTION */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-7 h-7 text-emerald-600" />
                Season Standings
              </div>
              <Badge variant="secondary" className="text-base font-normal">
                <Users className="w-4 h-4 mr-2" />
                {leaderboard.length} Players
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {leaderboard.length > 0 ? leaderboard.map((player, index) => {
                let currentRank = index + 1;
                let isTied = false;

                const playerTotalPoints = player.total_score ?? 0;
                
                // Calculate actual rank considering ties
                let rankIndex = index;
                while (rankIndex > 0 && (leaderboard[rankIndex - 1].total_score ?? 0) === playerTotalPoints) {
                  rankIndex--;
                }
                currentRank = rankIndex + 1;

                isTied = (index > 0 && (leaderboard[index - 1].total_score ?? 0) === playerTotalPoints) ||
                         (index < leaderboard.length - 1 && (leaderboard[index + 1].total_score ?? 0) === playerTotalPoints);
                
                const displayRank = isTied ? `T${currentRank}` : String(currentRank);
                
                return (
                  <div key={player.id} className={`flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors ${player.id === currentUser?.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''}`}>
                    <div className="w-8 flex justify-center items-center">
                      <span className="font-bold text-slate-700">{displayRank}</span>
                    </div>
                    <PlayerAvatar 
                      icon={player.profile_icon} 
                      name={player.display_name || player.full_name} 
                      className="w-14 h-14" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg text-slate-800 truncate">
                        {player.display_name || player.full_name}
                      </p>
                      <p className="text-sm text-slate-500 font-medium">
                        Record: {player.record || '0-0-0'} • {player.games_played || 0} games played
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600">{playerTotalPoints} pts</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-16 text-slate-500">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No player data available yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthWrapper>
      <DashboardContent />
    </AuthWrapper>
  );
}