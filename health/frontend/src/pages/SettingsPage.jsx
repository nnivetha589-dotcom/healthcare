import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Shield, 
  Languages, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { authAPI } from '../services/api';

export default function SettingsPage({ user, onUpdateUser, onLogout }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    preferred_language: user?.preferred_language || 'en',
    age: user?.age || '',
    gender: user?.gender || 'Female',
    blood_group: user?.blood_group || 'O+',
    allergies: user?.allergies || '',
    chronic_conditions: user?.chronic_conditions || ''
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(user.id, formData);
      onUpdateUser(res.data.user);
      setMessage("Profile settings successfully updated!");
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      alert("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt("Type 'DELETE' to confirm permanent erasure of your account, reports, chat history, and logs:");
    if (confirmation === 'DELETE') {
      try {
        await authAPI.deleteAccount(user.id);
        alert("Account and all associated health records permanently erased.");
        onLogout();
      } catch (err) {
        alert("Failed to delete account");
      }
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profile & Privacy Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, language preferences, and full data deletion rights.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <span>Personal Health Profile</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">User ID: #{user?.id}</span>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Preferred Language</label>
              <select
                value={formData.preferred_language}
                onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="en">English (Default)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Blood Group</label>
              <input
                type="text"
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Known Allergies</label>
              <input
                type="text"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="e.g. Penicillin, Peanuts"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Chronic Conditions</label>
              <input
                type="text"
                value={formData.chronic_conditions}
                onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                placeholder="e.g. Hypertension, Mild Asthma"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Privacy & Account Deletion Zone */}
      <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-sm font-bold">Privacy Controls & Account Erasure</h2>
        </div>
        <p className="text-xs text-rose-900 leading-relaxed">
          You retain full sovereignty over your medical data. Deleting your account will immediately purge all uploaded diagnostic reports, AI chat histories, health twin logs, reminders, and family sharing permissions from the SQLite database.
        </p>

        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
        >
          <Trash2 className="w-4 h-4" />
          <span>Permanently Delete Account & All Data</span>
        </button>
      </div>
    </div>
  );
}
