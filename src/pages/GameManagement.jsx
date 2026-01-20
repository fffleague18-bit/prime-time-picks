import React, { useState, useEffect, useCallback, useRef } from "react";
import { Game } from "@/entities/Game";
import { base44 } from "@/api/base44Client";
import { UploadFile } from "@/integrations/Core";
import AuthWrapper from "../components/auth/AuthWrapper";
import AdminAuthWrapper from "../components/auth/AdminAuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Upload, AlertCircle, CheckCircle, Mail, BarChart2, Trophy, Archive } from "lucide-react";
import { format } from "date-fns";
import GameNotificationForm from "../components/admin/GameNotificationForm";
import ScoreUpdateForm from "../components/admin/ScoreUpdateForm";
import { calculateResults } from "@/functions/calculateResults";
import { recalculateAllResults } from "@/functions/recalculateAllResults";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Helper to parse date from DB and FORCE it to be treated as UTC by appending Z if missing
const parseGameDateAsUTC = (dateString) => {
  if (!dateString) return new Date();
  const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  return new Date(utcString);
};

// Helper to convert datetime-local input string to UTC ISO string
const convertPSTtoUTC = (localDateTimeString) => {
  // When user enters time in datetime-local input, JavaScript interprets it in browser's local timezone.
  // We assume the admin is entering the time they intend, and new Date() will create a Date object
  // representing that specific moment in the browser's local timezone.
  // Calling toISOString() on this Date object will then convert that local time
  // to its equivalent UTC representation for storage.
  const localDate = new Date(localDateTimeString);
  return localDate.toISOString();
};


