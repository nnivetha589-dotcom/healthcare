import React from 'react';
import { 
  Activity, 
  MessageSquare, 
  FileText, 
  UserCheck, 
  Mic, 
  CalendarClock, 
  Users, 
  AlertTriangle, 
  Settings, 
  LogOut,
  HeartPulse
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Health Overview', icon: Activity },
    { id: 'assistant', label: 'AI Health Assistant', icon: MessageSquare },
    { id: 'reports', label: 'Medical Report Centre', icon: FileText },
    { id: 'twin', label: 'AI Health Twin', icon: UserCheck },
    { id: 'voice', label: 'Tamil & Voice Assistant', icon: Mic },
    { id: 'planner', label: 'Smart Health Planner', icon: CalendarClock },
    { id: 'doctor', label: 'Doctor Visit & Family Care', icon: Users },
    { id: 'emergency', label: 'Emergency Guidance', icon: AlertTriangle, badge: 'SOS' },
    { id: 'settings', label: 'Profile & Privacy', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 tracking-tight leading-tight">MediMate AI</h1>
            <p className="text-[11px] text-teal-600 font-medium">Your Personal AI Health Companion</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-teal-50 text-teal-700 font-semibold' 
                    : item.id === 'emergency'
                    ? 'text-rose-600 hover:bg-rose-50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : item.id === 'emergency' ? 'text-rose-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || 'Patient Demo'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email || 'patient@medimate.ai'}</p>
          </div>
          <button 
            onClick={onLogout} 
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
