import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PlusCircle, Search, Map, BarChart3, ShieldAlert, FileSpreadsheet, Users, Wrench, Sparkles } from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const citizenNavs = [
    { to: '/citizen', label: 'My Complaints', icon: LayoutDashboard },
    { to: '/citizen/new', label: 'New Complaint', icon: PlusCircle },
    { to: '/track', label: 'Track Complaint', icon: Search },
  ];

  const officerNavs = [
    { to: '/officer', label: 'Assigned Work Queue', icon: Wrench },
    { to: '/track', label: 'Track Reference ID', icon: Search },
  ];

  const adminNavs = [
    { to: '/admin', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/admin/heatmap', label: 'Geospatial Heatmap', icon: Map },
    { to: '/admin/triage', label: 'AI Triage & Duplicates', icon: ShieldAlert },
    { to: '/admin/reports', label: 'Excel & PDF Reports', icon: FileSpreadsheet },
    { to: '/admin/management', label: 'User & Village Admin', icon: Users },
  ];

  let navItems = citizenNavs;
  if (role === 'OFFICER') navItems = officerNavs;
  if (role === 'ADMIN') navItems = adminNavs;

  return (
    <aside className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0 shadow-sm">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between px-3 mb-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {role} PORTAL
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/citizen' || item.to === '/admin' || item.to === '/officer'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                      isActive
                        ? 'btn-vibrant-primary text-white shadow-lg'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-indigo-600 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Panchayat Footer Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-emerald-500/10 border border-indigo-500/20 shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
          <span className="text-xs font-black text-slate-900 dark:text-white">GramSetu AI System</span>
        </div>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-snug">
          Panchayati Raj Grievance Network
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