function GameManagementContent() {
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isUploading, setIsUploading] = useState({ away: false, home: false });
  const awayIconRef = useRef(null);
  const homeIconRef = useRef(null);
  const [formData, setFormData] = useState({
    week: '',
    game_date_local: '', // This will be the local time from the form (e.g., PST)
    away_team: '',
    home_team: '',
    away_team_icon: '🏈',
    home_team_icon: '🏈',
    spread: '',
    over_under: '',
    game_type: '',
    status: 'upcoming',
    is_active: false,
    prize_pool: '',
    away_score: '',
    home_score: '',
    winning_tiebreaker_guess: ''
  });
  const [notificationGame, setNotificationGame] = useState(null);
  const [finalizingGame, setFinalizingGame] = useState(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [superBowlSquares, setSuperBowlSquares] = useState([]);

  const loadGames = useCallback(async () => {
    setIsLoading(true);
    try {
      const gameData = await Game.list('game_date', 2000);
      setGames(gameData);
      
      // Load Super Bowl squares
      const squaresData = await base44.entities.SuperBowlSquare.list();
      setSuperBowlSquares(squaresData);
    } catch (err) {
      setError("Failed to load games.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGames();
  }, [loadGames]);

  const resetForm = () => {
    setFormData({
      week: '',
      game_date_local: '',
      away_team: '',
      home_team: '',
      away_team_icon: '🏈',
      home_team_icon: '🏈',
      spread: '',
      over_under: '',
      game_type: '',
      status: 'upcoming',
      is_active: false,
      prize_pool: '',
      away_score: '',
      home_score: '',
      winning_tiebreaker_guess: ''
    });
    setEditingGame(null);
    setShowForm(false);
  };

  const handleEdit = (game) => {
    // Convert the UTC game_date from the DB to the admin's local time for display in the form.
    // `format` will implicitly use the browser's local timezone.
    const gameDateUTC = parseGameDateAsUTC(game.game_date);
    const localString = format(gameDateUTC, "yyyy-MM-dd'T'HH:mm");

    setFormData({
      week: game.week || '',
      game_date_local: localString,
      away_team: game.away_team || '',
      home_team: game.home_team || '',
      away_team_icon: game.away_team_icon || '🏈',
      home_team_icon: game.home_team_icon || '🏈',
      spread: game.spread ?? '', // Use nullish coalescing to handle 0 values correctly
      over_under: game.over_under ?? '', // Use nullish coalescing to handle 0 values correctly
      game_type: game.game_type || '',
      status: game.status || 'upcoming',
      is_active: game.is_active || false,
      prize_pool: game.prize_pool || '',
      away_score: game.away_score ?? '', // Use nullish coalescing to handle 0 values correctly
      home_score: game.home_score ?? '', // Use nullish coalescing to handle 0 values correctly
      winning_tiebreaker_guess: game.winning_tiebreaker_guess ?? ''
    });
    setEditingGame(game);
    setShowForm(true);
  };

  const handleRecalculateResults = async (game) => {
    if (!confirm(`Recalculate results for ${game.away_team} @ ${game.home_team}? This will recalculate all prediction points and update player standings.`)) {
      return;
    }

    setIsRecalculating(true);
    setError(null);
    setSuccess(null);

    try {
      const calcResponse = await calculateResults({ gameId: game.id });
      if (calcResponse.data.success) {
        setSuccess(`Results recalculated! ${calcResponse.data.message}`);
      } else {
        throw new Error(calcResponse.data.error || 'Recalculation failed.');
      }
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(`Failed to recalculate results: ${err.message}`);
      console.error(err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleRecalculateAllResults = async () => {
    if (!confirm('Recalculate ALL completed games? This will reset all player standings and recalculate everything from scratch. This action cannot be undone.')) {
      return;
    }

    setIsRecalculating(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await recalculateAllResults();
      if (data.success) {
        setSuccess(`All results recalculated! ${data.message}`);
      } else {
        throw new Error(data.error || 'Full recalculation failed.');
      }
      await loadGames(); // Refresh games list
      setTimeout(() => setSuccess(null), 8000);
    } catch (err) {
      setError(`Failed to recalculate all results: ${err.message}`);
      console.error(err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleIconUpload = async (e, team) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, [team]: true }));
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ 
        ...prev, 
        [`${team}_team_icon`]: file_url 
      }));
      setSuccess(`${team.charAt(0).toUpperCase() + team.slice(1)} team icon uploaded successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to upload ${team} team icon.`);
      console.error(err);
    } finally {
      setIsUploading(prev => ({ ...prev, [team]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      // Validate required fields
      if (formData.spread === '' || formData.spread === null) {
        setError("Spread is required. Please enter a valid spread value.");
        return;
      }
      
      if (formData.over_under === '' || formData.over_under === null) {
        setError("Over/Under is required. Please enter a valid over/under value.");
        return;
      }

      const spreadValue = parseFloat(formData.spread);
      const overUnderValue = parseFloat(formData.over_under);

      if (isNaN(spreadValue)) {
        setError("Spread must be a valid number.");
        return;
      }

      if (isNaN(overUnderValue)) {
        setError("Over/Under must be a valid number.");
        return;
      }

      // Convert local time from the form to UTC for storage
      const utcIsoString = convertPSTtoUTC(formData.game_date_local);
      
      console.log("Converting game time:");
      console.log("  Input (Local):", formData.game_date_local);
      console.log("  Output (UTC):", utcIsoString);
      
      const payload = {
        week: parseInt(formData.week),
        game_date: utcIsoString, // Use the converted UTC string
        away_team: formData.away_team,
        home_team: formData.home_team,
        away_team_icon: formData.away_team_icon,
        home_team_icon: formData.home_team_icon,
        spread: spreadValue, // Use validated numeric value
        over_under: overUnderValue, // Use validated numeric value
        game_type: formData.game_type,
        status: formData.status,
        is_active: formData.is_active,
      };

      if (formData.prize_pool !== '' && formData.prize_pool !== null && !isNaN(parseFloat(formData.prize_pool))) {
        payload.prize_pool = parseFloat(formData.prize_pool);
      }
      if (formData.away_score !== '' && formData.away_score !== null && !isNaN(parseInt(formData.away_score))) {
        payload.away_score = parseInt(formData.away_score);
      }
      if (formData.home_score !== '' && formData.home_score !== null && !isNaN(parseInt(formData.home_score))) {
        payload.home_score = parseInt(formData.home_score);
      }
      if (payload.away_score !== undefined && payload.home_score !== undefined) {
        payload.total_points = payload.away_score + payload.home_score;
      }
      if (formData.winning_tiebreaker_guess !== '' && formData.winning_tiebreaker_guess !== null && !isNaN(parseInt(formData.winning_tiebreaker_guess))) {
        payload.winning_tiebreaker_guess = parseInt(formData.winning_tiebreaker_guess);
      }
      
      if (editingGame) {
        await Game.update(editingGame.id, payload);
        setSuccess("Game updated successfully!");
      } else {
        await Game.create(payload);
        setSuccess("Game created successfully!");
      }
      
      resetForm();
      await loadGames();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to save game: ${err.message}`);
      console.error(err);
    }
  };

  const handleDelete = async (gameId, gameName) => {
    if (!confirm(`Are you sure you want to delete the game "${gameName}"? This action cannot be undone and will also delete all related predictions.`)) return;
    
    setError(null);
    setSuccess(null);
    try {
      await Game.delete(gameId);
      setSuccess("Game deleted successfully!");
      await loadGames();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to delete game: ${err.message}`);
      console.error(err);
    }
  };
  
  const handleFinalizeScore = async (scores) => {
    if (!finalizingGame) return;
    
    setIsSubmittingScore(true);
    setError(null);
    setSuccess(null);
    
    try {
        // 1. Update the game with the final score and set status to completed
        await Game.update(finalizingGame.id, {
            ...scores,
            status: 'completed',
            total_points: scores.away_score + scores.home_score
        });

        // 2. Trigger the backend function to calculate results for all predictions
        const calcResponse = await calculateResults({ gameId: finalizingGame.id });

        if (calcResponse.data.success) {
            setSuccess(`Game finalized! ${calcResponse.data.message}`);
        } else {
            throw new Error(calcResponse.data.error || 'Result calculation failed.');
        }

        setFinalizingGame(null);
        await loadGames(); // Refresh the list
        setTimeout(() => setSuccess(null), 5000);

    } catch (err) {
        setError(`Failed to finalize game: ${err.message}`);
        console.error(err);
    } finally {
        setIsSubmittingScore(false);
    }
  };

  const handleSpreadChange = (team, value) => {
    if (value === '') {
        setFormData({ ...formData, spread: '' });
        return;
    }

    // Allow negative sign to be typed
    if (value === '-') {
        setFormData({ ...formData, spread: '-' });
        return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
        return;
    }

    if (team === 'home') {
        setFormData({ ...formData, spread: numericValue });
    } else { // team === 'away'
        setFormData({ ...formData, spread: -numericValue });
    }
  };

  const TeamIcon = ({ icon, name, className = "w-8 h-8" }) => {
    if (icon && icon.startsWith('http')) {
      return <img src={icon} alt={name} className={`${className} rounded-full object-cover`} />;
    }
    return <span className="text-2xl">{icon || '🏈'}</span>;
  };


  if (isLoading) return <div className="p-8">Loading...</div>;

  // Handle display of spread when input is empty or just '-'
  const homeSpread = formData.spread === '' ? '' : formData.spread === '-' ? '-' : formData.spread;
  const awaySpread = formData.spread === '' ? '' : formData.spread === '-' ? '-' : -formData.spread;


  const activeGames = games.filter(game => game.status !== 'completed');
  const archivedGames = games.filter(game => game.status === 'completed').sort((a, b) => new Date(b.game_date) - new Date(a.game_date));

  const GameListItem = ({ game }) => {
    // Display game time in the admin's local timezone
    const gameDateUTC = parseGameDateAsUTC(game.game_date);
    const displayDate = format(gameDateUTC, 'EEE, MMM d, yyyy h:mm a');
    
    const isSuperBowl = game.game_type?.toLowerCase().includes('super bowl');
    const lockedSquares = superBowlSquares.filter(s => s.is_locked);
    
    // Group squares by player and calculate tiebreaker differences
    const playerSquares = {};
    lockedSquares.forEach(square => {
      if (!playerSquares[square.player_id]) {
        playerSquares[square.player_id] = {
          name: square.player_name,
          icon: square.player_icon,
          squares: [],
          tiebreaker_guess: square.tiebreaker_guess
        };
      }
      playerSquares[square.player_id].squares.push({ row: square.row, col: square.col });
    });
    
    return (
      <Card key={game.id}>
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-4">
              <div className="flex items-center gap-2">
                <TeamIcon icon={game.away_team_icon} name={game.away_team} />
                <span className="font-semibold">{game.away_team}</span>
              </div>
              <span className="text-slate-500">@</span>
              <div className="flex items-center gap-2">
                <TeamIcon icon={game.home_team_icon} name={game.home_team} />
                <span className="font-semibold">{game.home_team}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {game.status === 'completed' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRecalculateResults(game)}
                  disabled={isRecalculating}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Recalc Points</span>
                </Button>
              )}
              {game.status !== 'completed' && ( // Only show Score & Finalize for non-completed games
                <Button variant="outline" size="sm" onClick={() => setFinalizingGame(game)}>
                    <Trophy className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Score & Finalize</span>
                </Button>
              )}
              <Link to={createPageUrl(`GamePredictions?gameId=${game.id}`)}>
                  <Button variant="outline" size="sm">
                      <BarChart2 className="w-4 h-4" />
                      <span className="hidden sm:inline ml-2">Picks</span>
                  </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setNotificationGame(game)}>
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Notify</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleEdit(game)}>
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Edit</span>
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDelete(game.id, `${game.away_team} @ ${game.home_team}`)}
              >
                <Trash2 className="w-4 h-4" />
                 <span className="hidden sm:inline ml-2">Delete</span>
              </Button>
            </div>
          </div>
          
          <div className="mb-3">
            <p className="text-slate-600">Week {game.week} • {displayDate} (Your Local Time)</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={game.status === 'upcoming' ? 'default' : game.status === 'completed' ? 'secondary' : 'destructive'}>
                {game.status}
              </Badge>
              <Badge variant="outline">{game.game_type}</Badge>
              {game.is_active && <Badge className="bg-green-100 text-green-800">Active</Badge>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-slate-50 p-3 rounded-lg">
            <div>
              <span className="font-semibold">Spread:</span><br />
              {game.spread > 0 ? `${game.away_team} +${game.spread}` : game.spread < 0 ? `${game.home_team} ${game.spread}` : 'Pick\'em'}
            </div>
            <div>
              <span className="font-semibold">Over/Under:</span><br />
              {game.over_under}
            </div>
            {game.prize_pool && (
              <div>
                <span className="font-semibold">Prize:</span><br />
                ${game.prize_pool.toLocaleString()}
              </div>
            )}
            {game.status === 'completed' && (
              <div>
                <span className="font-semibold">Final Score:</span><br />
                {game.away_score}-{game.home_score}
              </div>
            )}
          </div>

          {isSuperBowl && Object.keys(playerSquares).length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-3">Player Picks & Tiebreaker Guesses</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.values(playerSquares).sort((a, b) => {
                  if (!game.total_points) return 0;
                  const diffA = Math.abs((a.tiebreaker_guess || 0) - game.total_points);
                  const diffB = Math.abs((b.tiebreaker_guess || 0) - game.total_points);
                  return diffA - diffB;
                }).map((player, idx) => {
                  const diff = game.total_points ? Math.abs((player.tiebreaker_guess || 0) - game.total_points) : null;
                  const isWinner = game.winning_tiebreaker_guess && player.tiebreaker_guess === game.winning_tiebreaker_guess;
                  
                  return (
                    <div key={idx} className={`flex items-center justify-between p-2 rounded ${isWinner ? 'bg-yellow-50 border border-yellow-300' : 'bg-white'}`}>
                      <div className="flex items-center gap-2">
                        {player.icon && <img src={player.icon} alt={player.name} className="w-6 h-6 rounded-full" />}
                        <span className="font-medium">{player.name}</span>
                        <span className="text-slate-500 text-sm">({player.squares.length} {player.squares.length === 1 ? 'square' : 'squares'})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          Guess: <span className="font-semibold">{player.tiebreaker_guess || 'N/A'}</span>
                        </span>
                        {diff !== null && (
                          <span className="text-xs text-slate-500">
                            (off by {diff})
                          </span>
                        )}
                        {isWinner && (
                          <Badge className="bg-yellow-500 text-white">Winner</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Game Management</h1>
          <div className="flex gap-3">
            <Button 
              onClick={handleRecalculateAllResults} 
              disabled={isRecalculating}
              variant="outline" 
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            >
              <BarChart2 className="w-5 h-5 mr-2" />
              {isRecalculating ? "Recalculating..." : "Recalc All Results"}
            </Button>
            <Button onClick={() => setShowForm(true)} className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="w-5 h-5 mr-2" />
              Add New Game
            </Button>
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 flex items-center"><AlertCircle className="w-5 h-5 mr-2"/>{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2"/>{success}</div>}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingGame ? 'Edit Game' : 'Add New Game'}</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                ⏰ <strong>Important:</strong> Enter game time in <strong>your local timezone</strong>. 
                Players in other timezones will see the game time automatically converted to their local time.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="week">Week</Label>
                    <Input id="week" type="number" value={formData.week} onChange={(e) => setFormData({...formData, week: e.target.value})} required />
                  </div>
                  <div>
                    <Label htmlFor="game_date_local">Game Date & Time (Your Local Time)</Label>
                    <Input 
                      id="game_date_local" 
                      type="datetime-local" 
                      value={formData.game_date_local} 
                      onChange={(e) => setFormData({...formData, game_date_local: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Away Team</h3>
                    <div>
                      <Label htmlFor="away_team">Team Name</Label>
                      <Input id="away_team" value={formData.away_team} onChange={(e) => setFormData({...formData, away_team: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Team Icon</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <TeamIcon icon={formData.away_team_icon} name={formData.away_team} />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => awayIconRef.current?.click()}
                          disabled={isUploading.away}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploading.away ? "Uploading..." : "Upload Icon"}
                        </Button>
                        <input 
                          type="file" 
                          ref={awayIconRef} 
                          onChange={(e) => handleIconUpload(e, 'away')} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="away_spread">Spread</Label>
                      <Input 
                        id="away_spread"
                        type="number"
                        step="0.5"
                        value={awaySpread}
                        onChange={(e) => handleSpreadChange('away', e.target.value)}
                        placeholder="e.g. +8.5"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">Home Team</h3>
                    <div>
                      <Label htmlFor="home_team">Team Name</Label>
                      <Input id="home_team" value={formData.home_team} onChange={(e) => setFormData({...formData, home_team: e.target.value})} required />
                    </div>
                    <div>
                      <Label>Team Icon</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <TeamIcon icon={formData.home_team_icon} name={formData.home_team} />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => homeIconRef.current?.click()}
                          disabled={isUploading.home}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploading.home ? "Uploading..." : "Upload Icon"}
                        </Button>
                        <input 
                          type="file" 
                          ref={homeIconRef} 
                          onChange={(e) => handleIconUpload(e, 'home')} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                    </div>
                     <div>
                      <Label htmlFor="home_spread">Spread</Label>
                      <Input 
                        id="home_spread"
                        type="number"
                        step="0.5"
                        value={homeSpread}
                        onChange={(e) => handleSpreadChange('home', e.target.value)}
                        placeholder="e.g. -8.5"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="over_under">Over/Under</Label>
                    <Input 
                      id="over_under" 
                      type="number" 
                      step="0.5" 
                      value={formData.over_under} 
                      onChange={(e) => setFormData({...formData, over_under: e.target.value})} 
                      required 
                      placeholder="e.g. 47.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="game_type">Game Type</Label>
                    <Input id="game_type" value={formData.game_type} onChange={(e) => setFormData({...formData, game_type: e.target.value})} placeholder="e.g., Monday Night Football" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prize_pool">Prize Pool ($)</Label>
                    <Input id="prize_pool" type="number" step="0.01" value={formData.prize_pool} onChange={(e) => setFormData({...formData, prize_pool: e.target.value})} />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} />
                    <Label>Active for Predictions</Label>
                  </div>
                </div>

                {formData.status === 'completed' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="away_score">Away Team Score</Label>
                      <Input id="away_score" type="number" value={formData.away_score} onChange={(e) => setFormData({...formData, away_score: e.target.value})} />
                    </div>
                    <div>
                      <Label htmlFor="home_score">Home Team Score</Label>
                      <Input id="home_score" type="number" value={formData.home_score} onChange={(e) => setFormData({...formData, home_score: e.target.value})} />
                    </div>
                  </div>
                )}

                {formData.game_type?.toLowerCase().includes('super bowl') && (
                  <div>
                    <Label htmlFor="winning_tiebreaker_guess">Winning Tiebreaker Guess (Closest Total Score)</Label>
                    <Input 
                      id="winning_tiebreaker_guess" 
                      type="number" 
                      value={formData.winning_tiebreaker_guess} 
                      onChange={(e) => setFormData({...formData, winning_tiebreaker_guess: e.target.value})} 
                      placeholder="Enter the winning tiebreaker guess"
                    />
                    <p className="text-xs text-slate-500 mt-1">The closest guess to the actual total score wins the tiebreaker</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                    {editingGame ? 'Update Game' : 'Create Game'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {notificationGame && (
          <GameNotificationForm 
            game={notificationGame}
            onClose={() => setNotificationGame(null)}
          />
        )}

        {finalizingGame && (
          <ScoreUpdateForm 
            game={finalizingGame}
            onClose={() => setFinalizingGame(null)}
            onSubmit={handleFinalizeScore}
            isSubmitting={isSubmittingScore}
          />
        )}

        <Tabs defaultValue="active" className="mt-8">
          <TabsList>
            <TabsTrigger value="active">Active & Upcoming Games</TabsTrigger>
            <TabsTrigger value="archive">
              <Archive className="w-4 h-4 mr-2" />
              Archived
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            <div className="space-y-4">
              {activeGames.length > 0 ? (
                activeGames.map(game => <GameListItem key={game.id} game={game} />)
              ) : (
                <p className="text-center text-slate-500 py-8">No active or upcoming games.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="archive" className="mt-4">
            <div className="space-y-4">
              {archivedGames.length > 0 ? (
                archivedGames.map(game => <GameListItem key={game.id} game={game} />)
              ) : (
                <p className="text-center text-slate-500 py-8">No archived games.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function GameManagementPage() {
  return (
    <AuthWrapper>
      <AdminAuthWrapper requiredLevel={2}>
        <GameManagementContent />
      </AdminAuthWrapper>
    </AuthWrapper>
  );
}