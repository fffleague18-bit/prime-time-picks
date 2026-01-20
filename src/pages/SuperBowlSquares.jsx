import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AuthWrapper from "../components/auth/AuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, DollarSign, Lock, X } from "lucide-react";
import PlayerAvatar from "../components/shared/PlayerAvatar";

function SuperBowlSquaresContent() {
  const [settings, setSettings] = useState(null);
  const [squares, setSquares] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSquares, setSelectedSquares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);

      const [settingsData, squaresData, payoutsData] = await Promise.all([
        base44.entities.SuperBowlSettings.list(),
        base44.entities.SuperBowlSquare.list(),
        base44.entities.SuperBowlPayout.list()
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
    
    // Can't select if already owned by someone else or locked
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

    try {
      for (const sq of selectedSquares) {
        const existing = getSquareData(sq.row, sq.col);
        const data = {
          row: sq.row,
          col: sq.col,
          player_id: currentUser.id,
          player_name: currentUser.display_name || currentUser.full_name,
          player_icon: currentUser.icon,
          is_locked: true
        };

        if (existing) {
          await base44.entities.SuperBowlSquare.update(existing.id, data);
        } else {
          await base44.entities.SuperBowlSquare.create(data);
        }
      }

      setSelectedSquares([]);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSquare = (row, col) => {
    setSelectedSquares(selectedSquares.filter(s => !(s.row === row && s.col === col)));
  };

  const mySquares = squares.filter(s => s.player_id === currentUser?.id);
  const totalOwed = mySquares.filter(s => s.is_locked).length * 5;

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Super Bowl Squares</h1>
            <p className="text-slate-600">Pick your squares - $5 per square</p>
          </div>
          {settings && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TeamIcon icon={settings.away_team_icon} name={settings.away_team_name} />
                <span className="font-semibold">{settings.away_team_name || 'Away'}</span>
              </div>
              <span className="text-slate-400">vs</span>
              <div className="flex items-center gap-2">
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
                const order = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Final': 4 };
                return order[a.quarter] - order[b.quarter];
              }).map(p => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.quarter}:</span>
                  <span className="font-bold">${p.amount}</span>
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
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{selectedSquares.length} squares - ${selectedSquares.length * 5}</p>
                  <Button onClick={handleSubmit} className="w-full bg-emerald-500 hover:bg-emerald-600">
                    Submit & Lock Squares
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <table className="border-collapse">
                  <tbody>
                    <tr>
                      <td className="w-12 h-12"></td>
                      <td className="text-center font-bold p-2" colSpan={10}>
                        <div className="flex items-center justify-center gap-2">
                          <TeamIcon icon={settings?.home_team_icon} name={settings?.home_team_name} />
                          <span>{settings?.home_team_name || 'Home Team'}</span>
                          <span>→</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="w-12 h-12"></td>
                      {(settings?.home_numbers || [0,1,2,3,4,5,6,7,8,9]).map((num, i) => (
                        <td key={i} className="w-12 h-12 text-center font-bold bg-slate-100 border border-slate-300">
                          {num}
                        </td>
                      ))}
                    </tr>
                    {[0,1,2,3,4,5,6,7,8,9].map((row) => (
                      <tr key={row}>
                        {row === 0 && (
                          <td rowSpan={10} className="bg-slate-100 border border-slate-300 align-middle" style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>
                            <div className="flex items-center justify-center gap-2">
                              <span>←</span>
                              <span className="font-bold">{settings?.away_team_name || 'Away Team'}</span>
                              <TeamIcon icon={settings?.away_team_icon} name={settings?.away_team_name} />
                            </div>
                          </td>
                        )}
                        <td className="w-12 h-12 text-center font-bold bg-slate-100 border border-slate-300">
                          {(settings?.away_numbers || [0,1,2,3,4,5,6,7,8,9])[row]}
                        </td>
                        {[0,1,2,3,4,5,6,7,8,9].map((col) => {
                          const square = getSquareData(row, col);
                          const isSelected = selectedSquares.some(s => s.row === row && s.col === col);
                          const isMine = square?.player_id === currentUser?.id;
                          const isLocked = square?.is_locked;
                          const isOccupied = square?.player_id && square.player_id !== currentUser?.id;

                          return (
                            <td
                              key={col}
                              onClick={() => !isOccupied && !isLocked && handleSquareClick(row, col)}
                              className={`w-12 h-12 border border-slate-300 relative cursor-pointer transition-all ${
                                isOccupied ? 'bg-slate-200 cursor-not-allowed' :
                                isLocked && isMine ? 'bg-emerald-100 cursor-not-allowed' :
                                isSelected ? 'bg-blue-200' :
                                isMine ? 'bg-blue-50 hover:bg-blue-100' :
                                'bg-white hover:bg-slate-50'
                              }`}
                            >
                              {square?.player_icon && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 p-1">
                                  <PlayerAvatar icon={square.player_icon} name={square.player_name} className="w-6 h-6" />
                                  <span className="text-[8px] font-semibold text-center leading-tight">{square.player_name}</span>
                                </div>
                              )}
                              {isLocked && isMine && (
                                <Lock className="w-3 h-3 absolute top-0.5 right-0.5 text-emerald-600" />
                              )}
                              {isSelected && !isLocked && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSquare(row, col);
                                  }}
                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
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

export default function SuperBowlSquaresPage() {
  return (
    <AuthWrapper>
      <SuperBowlSquaresContent />
    </AuthWrapper>
  );
}