
import React, { useState, useEffect, useCallback } from "react";
import { Prize } from "@/entities/Prize";
import { User } from "@/entities/User";
import AuthWrapper from "../components/auth/AuthWrapper";
import AdminAuthWrapper from "../components/auth/AdminAuthWrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Trophy, AlertCircle, CheckCircle } from "lucide-react";

function PrizeManagementContent() {
  const [prizes, setPrizes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    place: '',
    amount: '',
    description: ''
  });

  const loadPrizes = useCallback(async () => {
    setIsLoading(true);
    try {
      const prizeData = await Prize.list('place', 100);
      setPrizes(prizeData);
    } catch (err) {
      setError("Failed to load prizes.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrizes();
  }, [loadPrizes]);

  const resetForm = () => {
    setFormData({ place: '', amount: '', description: '' });
    setEditingPrize(null);
    setShowForm(false);
  };

  const handleEdit = (prize) => {
    setFormData({
      place: prize.place || '',
      amount: prize.amount || '',
      description: prize.description || ''
    });
    setEditingPrize(prize);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        ...formData,
        place: parseInt(formData.place),
        amount: parseFloat(formData.amount)
      };

      if (editingPrize) {
        await Prize.update(editingPrize.id, payload);
        setSuccess("Prize updated successfully!");
      } else {
        await Prize.create(payload);
        setSuccess("Prize created successfully!");
      }
      
      resetForm();
      await loadPrizes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to save prize.");
      console.error(err);
    }
  };

  const handleDelete = async (prizeId) => {
    if (!confirm("Are you sure you want to delete this prize?")) return;
    try {
      await Prize.delete(prizeId);
      setSuccess("Prize deleted successfully!");
      await loadPrizes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete prize.");
      console.error(err);
    }
  };

  const getTrophyIcon = (place) => {
    if (place === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (place === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (place === 3) return <Trophy className="w-6 h-6 text-orange-500" />;
    return <Badge variant="outline">{place}</Badge>;
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Prize Management</h1>
          <Button onClick={() => setShowForm(true)} className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="w-5 h-5 mr-2" />
            Add Prize
          </Button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 flex items-center"><AlertCircle className="w-5 h-5 mr-2"/>{error}</div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2"/>{success}</div>}

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingPrize ? 'Edit Prize' : 'Add New Prize'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="place">Place</Label>
                    <Input id="place" type="number" value={formData.place} onChange={(e) => setFormData({...formData, place: e.target.value})} required />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="e.g., First Place, Second Place" required />
                </div>
                <div className="flex gap-4">
                  <Button type="submit" className="bg-emerald-500 hover:bg-emerald-600">
                    {editingPrize ? 'Update Prize' : 'Create Prize'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {prizes.map(prize => (
            <Card key={prize.id} className="bg-gradient-to-r from-emerald-50 to-green-50">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {getTrophyIcon(prize.place)}
                    <div>
                      <h3 className="text-xl font-bold">{prize.description}</h3>
                      <p className="text-2xl font-bold text-emerald-600">${prize.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(prize)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(prize.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {prizes.length === 0 && !showForm && (
          <Card className="text-center py-12">
            <CardContent>
              <Trophy className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No Prizes Set</h3>
              <p className="text-slate-500 mb-4">Add prizes to motivate your players!</p>
              <Button onClick={() => setShowForm(true)} className="bg-emerald-500 hover:bg-emerald-600">
                <Plus className="w-5 h-5 mr-2" />
                Add First Prize
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PrizeManagementPage() {
  return (
    <AuthWrapper>
      <AdminAuthWrapper requiredLevel={3}>
        <PrizeManagementContent />
      </AdminAuthWrapper>
    </AuthWrapper>
  );
}
