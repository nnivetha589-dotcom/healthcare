import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Plus, 
  Trash2, 
  Edit3, 
  Activity, 
  Droplet, 
  Moon, 
  Heart, 
  Smile, 
  AlertCircle,
  TrendingUp,
  Sparkles,
  Calendar
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { healthTwinAPI } from '../services/api';

export default function HealthTwinPage({ user }) {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState(1);
  const [sleepHours, setSleepHours] = useState(7.0);
  const [waterLiters, setWaterLiters] = useState(2.0);
  const [exerciseMins, setExerciseMins] = useState(30);
  const [wellnessNotes, setWellnessNotes] = useState('');
  const [mood, setMood] = useState('good');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await healthTwinAPI.getLogs(user.id);
      setLogs(res.data?.logs || []);
      setSummary(res.data?.summary || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchLogs();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await healthTwinAPI.addLog(user.id, {
        log_date: logDate,
        symptoms,
        severity: Number(severity),
        sleep_hours: parseFloat(sleepHours),
        water_liters: parseFloat(waterLiters),
        exercise_mins: parseInt(exerciseMins, 10),
        wellness_notes: wellnessNotes,
        mood
      });
      setShowAddModal(false);
      // Reset form
      setSymptoms('');
      setWellnessNotes('');
      fetchLogs();
    } catch (err) {
      alert("Failed to record entry");
    }
  };

  const handleDelete = async (logId) => {
    if (window.confirm("Delete this health log entry?")) {
      try {
        await healthTwinAPI.deleteLog(logId);
        fetchLogs();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const chartData = logs.map(l => ({
    date: l.log_date?.slice(5),
    sleep: l.sleep_hours,
    water: l.water_liters,
    exercise: l.exercise_mins
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Personal AI Health Twin</h1>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-semibold border border-teal-200">
              Feature 3
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track symptoms, rest, and habits. Observe personal lifestyle patterns without clinical assumptions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Daily Health Log</span>
        </button>
      </div>

      {/* Observed Patterns Banner */}
      {summary?.patterns && summary.patterns.length > 0 && (
        <div className="bg-gradient-to-r from-teal-50/80 to-blue-50/80 p-5 rounded-2xl border border-teal-100 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-800">Identified Behavioral & Symptom Observations</h2>
              <span className="text-[10px] bg-white text-teal-800 px-2 py-0.5 rounded-full border border-teal-200 font-semibold">
                Pattern Recognition
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {summary.patterns.map((pat, idx) => (
                <div key={idx} className="text-xs text-slate-700 bg-white/70 p-2.5 rounded-xl border border-teal-50 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                  <span>{pat}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 italic pt-2">
              ⚠️ {summary.disclaimer}
            </p>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Wellness & Habit Timeline</h2>
            <p className="text-xs text-slate-400">Sleep hours vs. Water intake (Liters)</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-500" />
              <span className="text-slate-600">Sleep (hrs)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-500" />
              <span className="text-slate-600">Water (L)</span>
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            No logged data points yet. Click "Record Daily Health Log" above.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 10]} />
                <Tooltip />
                <Line type="monotone" dataKey="sleep" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="water" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Log Entries History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800">Historical Health Twin Log Entries ({logs.length})</h2>
          <span className="text-xs text-slate-400">Editable & deletable records</span>
        </div>

        {logs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No logs recorded yet.</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reported Symptoms</th>
                  <th className="py-3 px-4">Sleep</th>
                  <th className="py-3 px-4">Water</th>
                  <th className="py-3 px-4">Exercise</th>
                  <th className="py-3 px-4">Mood</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{log.log_date}</td>
                    <td className="py-3 px-4">
                      {log.symptoms ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {log.symptoms}
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{log.sleep_hours} hrs</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{log.water_liters} L</td>
                    <td className="py-3 px-4 text-slate-600">{log.exercise_mins} mins</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{log.mood}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{log.wellness_notes || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(log.id)}
                        title="Delete log"
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Add Daily Health Record</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Symptoms (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Mild Fatigue, Headache"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Sleep (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Water Intake (Liters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={waterLiters}
                    onChange={(e) => setWaterLiters(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Exercise (Mins)</label>
                  <input
                    type="number"
                    value={exerciseMins}
                    onChange={(e) => setExerciseMins(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Mood</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="good">Good / Energetic</option>
                    <option value="neutral">Neutral / Balanced</option>
                    <option value="tired">Tired / Low Energy</option>
                    <option value="in_pain">Experiencing Discomfort</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Wellness Notes</label>
                <textarea
                  rows="2"
                  placeholder="Any dietary details, screen-time, or stresses..."
                  value={wellnessNotes}
                  onChange={(e) => setWellnessNotes(e.target.value)}
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
