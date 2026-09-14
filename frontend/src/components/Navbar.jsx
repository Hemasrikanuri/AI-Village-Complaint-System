import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Moon, Sun, LogOut, User, Shield, CheckCircle2, ChevronDown, Sparkles } from 'lucide-react';
import api from '../services/api';

const Navbar = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read');
    }
  };

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-50 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Name */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-primary-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 text-white font-black text-xl group-hover:scale-105 transition-transform">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight leading-none gradient-text-primary">
                  GramSetu
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  AI Active
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                Panchayat AI Grievance Platform
              </p>
            </div>
          </a>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">Notifications</span>
                      <span className="text-[10px] text-slate-400">{notifications.length} updates</span>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No notifications yet</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                              n.is_read ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400' : 'bg-primary-50/70 dark:bg-slate-800 font-medium text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <p className="leading-snug">{n.message}</p>
                            <span className="text-[10px] text-slate-400 block mt-1">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* User Profile / Logout */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden md:block text-right">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{user.name}</div>
                  <div className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold text-xs shadow-md shadow-primary-500/20 hover:bg-primary-700 transition-all"
              >
                Sign In
              </a>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
