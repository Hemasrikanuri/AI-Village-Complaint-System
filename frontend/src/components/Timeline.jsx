import React from 'react';
import StatusBadge from './StatusBadge';
import { CheckCircle2, Clock, FileText, User, AlertCircle, AlertTriangle } from 'lucide-react';

const Timeline = ({ complaint }) => {
  if (!complaint) return null;

  const { status, status_history = [], officer_notes = [], rejection_reason } = complaint;

  // Determine current active step (0: Submitted, 1: Assigned, 2: In Progress, 3: Resolved/Rejected)
  const getStepIndex = (st) => {
    switch (st) {
      case 'SUBMITTED': return 0;
      case 'ASSIGNED': return 1;
      case 'IN_PROGRESS': return 2;
      case 'RESOLVED':
      case 'REJECTED': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);
  const isRejected = status === 'REJECTED';

  const steps = [
    { label: 'Submitted', desc: 'Complaint registered' },
    { label: 'Assigned', desc: complaint.assigned_officer_name ? `Assigned to ${complaint.assigned_officer_name}` : 'Pending assignment' },
    { label: 'In Progress', desc: 'Field officer work initiated' },
    { label: isRejected ? 'Rejected' : 'Resolved', desc: isRejected ? 'Complaint rejected' : 'Work verified & closed' }
  ];

  return (
    <div className="space-y-8">
      {/* Visual Stepper Header */}
      <div className="relative">
        <div className="overflow-hidden h-2 mb-6 text-xs flex rounded bg-slate-200 dark:bg-slate-700">
          <div
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${
              isRejected ? 'bg-rose-500' : 'bg-primary-600'
            }`}
          ></div>
        </div>
        <div className="grid grid-cols-4 text-center">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    isCurrent
                      ? isRejected ? 'bg-rose-500 text-white ring-4 ring-rose-100 dark:ring-rose-950' : 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-950'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                  {step.label}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[90px] hidden sm:block">
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejection Reason Alert if applicable */}
      {isRejected && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Complaint Rejection Notice</h4>
            <p className="text-xs mt-1 leading-relaxed">{rejection_reason || 'Rejection details provided in timeline notes.'}</p>
          </div>
        </div>
      )}

      {/* Field Officer Progress Notes Section */}
      {officer_notes.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-primary-600" />
            Field Inspection & Progress Remarks ({officer_notes.length})
          </h4>
          <div className="space-y-3">
            {officer_notes.map((note) => (
              <div key={note.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3 h-3 text-primary-500" /> {note.officer_name || 'Officer'}
                  </span>
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-1">{note.note_text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Audit History Log */}
      <div>
        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary-600" />
          Status Log & Audit History
        </h4>
        <div className="border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6 pl-5">
          {status_history.map((h) => (
            <div key={h.id} className="relative">
              <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-primary-600 ring-4 ring-white dark:ring-slate-900"></div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StatusBadge status={h.status} />
                <span className="text-xs text-slate-400">
                  {new Date(h.timestamp).toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  by {h.changed_by_name || 'System'}
                </span>
              </div>
              {h.note && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs mt-1">
                  {h.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
