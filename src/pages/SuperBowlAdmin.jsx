import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import AuthWrapper from "../components/auth/AuthWrapper";
import AdminAuthWrapper from "../components/auth/AdminAuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Shuffle, Save, Trash2, Play } from "lucide-react";
import PlayerAvatar from "../components/shared/PlayerAvatar";

function SuperBowlAdminContent() {
  const [settings, setSettings] = useState(null);
  const [squares, setSquares] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [homeTeamName, setHomeTeamName] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  const [homeTeamIcon, setHomeTeamIcon] = useState('🏈');
  const [awayTeamIcon, setAwayTeamIcon] = useState('🏈');
  const [isUploading, setIsUploading] = useState({ home: false, away: false });
  const homeIconRef = useRef(null);
  const awayIconRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, squaresData, payoutsData] = await Promise.all([
        base44.entities.SuperBowlSettings.list(),
        base44.entities.SuperBowlSquare.list(),
        base44.entities.SuperBowlPayout.list()
      ]);

      const s = settingsData[0];
      setSettings(s || null);
      if (s) {
        setHomeTeamName(s.home_team_name || '');
        setAwayTeamName(s.away_team_name || '');
        setHomeTeamIcon(s.home_team_icon || '🏈');
        setAwayTeamIcon(s.away_team_icon || '🏈');
      }

      setSquares(squaresData);
      setPayouts(payoutsData.length > 0 ? payoutsData : [
        { quarter: 'Final Score', amount: 125, description: 'Final Score' },
        { quarter: '3rd Quarter', amount: 125, description: '3rd Quarter' },
        { quarter: 'Halftime', amount: 125, description: 'Halftime' },
        { quarter: '1st Quarter', amount: 125, description: '1st Quarter' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconUpload = async (e, team) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, [team]: true }));
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (team === 'home') {
        setHomeTeamIcon(file_url);
      } else {
        setAwayTeamIcon(file_url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(prev => ({ ...prev, [team]: false }));
    }
  };

  const shuffleNumbers = () => {
    const shuffle = (array) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    return {
      home_numbers: shuffle([0,1,2,3,4,5,6,7,8,9]),
      away_numbers: shuffle([0,1,2,3,4,5,6,7,8,9])
    };
  };

  const handleSaveSettings = async () => {
    try {
      const numbers = settings?.home_numbers ? {} : shuffleNumbers();
      const data = {
        home_team_name: homeTeamName,
        away_team_name: awayTeamName,
        home_team_icon: homeTeamIcon,
        away_team_icon: awayTeamIcon,
        home_numbers: settings?.home_numbers || numbers.home_numbers,
        away_numbers: settings?.away_numbers || numbers.away_numbers
      };

      if (settings) {
        await base44.entities.SuperBowlSettings.update(settings.id, data);
      } else {
        await base44.entities.SuperBowlSettings.create(data);
      }
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShuffleNumbers = async () => {
    if (!settings) return;
    const numbers = shuffleNumbers();
    try {
      await base44.entities.SuperBowlSettings.update(settings.id, numbers);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePayouts = async () => {
    try {
      for (const payout of payouts) {
        if (payout.id) {
          await base44.entities.SuperBowlPayout.update(payout.id, {
            quarter: payout.quarter,
            amount: parseFloat(payout.amount),
            winner_name: payout.winner_name || null,
            description: payout.description
          });
        } else {
          await base44.entities.SuperBowlPayout.create({
            quarter: payout.quarter,
            amount: parseFloat(payout.amount),
            winner_name: payout.winner_name || null,
            description: payout.description
          });
        }
      }
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const updatePayout = (index, field, value) => {
    setPayouts(payouts.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleDeleteSquare = async (squareId) => {
    if (!confirm('Delete this square?')) return;
    try {
      await base44.entities.SuperBowlSquare.delete(squareId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate money log
  const moneyLog = {};
  squares.filter(s => s.is_locked).forEach(s => {
    if (!moneyLog[s.player_id]) {
      moneyLog[s.player_id] = {
        name: s.player_name,
        icon: s.player_icon,
        count: 0,
        total: 0
      };
    }
    moneyLog[s.player_id].count++;
    moneyLog[s.player_id].total += 5;
  });

  const TeamIcon = ({ icon, name }) => {
    if (icon && icon.startsWith('http')) {
      return <img src={icon} alt={name} className="w-12 h-12 rounded-full object-cover" />;
    }
    return <span className="text-3xl">{icon || '🏈'}</span>;
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Super Bowl Admin</h1>

        <Card>
          <CardHeader>
            <CardTitle>Team Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Away Team</Label>
                <Input value={awayTeamName} onChange={(e) => setAwayTeamName(e.target.value)} placeholder="Team Name" />
                <div className="flex items-center gap-4">
                  <TeamIcon icon={awayTeamIcon} name={awayTeamName} />
                  <Button variant="outline" onClick={() => awayIconRef.current?.click()} disabled={isUploading.away}>
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading.away ? "Uploading..." : "Upload Icon"}
                  </Button>
                  <input type="file" ref={awayIconRef} onChange={(e) => handleIconUpload(e, 'away')} accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Home Team</Label>
                <Input value={homeTeamName} onChange={(e) => setHomeTeamName(e.target.value)} placeholder="Team Name" />
                <div className="flex items-center gap-4">
                  <TeamIcon icon={homeTeamIcon} name={homeTeamName} />
                  <Button variant="outline" onClick={() => homeIconRef.current?.click()} disabled={isUploading.home}>
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading.home ? "Uploading..." : "Upload Icon"}
                  </Button>
                  <input type="file" ref={homeIconRef} onChange={(e) => handleIconUpload(e, 'home')} accept="image/*" className="hidden" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Button onClick={handleSaveSettings} className="bg-emerald-500 hover:bg-emerald-600">
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
              {settings && (
                <>
                  <Button onClick={handleShuffleNumbers} variant="outline">
                    <Shuffle className="w-4 h-4 mr-2" />
                    Shuffle Numbers
                  </Button>
                  <Button 
                    onClick={async () => {
                      await base44.entities.SuperBowlSettings.update(settings.id, { game_started: !settings.game_started });
                      await loadData();
                    }}
                    variant={settings.game_started ? "destructive" : "default"}
                  >
                    {settings.game_started ? "Hide Numbers" : "Start Game (Show Numbers)"}
                  </Button>
                  <Button 
                    onClick={async () => {
                      if (!confirm('This will delete ALL squares. Continue?')) return;
                      for (const sq of squares) {
                        await base44.entities.SuperBowlSquare.delete(sq.id);
                      }
                      await loadData();
                    }}
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset All Squares
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payouts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {payouts.map((p, index) => (
              <div key={index} className="grid grid-cols-3 gap-4">
                <Input value={p.quarter} onChange={(e) => updatePayout(index, 'quarter', e.target.value)} placeholder="Quarter" />
                <Input type="number" value={p.amount} onChange={(e) => updatePayout(index, 'amount', e.target.value)} placeholder="Amount" />
                <Input value={p.winner_name || ''} onChange={(e) => updatePayout(index, 'winner_name', e.target.value)} placeholder="Winner Name" />
              </div>
            ))}
            <Button onClick={handleSavePayouts} className="bg-emerald-500 hover:bg-emerald-600">
              <Save className="w-4 h-4 mr-2" />
              Save Payouts
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Money Owed Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Squares</TableHead>
                  <TableHead className="text-right">Total Owed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(moneyLog).map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell className="flex items-center gap-2">
                      <PlayerAvatar icon={entry.icon} name={entry.name} className="w-8 h-8" />
                      {entry.name}
                    </TableCell>
                    <TableCell>{entry.count}</TableCell>
                    <TableCell className="text-right font-bold">${entry.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Squares</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {squares.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>Row {s.row}, Col {s.col}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      {s.player_icon && <PlayerAvatar icon={s.player_icon} name={s.player_name} className="w-6 h-6" />}
                      {s.player_name || 'Empty'}
                    </TableCell>
                    <TableCell>{s.is_locked ? 'Locked' : 'Unlocked'}</TableCell>
                    <TableCell>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteSquare(s.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SuperBowlAdminPage() {
  return (
    <AuthWrapper>
      <AdminAuthWrapper requiredLevel={2}>
        <SuperBowlAdminContent />
      </AdminAuthWrapper>
    </AuthWrapper>
  );
}