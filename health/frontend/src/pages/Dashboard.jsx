import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Droplet, 
  Moon, 
  FileText, 
  CalendarClock, 
  CheckCircle2, 
  Circle, 
  ArrowUpRight, 
  AlertCircle,
  Database,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { reportsAPI, healthTwinAPI, plannerAPI, systemAPI } from '../services/api';

export default function Dashboard({ user, onNavigate }) {
  const [reports, setReports] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedStatus, setSeedStatus] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [repRes, twinRes, remRes] = await Promise.all([
        reportsAPI.getReports(user.id),
        healthTwinAPI.getLogs(user.id),
        plannerAPI.getReminders(user.id)
      ]);
      setReports(repRes.data || []);
      setHealthSummary(twinRes.data?.summary || null);
      setReminders(remRes.data || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const toggleReminder = async (id, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await plannerAPI.updateStatus(id, newStatus);
      setReminders(reminders.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleInitSampleData = async () => {
    try {
      setSeedStatus('Loading sample data...');
      await systemAPI.initSampleData();
      await loadData();
      setSeedStatus('Fictional sample data loaded successfully!');
      setTimeout(() => setSeedStatus(''), 4000);
    } catch (err) {
      setSeedStatus('Error loading sample data.');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-600 via-teal-700 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-teal-700/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-teal-100 backdrop-blur-sm">
              Health Overview
            </span>
            <span className="text-teal-200 text-xs">Patient ID: #MM-{user?.id || 101}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Good day, {user?.name || 'Ananya'} 👋</h1>
          <p className="text-teal-100 text-sm mt-1 max-w-xl">
            Welcome to your MediMate AI companion. Review your recent biomarkers, symptom trends, and daily wellness schedule.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleInitSampleData}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-4 py-2.5 rounded-xl border border-white/20 transition-all backdrop-blur-sm shadow-sm"
          >
            <Database className="w-4 h-4 text-teal-300" />
            <span>Load Demo Data</span>
          </button>
          <button
            onClick={() => onNavigate('assistant')}
            className="flex items-center gap-2 bg-white text-teal-800 hover:bg-teal-50 text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition-all"
          >
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Ask MediMate AI</span>
          </button>
        </div>
      </div>

      {seedStatus && (
        <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{seedStatus}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sleep Average</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{healthSummary?.avg_sleep || 7.2}</span>
            <span className="text-xs text-slate-500 font-medium">hrs / night</span>
          </div>
          <p className="text-[11px] text-teal-600 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Optimal rest interval
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hydration Avg</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{healthSummary?.avg_water || 2.1}</span>
            <span className="text-xs text-slate-500 font-medium">L / day</span>
          </div>
          <p className="text-[11px] text-sky-600 font-medium mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Met daily water target
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Reports</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{reports.length}</span>
            <span className="text-xs text-slate-500 font-medium">Lab Panels</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">
            Latest: {reports[0]?.report_date || 'None'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Care Reminders</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">
              {reminders.filter(r => r.status === 'completed').length} / {reminders.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">Completed</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
            {reminders.filter(r => r.status === 'pending').length} remaining today
          </p>
        </div>
      </div>

      {/* Main Grid: Reminders & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Reports & Health Twin Pattern */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Observed Pattern Card */}
          {healthSummary?.patterns && healthSummary.patterns.length > 0 && (
            <div className="bg-gradient-to-r from-teal-50/70 to-blue-50/70 p-5 rounded-2xl border border-teal-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-800">Personal Health Twin Observation</h3>
                  <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-medium">Non-diagnostic</span>
                </div>
                {healthSummary.patterns.map((p, idx) => (
                  <p key={idx} className="text-xs text-slate-600">• {p}</p>
                ))}
                <p className="text-[11px] text-slate-500 italic pt-1">{healthSummary.disclaimer}</p>
              </div>
            </div>
          )}

          {/* Recent Reports Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800 text-base">Recent Medical Reports</h2>
                <p className="text-xs text-slate-500">Verified lab records and biomarker extractions</p>
              </div>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>View all ({reports.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No reports uploaded yet.</p>
                <button
                  onClick={() => onNavigate('reports')}
                  className="mt-3 text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg font-medium hover:bg-teal-100"
                >
                  Upload First Medical Report
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {reports.slice(0, 3).map((rep) => (
                  <div key={rep.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800">{rep.title}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md uppercase font-medium">
                          {rep.file_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Date: {rep.report_date} • {rep.analysis?.metrics?.length || 0} biomarkers extracted
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('reports')}
                      className="text-xs font-medium text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Inspect Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Today's Health Planner */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-slate-800 text-base">Care Schedule</h2>
                <p className="text-xs text-slate-500">Medications, hydration & routines</p>
              </div>
              <button
                onClick={() => onNavigate('planner')}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5"
              >
                <span>Planner</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {reminders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No active reminders created.</p>
            ) : (
              <div className="space-y-2.5">
                {reminders.map((r) => {
                  const isDone = r.status === 'completed';
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleReminder(r.id, r.status)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        isDone 
                          ? 'bg-emerald-50/40 border-emerald-200/60 text-slate-500' 
                          : 'bg-slate-50 border-slate-200/80 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <p className={`text-xs font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {r.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {r.dosage_or_target} • {r.time_of_day}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Doctor Summary CTA Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm tracking-tight">Preparing for a Clinic Visit?</h3>
            <p className="text-xs text-blue-100 leading-relaxed">
              Compile your symptom history, lab changes, and targeted questions into a 1-page printable Doctor Summary.
            </p>
            <button
              onClick={() => onNavigate('doctor')}
              className="w-full bg-white text-blue-700 hover:bg-blue-50 text-xs font-semibold py-2.5 rounded-xl transition-all shadow-sm"
            >
              Generate Doctor Briefing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
