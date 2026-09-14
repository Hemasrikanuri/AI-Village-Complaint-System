import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ComplaintHeatmap from '../components/ComplaintHeatmap';
import { Map, Filter, Layers } from 'lucide-react';

const AdminHeatmap = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    try {
      const res = await api.get('/admin/heatmap');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load geospatial heatmap');
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      
      {/* Header & Filter Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-primary-600" />
            Village Geospatial Complaint Heatmap
          </h2>
          <p className="text-xs text-slate-500">
            Interactive map displaying lat/lng pins of civic complaints across panchayat villages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="font-bold text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>
      </div>

      {/* Full-Height Leaflet Map Container */}
      <div className="flex-1 min-h-[450px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
            Loading map telemetry...
          </div>
        ) : (
          <ComplaintHeatmap complaints={filtered} />
        )}
      </div>

    </div>
  );
};

export default AdminHeatmap;
