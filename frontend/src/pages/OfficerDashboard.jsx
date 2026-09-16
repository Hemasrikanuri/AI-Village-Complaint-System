import React, { useState, useEffect } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, CheckCircle2, Clock, XCircle, FileText, AlertCircle, MapPin, X, 
  MessageSquarePlus, Search, ArrowUpDown, Phone, Mail, ShieldAlert, Upload, 
  Eye, CheckCircle, AlertTriangle, UserCheck, Calendar, ExternalLink
} from 'lucide-react';

const OfficerDashboard = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('sla'); // 'sla', 'newest', 'oldest', 'priority'

  // Modals state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Meta data for officer profile mapping
  const [villages, setVillages] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Form states
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [statusNote, setStatusNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [fieldNote, setFieldNote] = useState('');
  const [escalateReason, setEscalateReason] = useState('');

  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchOfficerWorkQueue();
    fetchMeta();
  }, [priorityFilter, statusFilter]);

  const fetchMeta = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/villages'),
        api.get('/departments')
      ]);
      setVillages(vRes.data);
      setDepartments(dRes.data);
    } catch (err) {
      console.warn('Meta fetch skipped:', err);
    }
  };

  const fetchOfficerWorkQueue = async () => {
    try {
      let url = '/complaints?';
      if (priorityFilter) url += `priority_filter=${priorityFilter}&`;
      if (statusFilter) url += `status_filter=${statusFilter}&`;
      const res = await api.get(url);
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load officer work queue');
    } finally {
      setLoading(false);
    }
  };

  // SLA Calculation Helper (Target SLAs: URGENT=12h, HIGH=24h, MEDIUM=48h, LOW=72h)
  const getSLAInfo = (c) => {
    const hoursMap = { URGENT: 12, HIGH: 24, MEDIUM: 48, LOW: 72 };
    const targetHours = hoursMap[c.priority] || 48;
    const created = new Date(c.created_at).getTime();
    const deadline = created + targetHours * 3600 * 1000;
    const end = (c.status === 'RESOLVED' || c.status === 'REJECTED') && c.updated_at 
      ? new Date(c.updated_at).getTime() 
      : Date.now();
    const diffMs = deadline - end;
    
    const isOverdue = diffMs < 0;
    const absDiff = Math.abs(diffMs);
    const totalMinutes = Math.floor(absDiff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    const remMinutes = totalMinutes % 60;

    let timeString = '';
    if (days > 0) {
      timeString = `${days}d ${remHours}h`;
    } else if (hours > 0) {
      timeString = `${hours}h ${remMinutes}m`;
    } else {
      timeString = `${remMinutes}m`;
    }

    let text = '';
    if (c.status === 'RESOLVED') {
      text = isOverdue ? `Resolved (${timeString} late)` : 'Resolved within SLA';
    } else if (c.status === 'REJECTED') {
      text = 'Complaint Rejected';
    } else {
      text = isOverdue 
        ? `Overdue by ${timeString}` 
        : `Due in ${timeString}`;
    }

    return { isOverdue, text, deadline, diffMs };
  };

  // Performance Summary Data
  const totalAssigned = complaints.length;
  const resolvedComplaints = complaints.filter(c => c.status === 'RESOLVED');
  const totalResolved = resolvedComplaints.length;
  const overdueCount = complaints.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED' && getSLAInfo(c).isOverdue).length;

  const avgResolutionHours = totalResolved > 0
    ? (resolvedComplaints.reduce((acc, c) => {
        const start = new Date(c.created_at).getTime();
        const end = new Date(c.updated_at).getTime();
        return acc + (end - start);
      }, 0) / (totalResolved * 3600 * 1000)).toFixed(1)
    : 0;

  // Filtered & Sorted Queue
  const filteredComplaints = complaints.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.reference_id?.toLowerCase().includes(q) ||
      c.citizen_name?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.village_name?.toLowerCase().includes(q)
    );
  }).sort((a, b) => {
    if (sortBy === 'sla') {
      const slaA = getSLAInfo(a).diffMs;
      const slaB = getSLAInfo(b).diffMs;
      return slaA - slaB;
    }
    if (sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    if (sortBy === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at);
    }
    if (sortBy === 'priority') {
      const pOrder = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
      return pOrder[a.priority] - pOrder[b.priority];
    }
    return 0;
  });

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (newStatus === 'REJECTED' && !rejectionReason.trim()) {
      setModalError('Rejection reason is mandatory when rejecting a complaint.');
      return;
    }

    setModalError('');
    setModalLoading(true);

    try {
      // Step 1: Update Status
      await api.patch(`/complaints/${selectedComplaint.id}/status`, {
        status: newStatus,
        note: statusNote,
        rejection_reason: newStatus === 'REJECTED' ? rejectionReason : null
      });

      // Step 2: Upload Resolution Proof Photo if provided
      if (newStatus === 'RESOLVED' && proofFile) {
        const formData = new FormData();
        formData.append('file', proofFile);
        await api.post(`/complaints/${selectedComplaint.id}/resolution-proof`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowStatusModal(false);
      setSelectedComplaint(null);
      setProofFile(null);
      setProofPreview(null);
      fetchOfficerWorkQueue();
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Failed to update complaint status.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!fieldNote.trim()) return;

    setModalError('');
    setModalLoading(true);

    try {
      await api.post(`/complaints/${selectedComplaint.id}/notes`, {
        note_text: fieldNote
      });

      setShowNoteModal(false);
      setSelectedComplaint(null);
      setFieldNote('');
      fetchOfficerWorkQueue();
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Failed to submit field remark.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEscalate = async (e) => {
    e.preventDefault();
    if (!escalateReason.trim()) {
      setModalError('Please state the reason for escalation.');
      return;
    }

    setModalError('');
    setModalLoading(true);

    try {
      const formData = new FormData();
      formData.append('reason', escalateReason);
      await api.post(`/complaints/${selectedComplaint.id}/escalate`, formData);

      setShowEscalateModal(false);
      setSelectedComplaint(null);
      setEscalateReason('');
      fetchOfficerWorkQueue();
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Failed to escalate complaint.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 p-6 sm:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white px-3 py-1 rounded-full border border-white/20">
              Field Officer Work Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
              Work Queue & Task Management
            </h1>
            <p className="text-xs text-amber-100 mt-1 flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5" />
              Logged in as <strong>{user?.name}</strong> ({user?.village_id ? 'Assigned Field Officer' : 'Department Head'})
            </p>
          </div>

          <button
            onClick={() => setShowProfileModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs shadow-md border border-white/20 flex items-center gap-2 transition-all shrink-0 backdrop-blur-sm"
          >
            <UserCheck className="w-4 h-4 text-amber-300" />
            <span>View My Profile</span>
          </button>
        </div>
      </div>

      {/* Field Officer Profile Card Banner */}
      {user && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xl shadow-inner border border-amber-500/20">
                {user.name ? user.name.charAt(0) : 'O'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">{user.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/30">
                    VERIFIED OFFICER
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Panchayati Raj Field Staff • ID #{user.id}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>Full Profile Credentials</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Department</span>
              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate">{departments.find(d => d.id === user.department_id)?.name || 'General Field Dept'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Jurisdiction</span>
              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{villages.find(v => v.id === user.village_id)?.name || 'All Panchayat Villages'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email</span>
              <div className="font-mono text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Mobile</span>
              <div className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{user.mobile || '9111111111'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "My Performance" Summary Cards (Item 7 Requirement) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Total Assigned</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalAssigned}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Resolved Issues</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalResolved}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Avg Resolution</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{avgResolutionHours} <span className="text-xs font-normal text-slate-400">hrs</span></span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Overdue SLA</span>
            <span className={`text-2xl font-black ${overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {overdueCount}
            </span>
          </div>
        </div>
      </div>

      {/* Filter, Search & Work Queue */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-sm">
        
        {/* Controls Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            Assigned Work Queue ({filteredComplaints.length})
          </h3>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box (Item 7 Requirement) */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ref ID, citizen, title..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Sort Options (Item 7 Requirement) */}
            <div className="flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="sla">Sort by SLA Deadline / Overdue</option>
                <option value="newest">Sort by Newest First</option>
                <option value="oldest">Sort by Oldest First</option>
                <option value="priority">Sort by Priority</option>
              </select>
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">🚨 URGENT</option>
              <option value="HIGH">⚠️ HIGH</option>
              <option value="MEDIUM">📌 MEDIUM</option>
              <option value="LOW">🔹 LOW</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="">All Statuses</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Complaints Queue List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading work queue...</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">No complaints currently assigned matching your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredComplaints.map((c) => {
              const sla = getSLAInfo(c);
              return (
                <div
                  key={c.id}
                  className={`bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border transition-all space-y-3.5 relative ${
                    c.is_escalated ? 'border-amber-400 dark:border-amber-600/60 bg-amber-50/20' : 
                    sla.isOverdue && c.status !== 'RESOLVED' && c.status !== 'REJECTED' 
                      ? 'border-rose-300 dark:border-rose-800/70' 
                      : 'border-slate-200 dark:border-slate-700/70 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                          {c.reference_id}
                        </span>
                        {c.is_escalated && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-600 text-white animate-pulse">
                            🚨 ESCALATED TO ADMIN
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5 leading-snug">
                        {c.title}
                      </h4>
                    </div>
                    <StatusBadge priority={c.priority} />
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                    {c.description}
                  </p>

                  {/* SLA Countdown Badge (Item 7 Requirement) */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                      c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      sla.isOverdue ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse' :
                      'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                    }`}>
                      <Clock className="w-3.5 h-3.5" />
                      {sla.text}
                    </span>
                    <span className="text-[11px] text-slate-400">📍 {c.village_name}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
                    <StatusBadge status={c.status} />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setShowDetailModal(true);
                        }}
                        title="View Full Complaint Details"
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>

                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setShowNoteModal(true);
                          setModalError('');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" /> Remark
                      </button>

                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setNewStatus(c.status === 'ASSIGNED' ? 'IN_PROGRESS' : 'RESOLVED');
                          setShowStatusModal(true);
                          setModalError('');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        Status
                      </button>

                      {!c.is_escalated && c.status !== 'RESOLVED' && (
                        <button
                          onClick={() => {
                            setSelectedComplaint(c);
                            setShowEscalateModal(true);
                            setModalError('');
                          }}
                          title="Escalate to Admin"
                          className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Complaint Detail Modal (Item 7 Requirement) */}
      {showDetailModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  {selectedComplaint.reference_id}
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-snug">
                  {selectedComplaint.title}
                </h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Citizen Contact Information Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Citizen Contact Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="block text-slate-400 text-[10px]">Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedComplaint.citizen_name || 'Anonymous Citizen'}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px]">Mobile</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {selectedComplaint.citizen_mobile || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[10px]">Village</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-600" />
                    {selectedComplaint.village_name || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Complaint Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Issue Description</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl">
                {selectedComplaint.description}
              </p>
              {selectedComplaint.address_text && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
                  📍 Landmark / Address: {selectedComplaint.address_text}
                </p>
              )}
            </div>

            {/* Photos & Proof Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Citizen Uploaded Photo</h4>
                {selectedComplaint.photo_url ? (
                  <img
                    src={selectedComplaint.photo_url}
                    alt="Original Complaint Photo"
                    className="w-full h-36 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-full h-36 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                    No Photo Uploaded
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Officer Resolution Proof</h4>
                {selectedComplaint.resolution_proof_url ? (
                  <img
                    src={selectedComplaint.resolution_proof_url}
                    alt="Resolution Proof"
                    className="w-full h-36 object-cover rounded-xl border border-emerald-500"
                  />
                ) : (
                  <div className="w-full h-36 rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
                    Resolution Proof Not Attached Yet
                  </div>
                )}
              </div>
            </div>

            {/* Note & Remark History */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Inspection & Field Progress Notes</h4>
              {selectedComplaint.officer_notes?.length === 0 ? (
                <p className="text-xs text-slate-400">No field remarks added yet.</p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {selectedComplaint.officer_notes?.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-slate-800 text-xs space-y-0.5 border border-amber-200/60 dark:border-slate-700">
                      <div className="flex justify-between font-bold text-amber-900 dark:text-amber-200">
                        <span>{n.officer_name || 'Officer'}</span>
                        <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{n.note_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal (With Resolution Proof Upload - Item 7 Requirement) */}
      {showStatusModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Update Status ({selectedComplaint.reference_id})
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none"
                >
                  <option value="IN_PROGRESS">⚙️ IN PROGRESS</option>
                  <option value="RESOLVED">✅ RESOLVED</option>
                  <option value="REJECTED">❌ REJECTED</option>
                </select>
              </div>

              {newStatus === 'RESOLVED' && (
                <div className="space-y-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Attach Resolution Proof Photo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files[0];
                      if (f) {
                        setProofFile(f);
                        setProofPreview(URL.createObjectURL(f));
                      }
                    }}
                    className="text-xs text-slate-600 dark:text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700"
                  />
                  {proofPreview && (
                    <img src={proofPreview} alt="Proof Preview" className="w-16 h-16 rounded-lg object-cover border border-emerald-500 mt-2" />
                  )}
                </div>
              )}

              {newStatus === 'REJECTED' ? (
                <div>
                  <label className="block text-xs font-bold text-rose-600 mb-1">
                    Rejection Reason (Required) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="State reason why this complaint is invalid or duplicate..."
                    className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Update Remark
                  </label>
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="e.g., Replacement pipe delivered, work completed."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all"
              >
                {modalLoading ? 'Saving...' : 'Confirm Status Update'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Officer Note Modal */}
      {showNoteModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Add Field Work Remark ({selectedComplaint.reference_id})
              </h3>
              <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Field Progress Remark *
                </label>
                <textarea
                  rows={4}
                  required
                  value={fieldNote}
                  onChange={(e) => setFieldNote(e.target.value)}
                  placeholder="Describe field inspection details or repair progress (visible to Citizen and Admin)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md transition-all"
              >
                {modalLoading ? 'Posting Note...' : 'Save Field Remark'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Escalate to Admin Modal (Item 7 Requirement) */}
      {showEscalateModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Escalate Complaint to Admin ({selectedComplaint.reference_id})
              </h3>
              <button onClick={() => setShowEscalateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEscalate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Escalation Reason *
                </label>
                <textarea
                  rows={4}
                  required
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Explain why this complaint requires admin intervention (e.g. requires major budget approval, out of jurisdiction, specialized heavy machinery needed)..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-slate-800 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={modalLoading}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all"
              >
                {modalLoading ? 'Escalating...' : 'Confirm Escalation to Admin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Officer Full Profile Credentials Modal */}
      {showProfileModal && user && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Field Officer Profile Credentials</h3>
                  <p className="text-[11px] text-slate-500">Official Panchayati Raj Grievance System Identity</p>
                </div>
              </div>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Officer Identity Card Header */}
            <div className="bg-gradient-to-tr from-amber-600 to-amber-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 uppercase tracking-wider text-white border border-white/30">
                  STAFF ID #{user.id}
                </span>
                <span className="text-[11px] font-bold text-amber-200">State of Andhra Pradesh</span>
              </div>

              <div>
                <h4 className="text-xl font-black tracking-tight">{user.name}</h4>
                <p className="text-xs text-amber-100 mt-0.5">Assigned Field Officer • GramSetu E-Governance</p>
              </div>
            </div>

            {/* Profile Grid Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-slate-500 font-medium">Department</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {departments.find(d => d.id === user.department_id)?.name || 'General Field Dept'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-500 font-medium">Assigned Village</span>
                </div>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {villages.find(v => v.id === user.village_id)?.name || 'All Panchayat Villages'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-slate-500 font-medium">Official Email</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{user.email}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-slate-500 font-medium">Mobile Contact</span>
                </div>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{user.mobile || '9111111111'}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="text-slate-500 font-medium">Account Status</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Active Field Queue
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all"
              >
                Close Profile Credentials
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OfficerDashboard;
