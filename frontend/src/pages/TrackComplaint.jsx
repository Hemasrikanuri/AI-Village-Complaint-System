import React, { useState } from 'react';
import api from '../services/api';
import Timeline from '../components/Timeline';
import StatusBadge from '../components/StatusBadge';
import { Search, AlertCircle, MapPin, User, Calendar, Cpu } from 'lucide-react';

const TrackComplaint = () => {
  const [refId, setRefId] = useState('GS-2026-0001');
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!refId.trim()) return;

    setError('');
    setLoading(true);
    try {
      const res = await api.get(`/complaints/track/${refId.trim()}`);
      setComplaint(res.data);
    } catch (err) {
      setComplaint(null);
      setError(err.response?.data?.detail || 'No complaint found matching reference ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Search Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Real-time Status Tracking
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Track Complaint by Reference ID
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your unique complaint reference number (e.g. GS-2026-0001) to view timeline progress and officer remarks.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              required
              value={refId}
              onChange={(e) => setRefId(e.target.value)}
              placeholder="e.g. GS-2026-0001"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md shadow-primary-500/20 transition-all"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="max-w-md mx-auto p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Complaint Details Card */}
      {complaint && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="font-mono text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2.5 py-1 rounded-md">
                {complaint.reference_id}
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">{complaint.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
            <div>
              <span className="block font-bold text-slate-500 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary-500" /> Location
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{complaint.village_name}</p>
              <p className="text-[11px] text-slate-500">{complaint.address_text || 'No address text specified'}</p>
            </div>
            <div>
              <span className="block font-bold text-slate-500 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-primary-500" /> Field Officer
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{complaint.assigned_officer_name || 'Unassigned'}</p>
              <p className="text-[11px] text-slate-500">{complaint.department_name}</p>
            </div>
            <div>
              <span className="block font-bold text-slate-500 mb-1 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-primary-500" /> AI Confidence
              </span>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{Math.round((complaint.ai_confidence || 0.85) * 100)}%</p>
              <p className="text-[11px] text-slate-500">Auto-Triaged</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-1">Issue Description</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-800/20 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              {complaint.description}
            </p>
          </div>

          <Timeline complaint={complaint} />
        </div>
      )}

    </div>
  );
};

export default TrackComplaint;
