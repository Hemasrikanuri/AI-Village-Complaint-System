import React from 'react';

const StatusBadge = ({ status, priority }) => {
  if (priority) {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-full bg-gradient-to-r from-rose-500/15 via-red-500/15 to-orange-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-500/10 backdrop-blur-sm animate-pulse-glow">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            🚨 URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            ⚠️ HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500/15 to-cyan-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            📌 MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            🔹 LOW
          </span>
        );
    }
  }

  if (status) {
    switch (status.toUpperCase()) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-indigo-500/15 to-blue-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            📥 SUBMITTED
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-violet-500"></span>
            👤 ASSIGNED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-spin"></span>
            ⚙️ IN PROGRESS
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-full bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ✅ RESOLVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-rose-500/15 to-red-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            ❌ REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  }

  return null;
};

export default StatusBadge;
