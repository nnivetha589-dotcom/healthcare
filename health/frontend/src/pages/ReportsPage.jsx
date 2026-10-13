import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  GitCompare, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  FileCheck,
  Eye,
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { reportsAPI } from '../services/api';

export default function ReportsPage({ user }) {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [compareId1, setCompareId1] = useState('');
  const [compareId2, setCompareId2] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('Blood Test');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getReports(user.id);
      setReports(res.data || []);
      if (res.data?.length > 0 && !selectedReport) {
        setSelectedReport(res.data[0]);
        if (res.data.length >= 2) {
          setCompareId1(res.data[1].id);
          setCompareId2(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchReports();
  }, [user]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Please select a medical report file (PDF, JPG, PNG)");
      return;
    }
    // Size check (< 16 MB)
    if (file.size > 16 * 1024 * 1024) {
      setUploadError("File size exceeds 16 MB limit.");
      return;
    }

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', user.id);
    formData.append('title', title || file.name);
    formData.append('report_type', reportType);
    formData.append('report_date', reportDate);

    try {
      const res = await reportsAPI.uploadReport(formData);
      setUploadSuccess('Report uploaded and biomarkers extracted successfully!');
      setTitle('');
      setFile(null);
      await fetchReports();
      setSelectedReport(res.data.report);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (reportId) => {
    if (window.confirm("Permanently delete this medical report?")) {
      try {
        await reportsAPI.deleteReport(reportId);
        if (selectedReport?.id === reportId) {
          setSelectedReport(null);
        }
        await fetchReports();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRunComparison = async () => {
    if (!compareId1 || !compareId2) return;
    try {
      setLoading(true);
      const res = await reportsAPI.compareReports(user.id, compareId1, compareId2);
      setComparisonResult(res.data);
    } catch (err) {
      alert("Failed to compare reports: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Smart Medical Report Centre</h1>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full font-semibold border border-teal-200">
              Feature 2
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Extract parameters from PDF/JPG lab panels, explain medical terms, and track longitudinal value changes.
          </p>
        </div>
      </div>

      {/* Upload & Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Form Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Upload className="w-5 h-5 text-teal-600" />
            <h2 className="text-sm font-bold text-slate-800">Upload New Medical Report</h2>
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-teal-50 text-teal-700 rounded-xl text-xs border border-teal-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Report Title / Lab Name</label>
              <input
                type="text"
                placeholder="e.g. Lipid Profile, Complete Blood Count"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Report Category</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Blood Test">Blood Test</option>
                  <option value="Lipid Profile">Lipid Profile</option>
                  <option value="Metabolic Panel">Metabolic Panel</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Thyroid Panel">Thyroid Panel</option>
                  <option value="General Health">General Health</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Test Date</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Choose File (.pdf, .jpg, .png)</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-1">Files are verified for type & size. Maximum 16 MB.</p>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Extracting Text & Values...' : 'Upload & Analyze Report'}</span>
            </button>
          </form>
        </div>

        {/* Uploaded Reports List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-800">Your Diagnostic Records ({reports.length})</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Click a report to inspect details</span>
            </div>

            {reports.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs">No medical reports uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {reports.map((rep) => {
                  const isSelected = selectedReport?.id === rep.id;
                  return (
                    <div
                      key={rep.id}
                      onClick={() => setSelectedReport(rep)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/40 ring-1 ring-teal-500'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-800 truncate">{rep.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 uppercase font-mono">
                            {rep.file_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {rep.report_date}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-[11px] text-teal-700 font-medium">
                          {rep.analysis?.metrics?.length || 0} values extracted
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(rep.id);
                          }}
                          title="Delete report"
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Safe boundary warning */}
          <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Values are strictly parsed from the report text. MediMate AI never invents lab readings.</span>
          </div>
        </div>
      </div>

      {/* Selected Report Inspection View */}
      {selectedReport && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">{selectedReport.title}</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  {selectedReport.report_type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Recorded on {selectedReport.report_date}</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">File: {selectedReport.file_path}</span>
            </div>
          </div>

          {/* Biomarkers Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Extracted Biomarkers & Plain-Language Explanations</h3>
            
            {(!selectedReport.analysis?.metrics || selectedReport.analysis.metrics.length === 0) ? (
              <p className="text-xs text-slate-400 italic">No structured tabular values identified. See raw extracted text below.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Test / Biomarker</th>
                      <th className="py-3 px-4">Measured Value</th>
                      <th className="py-3 px-4">Reference Range</th>
                      <th className="py-3 px-4">Simple Language Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedReport.analysis.metrics.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-800">{m.name}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-teal-700 text-sm">{m.value}</span>{' '}
                          <span className="text-slate-500 text-[11px]">{m.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{m.reference_range}</td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{m.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User Verification: Raw Extracted Text */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Extracted Text for User Verification</span>
            </h3>
            <pre className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 text-xs font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              {selectedReport.extracted_text || 'No textual content extracted from file.'}
            </pre>
            <p className="text-[11px] text-slate-400">
              Inspect this text to verify that the extracted parameters match your original physical document.
            </p>
          </div>
        </div>
      )}

      {/* Compare Old and New Reports Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-teal-600" />
              <h2 className="text-base font-bold text-slate-800">Compare Longitudinal Reports</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select two test panels to highlight biomarker changes and health trajectory over time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={compareId1}
              onChange={(e) => setCompareId1(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-teal-500"
            >
              <option value="">Select First Report</option>
              {reports.map((r) => (
                <option key={r.id} value={r.id}>{r.title} ({r.report_date})</option>
              ))}
            </select>

            <ArrowRight className="w-4 h-4 text-slate-400 hidden sm:block" />

            <select
              value={compareId2}
              onChange={(e) => setCompareId2(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-teal-500"
            >
              <option value="">Select Second Report</option>
              {reports.map((r) => (
                <option key={r.id} value={r.id}>{r.title} ({r.report_date})</option>
              ))}
            </select>

            <button
              onClick={handleRunComparison}
              disabled={!compareId1 || !compareId2 || compareId1 === compareId2}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-200 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
            >
              Compare Values
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        {comparisonResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600 bg-teal-50/50 p-3 rounded-xl border border-teal-100">
              <span><strong>Earlier Baseline:</strong> {comparisonResult.older_report.title} ({comparisonResult.older_report.date})</span>
              <span><strong>Recent Panel:</strong> {comparisonResult.newer_report.title} ({comparisonResult.newer_report.date})</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Biomarker</th>
                    <th className="py-3 px-4">Older Value</th>
                    <th className="py-3 px-4">Recent Value</th>
                    <th className="py-3 px-4">Net Change</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonResult.comparison.map((item, idx) => {
                    const isInc = item.status === 'increased';
                    const isDec = item.status === 'decreased';
                    return (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600">{item.old_value} {item.unit}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{item.new_value} {item.unit}</td>
                        <td className="py-3 px-4 font-mono font-medium">
                          <span className={isInc ? 'text-amber-600' : isDec ? 'text-teal-600' : 'text-slate-500'}>
                            {item.change}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isInc 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                              : isDec 
                              ? 'bg-teal-50 text-teal-700 border border-teal-200' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isInc ? <TrendingUp className="w-3 h-3" /> : isDec ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            <span className="capitalize">{item.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{item.explanation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
