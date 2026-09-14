import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { LayoutDashboard, CheckCircle2, Clock, AlertTriangle, UserCheck, ShieldAlert, ArrowRight, X, RefreshCw } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [slaList, setSlaList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reassignment Modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [targetOfficerId, setTargetOfficerId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [reassignModalError, setReassignModalError] = useState('');
  const [reassignLoading, setReassignLoading] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, slaRes, compRes, userRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/sla'),
        api.get('/complaints'),
        api.get('/admin/users')
      ]);
      setStats(statsRes.data);
      setSlaList(slaRes.data);
      setComplaints(compRes.data);
      setOfficers(userRes.data.filter(u => u.role === 'OFFICER'));
    } catch (err) {
      console.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!targetOfficerId) {
      setReassignModalError('Please select a target field officer.');
      return;
    }

    setReassignModalError('');
    setReassignLoading(true);

    try {
      await api.post(`/admin/complaints/${selectedComplaint.id}/reassign`, {
        assigned_officer_id: parseInt(targetOfficerId),
        reason: reassignReason
      });

      setSelectedComplaint(null);
      setReassignReason('');
      fetchAdminData();
    } catch (err) {
      setReassignModalError(err.response?.data?.detail || 'Reassignment failed.');
    } finally {
      setReassignLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-primary-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
            Executive Panchayat Control Center
          </span>
          <h1 className="text-2xl font-extrabold mt-2">GramSetu Sarpanch Dashboard</h1>
          <p className="text-xs text-slate-300 mt-1">
            Real-time complaint telemetry, SLA resolution performance, and load dispatch.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur flex items-center gap-2 transition-all border border-white/20"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Telemetry
        </button>
      </div>

      {/* Live Executive KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-slate-500">Total Registered</div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{stats.total_complaints}</div>
            <div className="text-[10px] text-slate-400 mt-1">Complaints logged across all 5 villages</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-emerald-600">Resolution Rate</div>
            <div className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.resolution_rate_pct}%</div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">{stats.resolved_complaints} resolved issues</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-amber-600">Avg Resolution Time</div>
            <div className="text-3xl font-extrabold text-amber-600 mt-1">{stats.avg_resolution_time_hours} hrs</div>
            <div className="text-[10px] text-slate-400 mt-1">Calculated live from DB closed tickets</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-bold text-rose-600">Urgent Pending</div>
            <div className="text-3xl font-extrabold text-rose-600 mt-1">{stats.urgent_complaints_count}</div>
            <div className="text-[10px] text-rose-700 dark:text-rose-400 mt-1">Requires immediate dispatch</div>
          </div>
        </div>
      )}

      {/* Department SLA & Performance Metrics */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-600" />
          Departmental SLA & Workload Performance
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">Department</th>
                <th className="pb-3 px-3">Total Tickets</th>
                <th className="pb-3 px-3">Resolved</th>
                <th className="pb-3 px-3">Pending / Open</th>
                <th className="pb-3 px-3">Avg Resolution Time</th>
                <th className="pb-3 px-3">Overdue (&gt; 48h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {slaList.map((d) => (
                <tr key={d.department_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{d.department_name}</td>
                  <td className="py-3 px-3 font-semibold">{d.total_assigned}</td>
                  <td className="py-3 px-3 text-emerald-600 font-bold">{d.resolved}</td>
                  <td className="py-3 px-3 text-amber-600 font-bold">{d.pending}</td>
                  <td className="py-3 px-3 font-mono">{d.avg_resolution_hours} hrs</td>
                  <td className="py-3 px-3">
                    {d.overdue_count > 0 ? (
                      <span className="px-2 py-0.5 rounded font-bold bg-rose-100 text-rose-800">
                        🚨 {d.overdue_count} Overdue
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complaint Dispatch & Reassignment Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-primary-600" />
          Live Complaints & Manual Dispatch Center
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">Ref ID</th>
                <th className="pb-3 px-3">Title</th>
                <th className="pb-3 px-3">Village</th>
                <th className="pb-3 px-3">Category</th>
                <th className="pb-3 px-3">Priority</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Assigned Officer</th>
                <th className="pb-3 px-3">Dispatch Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {complaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-mono font-bold text-primary-600">{c.reference_id}</td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">{c.title}</td>
                  <td className="py-3 px-3">{c.village_name}</td>
                  <td className="py-3 px-3">{c.category_name}</td>
                  <td className="py-3 px-3"><StatusBadge priority={c.priority} /></td>
                  <td className="py-3 px-3"><StatusBadge status={c.status} /></td>
                  <td className="py-3 px-3 font-medium">{c.assigned_officer_name || 'Unassigned'}</td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => {
                        setSelectedComplaint(c);
                        if (officers.length > 0) setTargetOfficerId(officers[0].id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 dark:bg-slate-800 dark:text-primary-400 font-bold text-[11px] hover:bg-primary-100"
                    >
                      Reassign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Officer Reassignment Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Reassign Complaint ({selectedComplaint.reference_id})
              </h3>
              <button onClick={() => setSelectedComplaint(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {reassignModalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{reassignModalError}</span>
              </div>
            )}

            <form onSubmit={handleReassign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Target Field Officer *
                </label>
                <select
                  value={targetOfficerId}
                  onChange={(e) => setTargetOfficerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                >
                  {officers.map((off) => (
                    <option key={off.id} value={off.id}>
                      {off.name} ({off.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reassignment Reason (Optional)
                </label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g., Workload rebalancing or officer leave..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={reassignLoading}
                className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md transition-all"
              >
                {reassignLoading ? 'Reassigning...' : 'Confirm Dispatch Reassignment'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
