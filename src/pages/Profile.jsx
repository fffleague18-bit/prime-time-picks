
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/entities/User";
import { UploadFile } from "@/integrations/Core";
import AuthWrapper from "../components/auth/AuthWrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Upload } from "lucide-react";
import PlayerAvatar from "../components/shared/PlayerAvatar";

const EMOJI_OPTIONS = ['🏈', '🏀', '⚽', '⚾', '🎱', '🎯', '🎳', '🏒', '🥊', '🏆', '🥇', '😎', '🤑', '👑', '🔥', '🚀'];

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

function ProfileContent() {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({ display_name: '', profile_icon: '', sms_notifications: true, email_notifications: true, time_zone: 'America/Los_Angeles' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const user = await User.me();
        setCurrentUser(user);

        // Determine the initial time zone, ensuring it's one of the valid options
        const defaultTimeZone = 'America/Los_Angeles'; // Fallback to a valid default
        const validTimeZoneValues = timeZoneOptions.map(tz => tz.value);
        const initialTimeZone = validTimeZoneValues.includes(user.time_zone)
          ? user.time_zone
          : defaultTimeZone;

        setFormData({
          display_name: user.display_name || user.full_name || '',
          profile_icon: user.profile_icon || '🏈',
          sms_notifications: user.sms_notifications ?? true,
          email_notifications: user.email_notifications ?? true,
          time_zone: initialTimeZone,
        });
      } catch (err) {
        setError("Failed to load your profile.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await User.updateMyUserData(formData);
      setSuccess("Profile updated successfully!");
      // Optionally reload user data
      const user = await User.me();
      setCurrentUser(user);
    } catch (err) {
      setError("Failed to save profile. Please try again.");
      console.error(err);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleIconChange = (icon) => {
    setFormData(prev => ({ ...prev, profile_icon: icon }));
  };

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({...prev, profile_icon: file_url}));
      setSuccess("Icon uploaded! Click 'Save Changes' to apply.");
    } catch (err) {
      setError("Failed to upload image.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading your profile...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Your Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your display name, icon, and notification preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex items-center"><AlertCircle className="w-5 h-5 mr-2"/>{error}</div>}
            {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 flex items-center"><CheckCircle className="w-5 h-5 mr-2"/>{success}</div>}
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name</Label>
                <Input id="display_name" name="display_name" value={formData.display_name} onChange={handleInputChange} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_zone">Time Zone</Label>
                <Select value={formData.time_zone} onValueChange={(v) => handleSelectChange('time_zone', v)}>
                  <SelectTrigger id="time_zone">
                    <SelectValue placeholder="Select your time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeZoneOptions.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                 <Label>Profile Icon</Label>
                 <div className="flex items-center gap-4 mb-4">
                    <PlayerAvatar icon={formData.profile_icon} name={formData.display_name} className="w-20 h-20" textClassName="text-4xl" />
                    <Button type="button" variant="outline" onClick={handleFileSelect} disabled={isSaving}>
                        <Upload className="w-4 h-4 mr-2" /> 
                        {isSaving ? "Uploading..." : "Upload Image"}
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                 </div>
                 <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-slate-50">
                    {EMOJI_OPTIONS.map(emoji => (
                      <button 
                        key={emoji} 
                        type="button" 
                        onClick={() => handleIconChange(emoji)}
                        className={`text-2xl p-2 rounded-md transition-all ${formData.profile_icon === emoji ? 'bg-emerald-500 scale-110' : 'hover:bg-slate-200'}`}
                      >
                        {emoji}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms_notifications" className="font-medium">SMS Notifications</Label>
                  <Switch id="sms_notifications" checked={formData.sms_notifications} onCheckedChange={(c) => handleSwitchChange('sms_notifications', c)} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_notifications" className="font-medium">Email Notifications</Label>
                  <Switch id="email_notifications" checked={formData.email_notifications} onCheckedChange={(c) => handleSwitchChange('email_notifications', c)} />
                </div>
              </div>

              <Button type="submit" disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return <AuthWrapper><ProfileContent /></AuthWrapper>;
}
