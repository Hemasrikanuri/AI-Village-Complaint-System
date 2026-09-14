import React, { useState } from 'react';
import api from '../services/api';
import { FileSpreadsheet, FileText, Download, Filter, CheckCircle2, Sparkles } from 'lucide-react';

const AdminReports = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      let url = '/reports/excel?';
      if (statusFilter) url += `status_filter=${statusFilter}&`;
      if (priorityFilter) url += `priority_filter=${priorityFilter}&`;

      const response = await api.get(url, { responseType: 'blob' });
      
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `GramSetu_Complaints_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download Excel report');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      let url = '/reports/pdf?';
      if (statusFilter) url += `status_filter=${statusFilter}&`;
      if (priorityFilter) url += `priority_filter=${priorityFilter}&`;

      const response = await api.get(url, { responseType: 'blob' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `GramSetu_Complaints_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-primary-800 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            Official E-Governance Auditing
          </span>
          <h1 className="text-2xl font-extrabold">Executive Reports & Data Export</h1>
          <p className="text-xs text-emerald-100 max-w-xl">
            Generate and download dynamically computed Excel spreadsheets (.xlsx) and formatted PDF summary documents for Sarpanch meeting audits.
          </p>
        </div>
      </div>

      {/* Export Controls Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
        
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            Configure Export Filters
          </h3>
          <p className="text-xs text-slate-500 mt-1">Select filters to narrow down generated records.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Filter by Complaint Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold outline-none"
            >
              <option value="">All Statuses (Full Log)</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Filter by Urgency Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold outline-none"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">🚨 URGENT</option>
              <option value="HIGH">⚠️ HIGH</option>
              <option value="MEDIUM">📌 MEDIUM</option>
              <option value="LOW">🔹 LOW</option>
            </select>
          </div>
        </div>

        {/* Download Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
          
          {/* Excel Export Card */}
          <div className="bg-emerald-50/60 dark:bg-slate-800/60 p-6 rounded-2xl border border-emerald-200 dark:border-slate-700 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Excel Spreadsheet (.xlsx)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Raw data table with OpenPyXL formatting, headers, status columns, and officer workloads.
              </p>
            </div>
            <button
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              {downloadingExcel ? 'Generating .xlsx...' : 'Download Excel Report'}
            </button>
          </div>

          {/* PDF Export Card */}
          <div className="bg-primary-50/60 dark:bg-slate-800/60 p-6 rounded-2xl border border-primary-200 dark:border-slate-700 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center mx-auto shadow-md shadow-primary-600/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">PDF Executive Summary (.pdf)</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                ReportLab styled PDF document formatted for official printing and Sarpanch review meetings.
              </p>
            </div>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              {downloadingPdf ? 'Generating .pdf...' : 'Download PDF Summary'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminReports;
