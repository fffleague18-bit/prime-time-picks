import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AuthWrapper from "../components/auth/AuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, DollarSign, Lock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import PlayerAvatar from "../components/shared/PlayerAvatar";
import { useSeason } from "@/lib/SeasonContext";

function SuperBowlSquares10Content() {
  const { currentSeason } = useSeason();
  const [settings, setSettings] = useState(null);
  const [squares, setSquares] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSquares, setSelectedSquares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customName, setCustomName] = useState('');

  const colors = [
    { bg: 'bg-red-300', border: 'border-red-500', text: 'text-red-950' },
    { bg: 'bg-blue-300', border: 'border-blue-500', text: 'text-blue-950' },
    { bg: 'bg-emerald-300', border: 'border-emerald-500', text: 'text-emerald-950' },
    { bg: 'bg-amber-300', border: 'border-amber-500', text: 'text-amber-950' },
    { bg: 'bg-purple-300', border: 'border-purple-500', text: 'text-purple-950' },
    { bg: 'bg-pink-300', border: 'border-pink-500', text: 'text-pink-950' },
    { bg: 'bg-orange-400', border: 'border-orange-600', text: 'text-orange-950' },
    { bg: 'bg-teal-300', border: 'border-teal-500', text: 'text-teal-950' },
    { bg: 'bg-indigo-300', border: 'border-indigo-500', text: 'text-indigo-950' },
    { bg: 'bg-cyan-300', border: 'border-cyan-500', text: 'text-cyan-950' },
    { bg: 'bg-rose-300', border: 'border-rose-500', text: 'text-rose-950' },
    { bg: 'bg-lime-300', border: 'border-lime-500', text: 'text-lime-950' },
    { bg: 'bg-fuchsia-300', border: 'border-fuchsia-500', text: 'text-fuchsia-950' },
    { bg: 'bg-violet-300', border: 'border-violet-500', text: 'text-violet-950' },
    { bg: 'bg-sky-300', border: 'border-sky-500', text: 'text-sky-950' },
    { bg: 'bg-yellow-300', border: 'border-yellow-500', text: 'text-yellow-950' },
    { bg: 'bg-red-400', border: 'border-red-600', text: 'text-red-950' },
    { bg: 'bg-green-400', border: 'border-green-600', text: 'text-green-950' },
    { bg: 'bg-blue-400', border: 'border-blue-600', text: 'text-blue-950' },
    { bg: 'bg-purple-400', border: 'border-purple-600', text: 'text-purple-950' },
    { bg: 'bg-pink-400', border: 'border-pink-600', text: 'text-pink-950' },
    { bg: 'bg-amber-400', border: 'border-amber-600', text: 'text-amber-950' },
    { bg: 'bg-teal-400', border: 'border-teal-600', text: 'text-teal-950' },
    { bg: 'bg-indigo-400', border: 'border-indigo-600', text: 'text-indigo-950' },
    { bg: 'bg-emerald-400', border: 'border-emerald-600', text: 'text-emerald-950' },
  ];

  const getColorForName = (name) => {
    if (!name) return colors[0];
    const uniqueNames = [...new Set(squares.map(s => s.player_name).filter(Boolean))].sort();
    const index = uniqueNames.indexOf(name);
    return colors[index % colors.length];
  };

  useEffect(() => {
    loadData();

    const unsubscribe = base44.entities.SuperBowlSquare10.subscribe((event) => {
      try {
        if (event.type === 'create' || event.type === 'update') {
          if (event.data) {
            setSquares(prev => {
              const filtered = prev.filter(s => s.id !== event.id);
              return [...filtered, event.data];
            });
          }
        } else if (event.type === 'delete') {
          setSquares(prev => prev.filter(s => s.id !== event.id));
        }
      } catch (err) {
        console.error('Subscription error:', err);
        // Just reload data silently on error
        setTimeout(() => loadData(), 500);
      }
    });

    return () => unsubscribe();
  }, [currentSeason]);

  const loadData = async () => {
    if (!currentSeason) return;
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [settingsData, squaresData, payoutsData] = await Promise.all([
        base44.entities.SuperBowlSettings10.filter({ season: currentSeason }),
        base44.entities.SuperBowlSquare10.filter({ season: currentSeason }),
        base44.entities.SuperBowlPayout10.filter({ season: currentSeason })
      ]);

      setSettings(settingsData[0] || null);
      setSquares(squaresData);
      setPayouts(payoutsData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSquareData = (row, col) => {
    return squares.find(s => s.row === row && s.col === col);
  };

  const handleSquareClick = (row, col) => {
    const square = getSquareData(row, col);
    if (square && square.player_id && square.player_id !== currentUser.id) return;
    if (square && square.is_locked) return;

    const key = `${row}-${col}`;
    if (selectedSquares.some(s => s.key === key)) {
      setSelectedSquares(selectedSquares.filter(s => s.key !== key));
    } else {
      setSelectedSquares([...selectedSquares, { row, col, key }]);
    }
  };

  const handleSubmit = async () => {
    if (selectedSquares.length === 0) return;
    if (!customName.trim()) {
      alert('Please enter a name for the squares');
      return;
    }

    try {
      for (const sq of selectedSquares) {
        const existing = getSquareData(sq.row, sq.col);
        const data = {
          row: sq.row,
          col: sq.col,
          player_id: currentUser.id,
          player_name: customName.trim(),
          player_icon: currentUser.icon,
          is_locked: true,
          season: currentSeason,
        };

        try {
          if (existing) {
            await base44.entities.SuperBowlSquare10.update(existing.id, data);
          } else {
            await base44.entities.SuperBowlSquare10.create(data);
          }
        } catch (err) {
          if (err.message?.includes('not found')) {
            await base44.entities.SuperBowlSquare10.create(data);
          } else {
            throw err;
          }
        }
      }

      setSelectedSquares([]);
      setCustomName('');
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Error saving squares. Please try again.');
      await loadData();
    }
  };

  const handleRemoveSquare = (row, col) => {
    setSelectedSquares(selectedSquares.filter(s => !(s.row === row && s.col === col)));
  };

  const mySquares = squares.filter(s => s.player_id === currentUser?.id);
  const totalOwed = mySquares.filter(s => s.is_locked).length * 10;

  if (isLoading) return <div className="p-8">Loading...</div>;

  const TeamIcon = ({ icon, name }) => {
    if (icon && icon.startsWith('http')) {
      return <img src={icon} alt={name} className="w-8 h-8 rounded-full object-cover" />;
    }
    return <span className="text-2xl">{icon || '🏈'}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Super Bowl Squares - $10</h1>
            <p className="text-sm sm:text-base text-slate-600">Pick your squares - $10 per square</p>
          </div>
          {settings && (
            <div className="flex items-center gap-2 sm:gap-4 text-sm sm:text-base">
              <div className="flex items-center gap-1 sm:gap-2">
                <TeamIcon icon={settings.away_team_icon} name={settings.away_team_name} />
                <span className="font-semibold">{settings.away_team_name || 'Away'}</span>
              </div>
              <span className="text-slate-400">vs</span>
              <div className="flex items-center gap-1 sm:gap-2">
                <TeamIcon icon={settings.home_team_icon} name={settings.home_team_name} />
                <span className="font-semibold">{settings.home_team_name || 'Home'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Your Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">${totalOwed}</div>
              <p className="text-sm text-slate-600">{mySquares.filter(s => s.is_locked).length} squares locked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Payouts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {payouts.sort((a, b) => {
                const order = { '1st Quarter': 1, 'Halftime': 2, '3rd Quarter': 3, 'Final Score': 4 };
                return order[a.quarter] - order[b.quarter];
              }).map(p => (
                <div key={p.id} className="text-sm">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="font-semibold">{p.quarter}:</span>
                    <span className="font-bold text-right">${p.amount}</span>
                  </div>
                  {p.score && <div className="text-xs text-slate-500 ml-2">Score: {p.score}</div>}
                  {p.winner_name && <div className="text-xs text-emerald-600 font-medium ml-2">Winner: {p.winner_name}</div>}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Squares</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSquares.length === 0 ? (
                <p className="text-sm text-slate-500">Click squares to select</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">{selectedSquares.length} squares - ${selectedSquares.length * 10}</p>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">Name for squares</label>
                    <Input
                      placeholder="Enter name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button onClick={handleSubmit} className="w-full bg-emerald-500 hover:bg-emerald-600">
                    Submit & Lock Squares
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-2 sm:p-6">
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <div className="inline-block min-w-[600px]">
                <table className="border-collapse mx-auto">
                  <tbody>
                    <tr>
                      <td className="w-8 h-8 sm:w-12 sm:h-12"></td>
                      <td className="w-8 h-8 sm:w-12 sm:h-12"></td>
                      <td className="text-center font-bold p-1 sm:p-2 text-xs sm:text-base" colSpan={10}>
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <TeamIcon icon={settings?.home_team_icon} name={settings?.home_team_name} />
                          <span className="hidden sm:inline">{settings?.home_team_name || 'Home Team'}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="w-8 h-8 sm:w-12 sm:h-12"></td>
                      <td className="w-8 h-8 sm:w-12 sm:h-12"></td>
                      {[0,1,2,3,4,5,6,7,8,9].map((col) => (
                        <td key={col} className="w-8 h-8 sm:w-12 sm:h-12 text-center text-xs sm:text-base font-bold bg-slate-100 border border-slate-300">
                          {settings?.game_started ? (settings?.home_numbers || [0,1,2,3,4,5,6,7,8,9])[col] : '?'}
                        </td>
                      ))}
                    </tr>
                    {[0,1,2,3,4,5,6,7,8,9].map((row) => (
                      <tr key={row}>
                        {row === 0 && (
                          <td rowSpan={10} className="bg-slate-100 border border-slate-300 align-middle p-1 sm:p-2">
                            <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base" style={{writingMode: 'vertical-lr'}}>
                              <TeamIcon icon={settings?.away_team_icon} name={settings?.away_team_name} />
                              <span className="font-bold hidden sm:inline">{settings?.away_team_name || 'Away Team'}</span>
                            </div>
                          </td>
                        )}
                        <td className="w-8 h-8 sm:w-12 sm:h-12 text-center text-xs sm:text-base font-bold bg-slate-100 border border-slate-300">
                          {settings?.game_started ? (settings?.away_numbers || [0,1,2,3,4,5,6,7,8,9])[row] : '?'}
                        </td>
                        {[0,1,2,3,4,5,6,7,8,9].map((col) => {
                          const square = getSquareData(row, col);
                          const isSelected = selectedSquares.some(s => s.row === row && s.col === col);
                          const isMine = square?.player_id === currentUser?.id;
                          const isLocked = square?.is_locked;
                          const isOccupied = square?.player_id && square.player_id !== currentUser?.id;
                          const playerColor = square?.player_name ? getColorForName(square.player_name) : null;

                          return (
                            <td
                              key={col}
                              onClick={() => !isOccupied && !isLocked && handleSquareClick(row, col)}
                              className={`w-8 h-8 sm:w-12 sm:h-12 border-2 relative cursor-pointer transition-all ${
                                isSelected ? 'bg-blue-200 border-blue-400' :
                                square?.player_name && isLocked ? `${playerColor.bg} ${playerColor.border} cursor-not-allowed` :
                                square?.player_name && !isLocked ? `${playerColor.bg} ${playerColor.border} hover:opacity-80` :
                                'bg-white border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {square?.player_name && (
                                <div className="absolute inset-0 flex items-center justify-center p-0.5 sm:p-1">
                                  <span className={`text-[6px] sm:text-[8px] font-bold text-center leading-[1.1] break-words overflow-hidden ${playerColor?.text || ''}`}>{square.player_name}</span>
                                </div>
                              )}
                              {isLocked && isMine && (
                                <Lock className="w-2 h-2 sm:w-3 sm:h-3 absolute top-0.5 right-0.5 text-emerald-600" />
                              )}
                              {isSelected && !isLocked && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSquare(row, col);
                                  }}
                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                                >
                                  <X className="w-2 h-2 sm:w-3 sm:h-3" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SuperBowlSquares10Page() {
  return (
    <AuthWrapper>
      <SuperBowlSquares10Content />
    </AuthWrapper>
  );
}