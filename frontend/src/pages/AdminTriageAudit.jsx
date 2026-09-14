import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { ShieldAlert, Cpu, CheckCircle2, Edit3, AlertCircle, X, Sparkles } from 'lucide-react';

const AdminTriageAudit = () => {
  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Override Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newPriority, setNewPriority] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newOfficerId, setNewOfficerId] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchTriageData();
  }, []);

  const fetchTriageData = async () => {
    try {
      const [compRes, catRes, userRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/departments/categories'),
        api.get('/admin/users')
      ]);
      setComplaints(compRes.data);
      setCategories(catRes.data);
      setOfficers(userRes.data.filter(u => u.role === 'OFFICER'));
    } catch (err) {
      console.error('Failed to load triage audit data');
    } finally {
      setLoading(false);
    }
  };

  const handleOverride = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      await api.post(`/admin/complaints/${selectedComplaint.id}/triage-override`, {
        priority: newPriority || null,
        category_id: newCategoryId ? parseInt(newCategoryId) : null,
        assigned_officer_id: newOfficerId ? parseInt(newOfficerId) : null
      });

      setSelectedComplaint(null);
      fetchTriageData();
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Triage override failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const duplicatesCount = complaints.filter(c => c.duplicate_of_id != null).length;

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-primary-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
              AI Triage Audit & Governance
            </span>
            <h1 className="text-2xl font-extrabold mt-2">AI Classifier & Duplicate Detector Audit</h1>
            <p className="text-xs text-purple-100 mt-1">
              Review AI confidence scores, manually override priority/category ratings, and inspect flagged duplicates.
            </p>
          </div>
          <div className="bg-white/10 px-4 py-3 rounded-xl backdrop-blur text-center border border-white/20">
            <span className="block text-[10px] uppercase font-bold text-purple-200">Flagged Duplicates</span>
            <span className="text-xl font-extrabold text-amber-300">{duplicatesCount} Issues</span>
          </div>
        </div>
      </div>

      {/* AI Triage Audit Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-600" />
          AI Triage Logs & Override Management
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading AI triage data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Ref ID</th>
                  <th className="pb-3 px-3">Complaint Title</th>
                  <th className="pb-3 px-3">Village</th>
                  <th className="pb-3 px-3">AI Confidence</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Assigned Officer</th>
                  <th className="pb-3 px-3">Duplicate Status</th>
                  <th className="pb-3 px-3">Audit Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-purple-600">{c.reference_id}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">{c.title}</td>
                    <td className="py-3 px-3">{c.village_name}</td>
                    <td className="py-3 px-3">
                      <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                        c.ai_confidence >= 0.9 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {Math.round((c.ai_confidence || 0.85) * 100)}%
                      </span>
                    </td>
                    <td className="py-3 px-3"><StatusBadge priority={c.priority} /></td>
                    <td className="py-3 px-3 font-medium">{c.assigned_officer_name || 'Unassigned'}</td>
                    <td className="py-3 px-3">
                      {c.duplicate_of_id ? (
                        <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ⚠️ Duplicate of #{c.duplicate_of_id}
                        </span>
                      ) : (
                        <span className="text-slate-400">Unique</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setNewPriority(c.priority);
                          setNewCategoryId(c.category_id);
                          setNewOfficerId(c.assigned_officer_id || '');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-slate-800 dark:text-purple-300 font-bold text-[11px] hover:bg-purple-100 flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" /> Override
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual AI Triage Override Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Override AI Triage ({selectedComplaint.reference_id})
              </h3>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Override Priority Level
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                >
                  <option value="URGENT">🚨 URGENT</option>
                  <option value="HIGH">⚠️ HIGH</option>
                  <option value="MEDIUM">📌 MEDIUM</option>
                  <option value="LOW">🔹 LOW</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Override Category
                </label>
                <select
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Override Assigned Field Officer
                </label>
                <select
                  value={newOfficerId}
                  onChange={(e) => setNewOfficerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                >
                  <option value="">Keep Current Officer</option>
                  {officers.map((off) => (
                    <option key={off.id} value={off.id}>{off.name} ({off.email})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md transition-all"
              >
                {modalLoading ? 'Applying Override...' : 'Confirm AI Triage Override'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminTriageAudit;
