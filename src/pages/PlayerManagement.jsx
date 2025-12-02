
import React, { useState, useEffect, useCallback } from "react";
import { User } from "@/entities/User";
import AuthWrapper from "../components/auth/AuthWrapper";
import AdminAuthWrapper from "../components/auth/AdminAuthWrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users, AlertCircle, CheckCircle, DollarSign, Award, UserPlus } from "lucide-react";
import PlayerAvatar from "../components/shared/PlayerAvatar";
import { addPlayer } from "@/functions/addPlayer";


const timeZoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)'},
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)'}
];

function PlayerManagementContent() {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserSuperAdminLevel, setCurrentUserSuperAdminLevel] = useState(0);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlayerData, setNewPlayerData] = useState({ email: '', display_name: '' });
  const [isAdding, setIsAdding] = useState(false);

  const [editFormData, setEditFormData] = useState({
    display_name: '',
    email: '', 
    role: 'user', 
    money_deposited: '',
    money_owed: '',
    total_score: '',
    time_zone: 'America/Los_Angeles',
    record: '',
    games_played: ''
  });

  const loadPlayers = useCallback(async () => {
    setIsLoading(true);
    try {
      const [user, userData] = await Promise.all([
        User.me(),
        User.list(undefined, 2000)
      ]);
      setCurrentUser(user);
      setCurrentUserSuperAdminLevel(user.super_admin_level || 0);
      setPlayers(userData);
    } catch (err) {
      setError("Failed to load players.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  const handleEdit = (player) => {
    // Determine role for form display based on super_admin_level
    let role = 'user';
    if (player.super_admin_level >= 3) {
      role = 'super_admin';
    } else if (player.super_admin_level >= 2) {
      role = 'admin_2';
    } else if (player.super_admin_level >= 1) {
      role = 'admin';
    }

    setEditFormData({
      display_name: player.display_name || '',
      email: player.email || '',
      role: role,
      money_deposited: player.money_deposited || '',
      money_owed: player.money_owed || '',
      total_score: player.total_score || '',
      time_zone: player.time_zone || 'America/Los_Angeles',
      record: player.record || '',
      games_played: player.games_played || ''
    });
    setEditingPlayer(player);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingPlayer) return;
    
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        display_name: editFormData.display_name,
        money_deposited: editFormData.money_deposited ? parseFloat(editFormData.money_deposited) : 0,
        money_owed: editFormData.money_owed ? parseFloat(editFormData.money_owed) : 0,
        total_score: editFormData.total_score ? parseFloat(editFormData.total_score) : 0,
        time_zone: editFormData.time_zone,
        record: editFormData.record || null, 
        games_played: editFormData.games_played ? parseInt(editFormData.games_played) : null,
      };

      // CRITICAL: Only Boss Lady (fffleague18@gmail.com) can be Super Admin.
      const isBossLady = editingPlayer.email?.toLowerCase() === 'fffleague18@gmail.com';

      // Role and super_admin_level changes are only possible by a super admin (level 3), and not on themselves
      if (editingPlayer.id !== currentUser.id && currentUserSuperAdminLevel >= 3) {
        // Prevent another user from being made Super Admin
        if (editFormData.role === 'super_admin' && !isBossLady) {
            setError("Only Boss Lady (fffleague18@gmail.com) can be Super Admin.");
            return;
        }
        
        payload.email = editFormData.email; 
        
        if (editFormData.role === 'super_admin') {
          payload.role = 'admin'; 
          payload.super_admin_level = 3;
        } else if (editFormData.role === 'admin_2') {
          payload.role = 'admin';
          payload.super_admin_level = 2;
        } else if (editFormData.role === 'admin') {
          payload.role = 'admin';
          payload.super_admin_level = 1;
        } else {
          payload.role = 'user';
          payload.super_admin_level = 0;
        }
      } 
      
      // Always enforce Boss Lady's status, regardless of who is editing
      if (isBossLady) {
        payload.role = 'admin';
        payload.super_admin_level = 3;
      }

      await User.update(editingPlayer.id, payload);
      setSuccess(isBossLady ? "Boss Lady's profile updated (Super Admin status protected)!" : "Player updated successfully!");
      setEditingPlayer(null);
      await loadPlayers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to update player.");
      console.error(err);
    }
  };

  const handleDelete = async (playerId) => {
    if (!confirm("Are you sure you want to delete this player? This action cannot be undone.")) return;
    try {
      await User.delete(playerId);
      setSuccess("Player deleted successfully!");
      await loadPlayers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete player.");
      console.error(err);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    setError(null);
    setSuccess(null);
    try {
        const { data } = await addPlayer(newPlayerData);
        if (data.error) {
            throw new Error(data.error);
        }
        setSuccess(`Player ${data.player.display_name} added! They can now log in with Google using that email.`);
        setShowAddForm(false);
        setNewPlayerData({ email: '', display_name: '' });
        await loadPlayers();
        setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
        setError(err.message || "Failed to add player.");
    } finally {
        setIsAdding(false);
    }
  };

  const getTimeZoneLabel = (value) => {
    const option = timeZoneOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Player Management</h1>
          <div className="flex items-center gap-4">
            {currentUserSuperAdminLevel > 0 && (
                <Button onClick={() => setShowAddForm(true)} className="bg-emerald-500 hover:bg-emerald-600">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Add New Player
                </Button>
            )}
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Users className="w-5 h-5 mr-2" />
              {players.length} Total Players
            </Badge>
          </div>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 flex items-center"><AlertCircle className="w-5 h-5 mr-2"/>{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2"/>{success}</div>}

        {showAddForm && currentUserSuperAdminLevel > 0 && (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Add New Player</CardTitle>
                    <CardDescription>
                        Create a new player record. The player will be able to log in using Google with the specified email address.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddPlayer} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="new_display_name">Display Name</Label>
                                <Input id="new_display_name" value={newPlayerData.display_name} onChange={(e) => setNewPlayerData({...newPlayerData, display_name: e.target.value})} required />
                            </div>
                            <div>
                                <Label htmlFor="new_email">Email Address</Label>
                                <Input id="new_email" type="email" value={newPlayerData.email} onChange={(e) => setNewPlayerData({...newPlayerData, email: e.target.value})} required />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Button type="submit" disabled={isAdding}>
                                {isAdding ? "Adding..." : "Add Player"}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        )}

        {editingPlayer && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit Player: {editingPlayer.full_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input id="display_name" value={editFormData.display_name} onChange={(e) => setEditFormData({...editFormData, display_name: e.target.value})} />
                  </div>
                   <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={editFormData.email} 
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} 
                      disabled={editingPlayer.id === currentUser.id || currentUserSuperAdminLevel < 3}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={editFormData.role} 
                      onValueChange={(value) => setEditFormData({...editFormData, role: value})}
                      disabled={
                        editingPlayer.email?.toLowerCase() === 'fffleague18@gmail.com' || // Permanently disable for Boss Lady
                        editingPlayer.id === currentUser.id || 
                        currentUserSuperAdminLevel < 3
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Only show Super Admin option if the user being edited IS Boss Lady AND current user is Super Admin */}
                        {(currentUserSuperAdminLevel >= 3 && editingPlayer.email?.toLowerCase() === 'fffleague18@gmail.com') && (
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        )}
                        <SelectItem value="admin_2">Admin 2</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                    {editingPlayer.email?.toLowerCase() === 'fffleague18@gmail.com' && (
                      <p className="text-xs text-emerald-600 mt-1">
                        🔒 Boss Lady's Super Admin status is permanently protected.
                      </p>
                    )}
                  </div>
                  <div>
                      <Label htmlFor="time_zone">Time Zone</Label>
                      <Select 
                          value={editFormData.time_zone} 
                          onValueChange={(value) => setEditFormData({...editFormData, time_zone: value})}
                      >
                          <SelectTrigger>
                              <SelectValue placeholder="Select a time zone"/>
                          </SelectTrigger>
                          <SelectContent>
                              {timeZoneOptions.map(tz => (
                                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="money_deposited">Money Deposited ($)</Label>
                    <Input id="money_deposited" type="number" step="0.01" value={editFormData.money_deposited} onChange={(e) => setEditFormData({...editFormData, money_deposited: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="money_owed">Money Owed ($)</Label>
                    <Input id="money_owed" type="number" step="0.01" value={editFormData.money_owed} onChange={(e) => setEditFormData({...editFormData, money_owed: e.target.value})} />
                  </div>
                  <div>
                    <Label htmlFor="total_score">Total Score (Override)</Label>
                    <Input id="total_score" type="number" step="0.5" value={editFormData.total_score} onChange={(e) => setEditFormData({...editFormData, total_score: e.target.value})} placeholder="e.g., 25.5" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="record">Record (W-L-P Override)</Label>
                        <Input id="record" value={editFormData.record} onChange={(e) => setEditFormData({...editFormData, record: e.target.value})} placeholder="e.g., 10-5-1" />
                    </div>
                    <div>
                        <Label htmlFor="games_played">Games Played (Override)</Label>
                        <Input id="games_played" type="number" value={editFormData.games_played} onChange={(e) => setEditFormData({...editFormData, games_played: e.target.value})} placeholder="e.g., 16" />
                    </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                    Update Player
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingPlayer(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {players.map(player => (
            <Card key={player.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <PlayerAvatar icon={player.profile_icon} name={player.display_name || player.full_name} />
                    <div>
                      <h3 className="text-lg font-bold">{player.display_name || player.full_name}</h3>
                      <p className="text-slate-600">{player.email}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge 
                          variant={
                            player.super_admin_level >= 3
                              ? 'destructive'
                              : player.super_admin_level >= 2
                                ? 'default'  
                                : player.role === 'admin' 
                                  ? 'secondary'
                                  : 'outline'
                          }
                        >
                          {player.super_admin_level >= 3 ? 'Super Admin' : 
                           player.super_admin_level >= 2 ? 'Admin 2' : 
                           player.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                        {player.phone_number && <Badge variant="outline">{player.phone_number}</Badge>}
                        {player.time_zone && <Badge variant="outline">{getTimeZoneLabel(player.time_zone)}</Badge>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">Score: {player.total_score ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Deposited: ${(player.money_deposited || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-red-500" />
                        <span className="text-sm">Owed: ${(player.money_owed || 0).toFixed(2)}</span>
                      </div>
                       {player.record && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">Record: {player.record} ({player.games_played || 0} games)</span>
                          </div>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(player)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {currentUser && player.id !== currentUser.id && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(player.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PlayerManagementPage() {
  return (
    <AuthWrapper>
      <AdminAuthWrapper requiredLevel={2}>
        <PlayerManagementContent />
      </AdminAuthWrapper>
    </AuthWrapper>
  );
}
