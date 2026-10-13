import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Pill, 
  Droplet, 
  Moon, 
  Activity, 
  AlertCircle,
  Clock,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { plannerAPI } from '../services/api';

export default function PlannerPage({ user }) {
  const [reminders, setReminders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('medication');
  const [dosage, setDosage] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('08:00 AM');
  const [frequency, setFrequency] = useState('Daily');

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await plannerAPI.getReminders(user.id);
      setReminders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchReminders();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await plannerAPI.addReminder(user.id, {
        title,
        category,
        dosage_or_target: dosage,
        time_of_day: timeOfDay,
        days_frequency: frequency
      });
      setShowAddModal(false);
      setTitle('');
      setDosage('');
      fetchReminders();
    } catch (err) {
      alert("Failed to create reminder");
    }
  };

  const toggleStatus = async (id, status) => {
    const nextStatus = status === 'completed' ? 'pending' : 'completed';
    try {
      await plannerAPI.updateStatus(id, nextStatus);
      setReminders(reminders.map(r => r.id === id ? { ...r, status: nextStatus } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSkip = async (id) => {
    try {
      await plannerAPI.updateStatus(id, 'skipped');
      setReminders(reminders.map(r => r.id === id ? { ...r, status: 'skipped' } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this reminder?")) {
      try {
        await plannerAPI.deleteReminder(id);
        fetchReminders();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'medication': return <Pill className="w-4 h-4 text-emerald-600" />;
      case 'water': return <Droplet className="w-4 h-4 text-sky-600" />;
      case 'sleep': return <Moon className="w-4 h-4 text-indigo-600" />;
      case 'exercise': return <Activity className="w-4 h-4 text-amber-600" />;
      default: return <Clock className="w-4 h-4 text-teal-600" />;
    }
  };

  const completedCount = reminders.filter(r => r.status === 'completed').length;
  const progressPercent = reminders.length > 0 ? Math.round((completedCount / reminders.length) * 100) : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Smart Health Planner</h1>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-semibold border border-teal-200">
              Feature 5
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track user-entered medication schedules, water, and exercise habits. Mark items completed or skipped.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Health Reminder</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs text-amber-800">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-[11px] leading-relaxed">
          <strong>Important Clinical Boundary:</strong> MediMate AI strictly organizes schedules entered by you or instructed by your doctor. It will never recommend new prescription drugs or modify prescribed medical dosages.
        </p>
      </div>

      {/* Daily Habit Adherence Progress Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Today's Schedule Progress</h2>
            <p className="text-xs text-slate-400">
              {completedCount} of {reminders.length} tasks completed
            </p>
          </div>
          <span className="text-xl font-bold text-teal-600">{progressPercent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className="bg-teal-600 h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Reminder Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Active Daily Routines ({reminders.length})</h2>
          <span className="text-xs text-slate-400">Click circle to mark completed</span>
        </div>

        {reminders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
            No routines configured yet. Click "New Health Reminder" to get started.
          </div>
        ) : (
          <div className="space-y-2.5">
            {reminders.map((r) => {
              const isDone = r.status === 'completed';
              const isSkipped = r.status === 'skipped';

              return (
                <div
                  key={r.id}
                  className={`bg-white rounded-2xl border p-4 transition-all flex items-center justify-between gap-4 ${
                    isDone 
                      ? 'border-emerald-200 bg-emerald-50/20' 
                      : isSkipped 
                      ? 'border-slate-200 bg-slate-50 opacity-60' 
                      : 'border-slate-200/80 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleStatus(r.id, r.status)}
                      className="text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300 hover:text-teal-500" />
                      )}
                    </button>

                    {/* Category Icon */}
                    <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {getCategoryIcon(r.category)}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {r.title}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {r.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {r.dosage_or_target} • Scheduled: <span className="font-semibold text-slate-700">{r.time_of_day}</span> ({r.days_frequency})
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isDone && !isSkipped && (
                      <button
                        onClick={() => handleSkip(r.id)}
                        className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg"
                      >
                        Skip
                      </button>
                    )}
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase ${
                      isDone 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : isSkipped 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-teal-50 text-teal-800'
                    }`}>
                      {r.status}
                    </span>
                    <button
                      onClick={() => handleDelete(r.id)}
                      title="Remove reminder"
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Add New Health Routine</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Reminder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Doctor-Prescribed Metformin, Post-Lunch Water, Evening Walk"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="medication">Prescribed Medication</option>
                    <option value="water">Water Intake</option>
                    <option value="sleep">Sleep Routine</option>
                    <option value="exercise">Exercise / Walk</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:30 AM or 20:00"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Dosage or Target (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 500mg after meal, 750ml bottle, 30 mins brisk walk"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
