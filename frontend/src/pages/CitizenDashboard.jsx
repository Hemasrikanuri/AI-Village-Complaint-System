import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import { PlusCircle, Search, Clock, CheckCircle2, AlertCircle, FileText, ArrowRight, X } from 'lucide-react';

const CitizenDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const resolvedCount = complaints.filter(c => c.status === 'RESOLVED').length;
  const inProgressCount = complaints.filter(c => c.status === 'IN_PROGRESS').length;
  const pendingCount = complaints.filter(c => c.status === 'SUBMITTED' || c.status === 'ASSIGNED').length;

  const filtered = complaints.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.reference_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.category_name && c.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 p-6 rounded-2xl text-white shadow-xl shadow-primary-900/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            Citizen Grievance Portal
          </span>
          <h1 className="text-2xl font-extrabold mt-2">Panchayat Complaint Dashboard</h1>
          <p className="text-xs text-primary-100 mt-1 max-w-xl">
            Register civic complaints, track officer assignments, and monitor real-time resolution progress.
          </p>
        </div>
        <Link
          to="/citizen/new"
          className="px-5 py-3 rounded-xl bg-white text-primary-700 font-bold text-xs shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-primary-600" />
          Register New Complaint
        </Link>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-slate-500">Total Registered</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{complaints.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-amber-600">Pending / Assigned</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-blue-600">In Progress</div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">{inProgressCount}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-bold text-emerald-600">Successfully Resolved</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{resolvedCount}</div>
        </div>
      </div>

      {/* Search & Complaints Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Your Submitted Complaints</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ref ID or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading complaints...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">No complaints found matching criteria.</p>
            <Link to="/citizen/new" className="text-xs text-primary-600 font-bold hover:underline">
              Submit your first complaint →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Ref ID</th>
                  <th className="pb-3 px-3">Title</th>
                  <th className="pb-3 px-3">Category</th>
                  <th className="pb-3 px-3">Priority</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Assigned Officer</th>
                  <th className="pb-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-primary-600">{c.reference_id}</td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">{c.title}</td>
                    <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">{c.category_name}</td>
                    <td className="py-3.5 px-3"><StatusBadge priority={c.priority} /></td>
                    <td className="py-3.5 px-3"><StatusBadge status={c.status} /></td>
                    <td className="py-3.5 px-3 font-medium text-slate-700 dark:text-slate-300">{c.assigned_officer_name || 'Unassigned'}</td>
                    <td className="py-3.5 px-3">
                      <button
                        onClick={() => setSelectedComplaint(c)}
                        className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 dark:bg-slate-800 dark:text-primary-400 font-bold text-xs hover:bg-primary-100 transition-colors"
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-primary-600">{selectedComplaint.reference_id}</span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{selectedComplaint.title}</h2>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
              <div>
                <p>📍 <strong>Village:</strong> {selectedComplaint.village_name}</p>
                <p>📂 <strong>Category:</strong> {selectedComplaint.category_name} ({selectedComplaint.department_name})</p>
                <p>📅 <strong>Submitted:</strong> {new Date(selectedComplaint.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p>👤 <strong>Assigned Officer:</strong> {selectedComplaint.assigned_officer_name}</p>
                <p>🤖 <strong>AI Triage Confidence:</strong> {int(selectedComplaint.ai_confidence * 100 || 85)}%</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge priority={selectedComplaint.priority} />
                  <StatusBadge status={selectedComplaint.status} />
                </div>
              </div>
            </div>

            {selectedComplaint.photo_url && (
              <div>
                <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-2">Uploaded Photo Evidence</h4>
                <img
                  src={selectedComplaint.photo_url}
                  alt="Complaint evidence"
                  className="w-full max-h-60 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                />
              </div>
            )}

            <Timeline complaint={selectedComplaint} />
          </div>
        </div>
      )}

    </div>
  );
};

// Helper inside jsx for int conversion
function int(val) { return Math.round(val); }

export default CitizenDashboard;
