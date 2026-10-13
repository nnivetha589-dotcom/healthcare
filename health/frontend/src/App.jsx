import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AssistantPage from './pages/AssistantPage';
import ReportsPage from './pages/ReportsPage';
import HealthTwinPage from './pages/HealthTwinPage';
import VoicePage from './pages/VoicePage';
import PlannerPage from './pages/PlannerPage';
import DoctorFamilyPage from './pages/DoctorFamilyPage';
import EmergencyPage from './pages/EmergencyPage';
import SettingsPage from './pages/SettingsPage';
import { systemAPI } from './services/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medimate_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [backendHealth, setBackendHealth] = useState(null);

  // Check backend connectivity on mount
  useEffect(() => {
    systemAPI.healthCheck()
      .then(res => setBackendHealth(res.data))
      .catch(() => setBackendHealth({ status: 'offline', ai_mode: 'Unknown' }));
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('medimate_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('medimate_user');
    setActiveTab('dashboard');
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('medimate_user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-screen flex flex-col justify-between">
        <div className="flex-1">
          {/* Top Status Bar */}
          <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-3 flex items-center justify-between text-xs sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className={`w-2 h-2 rounded-full ${backendHealth?.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span>Backend: {backendHealth?.status === 'healthy' ? 'Connected' : 'Connecting...'}</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md font-medium border border-teal-100">
                AI Mode: {backendHealth?.ai_mode || 'Demo Safe Mode'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500">Language: <strong className="text-slate-800 uppercase">{user.preferred_language || 'EN'}</strong></span>
            </div>
          </div>

          {/* Render Active Page */}
          {activeTab === 'dashboard' && <Dashboard user={user} onNavigate={setActiveTab} />}
          {activeTab === 'assistant' && <AssistantPage user={user} />}
          {activeTab === 'reports' && <ReportsPage user={user} />}
          {activeTab === 'twin' && <HealthTwinPage user={user} />}
          {activeTab === 'voice' && <VoicePage user={user} />}
          {activeTab === 'planner' && <PlannerPage user={user} />}
          {activeTab === 'doctor' && <DoctorFamilyPage user={user} />}
          {activeTab === 'emergency' && <EmergencyPage />}
          {activeTab === 'settings' && <SettingsPage user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} />}
        </div>

        {/* Global Footer with Medical Boundary Notice */}
        <footer className="border-t border-slate-200/80 bg-white px-8 py-4 text-center text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} MediMate AI • Your Health Data. Your Language. Your Personal AI Companion.
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Notice: MediMate AI is for health education and personal tracking. It is not an FDA/regulatory approved medical diagnostic device.
          </p>
        </footer>
      </main>
    </div>
  );
}
