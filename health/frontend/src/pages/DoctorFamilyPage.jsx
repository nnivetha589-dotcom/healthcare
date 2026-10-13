import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Share2, 
  CheckCircle2, 
  Trash2, 
  ShieldCheck, 
  Stethoscope, 
  Plus, 
  HelpCircle, 
  Copy,
  ExternalLink,
  Lock
} from 'lucide-react';
import { familyCareAPI, reportsAPI, healthTwinAPI } from '../services/api';

export default function DoctorFamilyPage({ user }) {
  const [activeSubTab, setActiveSubTab] = useState('doctor'); // 'doctor' or 'family'
  
  // Doctor Visit State
  const [summaries, setSummaries] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [chiefComplaints, setChiefComplaints] = useState('Intermittent evening fatigue and mild tension headaches');
  const [selectedSymptoms, setSelectedSymptoms] = useState('Fatigue, Mild Headache');
  const [selectedReportsText, setSelectedReportsText] = useState('Follow-up Metabolic & Lipid Panel (HbA1c 5.8%, Total Cholesterol 195 mg/dL)');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);

  // Family Sharing State
  const [shares, setShares] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRelation, setShareRelation] = useState('Caregiver');
  const [accessLevel, setAccessLevel] = useState('view_summary');
  const [consentChecked, setConsentChecked] = useState(false);
  const [copiedToken, setCopiedToken] = useState('');

  const loadData = async () => {
    try {
      const [sumRes, shareRes, repRes, logRes] = await Promise.all([
        familyCareAPI.getDoctorSummaries(user.id),
        familyCareAPI.getFamilyShares(user.id),
        reportsAPI.getReports(user.id),
        healthTwinAPI.getLogs(user.id)
      ]);
      setSummaries(sumRes.data || []);
      setShares(shareRes.data || []);
      setReports(repRes.data || []);
      setLogs(logRes.data?.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.id) loadData();
  }, [user]);

  const handleGenerateDoctorSummary = async (e) => {
    e.preventDefault();
    try {
      await familyCareAPI.createDoctorSummary(user.id, {
        title: `Doctor Consultation Brief - ${visitDate}`,
        visit_date: visitDate,
        chief_complaints: chiefComplaints,
        symptoms: selectedSymptoms,
        reports: selectedReportsText
      });
      setShowDocModal(false);
      loadData();
    } catch (err) {
      alert("Failed to compile doctor visit summary");
    }
  };

  const handleCreateShare = async (e) => {
    e.preventDefault();
    if (!consentChecked) {
      alert("Explicit user consent is required before sharing personal health data.");
      return;
    }

    try {
      await familyCareAPI.grantShare(user.id, {
        shared_with_email: shareEmail,
        relation: shareRelation,
        access_level: accessLevel
      });
      setShowShareModal(false);
      setShareEmail('');
      setConsentChecked(false);
      loadData();
    } catch (err) {
      alert("Failed to grant share permission");
    }
  };

  const handleRevokeShare = async (shareId) => {
    if (window.confirm("Immediately revoke access for this family member?")) {
      try {
        await familyCareAPI.revokeShare(shareId);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const copyShareLink = (token) => {
    const url = `${window.location.origin}/#shared=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(''), 3000);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Title & Subtabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Family Care & Doctor Visit Assistant</h1>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-semibold border border-teal-200">
              Feature 6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Empower doctor consultations with organized briefing notes, and share records with family members only after explicit consent.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('doctor')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'doctor' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Doctor Visit Briefing</span>
          </button>
          <button
            onClick={() => setActiveSubTab('family')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'family' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Family Care Sharing</span>
          </button>
        </div>
      </div>

      {/* --- SUBTAB 1: DOCTOR VISIT BRIEFING --- */}
      {activeSubTab === 'doctor' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Doctor-Visit Summaries</h2>
              <p className="text-xs text-slate-500">Concise, printable consultation summaries with high-yield questions</p>
            </div>
            <button
              onClick={() => setShowDocModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Visit Summary</span>
            </button>
          </div>

          {summaries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
              <Stethoscope className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>No doctor summaries created yet. Click "Create New Visit Summary" to generate one before your next clinic appointment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {summaries.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Stethoscope className="w-4 h-4" />
                      </span>
                      <div>
                        <h3 className="font-bold text-sm text-slate-800">{s.title}</h3>
                        <p className="text-[11px] text-slate-500">Target Visit Date: {s.visit_date}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600 font-semibold uppercase">
                      Ready for Clinic
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-700 block">Chief Complaints & Reported Symptoms:</span>
                      <p className="text-slate-600">{s.chief_complaints || s.symptoms_summary || 'General health review'}</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-700 block">Referenced Medical Reports:</span>
                      <p className="text-slate-600">{s.relevant_reports || 'Recent blood work'}</p>
                    </div>
                  </div>

                  {/* Curated Questions to Ask Doctor */}
                  {s.questions && s.questions.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-teal-600" />
                        <span>Recommended Questions to Ask Your Physician:</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {s.questions.map((q, idx) => (
                          <div key={idx} className="p-2.5 bg-teal-50/60 rounded-xl border border-teal-100 text-xs text-slate-700 flex items-start gap-2">
                            <span className="text-teal-700 font-bold">Q{idx + 1}:</span>
                            <span>{q}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 2: FAMILY CARE SHARING & PERMISSIONS --- */}
      {activeSubTab === 'family' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Family & Caregiver Access Control</h2>
              <p className="text-xs text-slate-500">
                Grant trusted relatives permission to review your health timeline. You can revoke access at any time.
              </p>
            </div>
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Grant New Share Permission</span>
            </button>
          </div>

          {/* Privacy Consent Guard Banner */}
          <div className="bg-teal-50/70 border border-teal-200/80 p-4 rounded-2xl flex items-center gap-3 text-xs text-teal-900">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              <strong>Strict Consent Architecture:</strong> MediMate AI enforces backend row-level permissions. Family members only receive view tokens after you review and grant explicit affirmative consent. All sharing tokens can be revoked immediately with one click.
            </p>
          </div>

          {shares.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
              <Lock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p>You have not shared your health records with anyone. Your data remains completely private.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Active Family Permissions ({shares.length})</span>
                <span className="text-[11px] text-slate-400">Tokens are revokable at any moment</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {shares.map((sh) => (
                  <div key={sh.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{sh.shared_with_email}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                          {sh.relation}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 capitalize">
                          {sh.access_level.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Granted on {sh.created_at?.slice(0, 10)} • Consent: Active
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyShareLink(sh.share_token)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedToken === sh.share_token ? 'Link Copied!' : 'Copy Access Link'}</span>
                      </button>

                      <button
                        onClick={() => handleRevokeShare(sh.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke Access</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Generate Doctor Briefing */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-100 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Prepare Doctor Consultation Briefing</h3>
              <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">✕</button>
            </div>

            <form onSubmit={handleGenerateDoctorSummary} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Appointment Date</label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Primary Symptoms / Chief Complaints</label>
                <textarea
                  rows="2"
                  value={chiefComplaints}
                  onChange={(e) => setChiefComplaints(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="e.g. Mild headache occurring every afternoon, fatigue..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Relevant Lab Reports & Findings</label>
                <input
                  type="text"
                  value={selectedReportsText}
                  onChange={(e) => setSelectedReportsText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  placeholder="e.g. Recent CBC & Lipid panel showing HbA1c 5.8%"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm"
                >
                  Compile Doctor Summary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Grant Family Care Share */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-100 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Grant Family Care Record Access</h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">✕</button>
            </div>

            <form onSubmit={handleCreateShare} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="family.member@gmail.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Relationship</label>
                  <select
                    value={shareRelation}
                    onChange={(e) => setShareRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Caregiver">Caregiver</option>
                    <option value="Doctor">Primary Doctor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Access Level</label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="view_summary">Weekly Summary Only</option>
                    <option value="view_reports">Summary + Lab Reports</option>
                    <option value="full_view">Full Record View</option>
                  </select>
                </div>
              </div>

              {/* Explicit Affirmative Consent Checkbox */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="rounded text-teal-600 mt-0.5"
                  />
                  <span className="text-[11px] text-amber-900 font-medium leading-relaxed">
                    <strong>Explicit Consent Confirmation:</strong> I expressly authorize this recipient to access my health logs and medical records. I understand I can revoke this permission at any moment.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!consentChecked}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl font-semibold shadow-sm"
                >
                  Confirm & Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
