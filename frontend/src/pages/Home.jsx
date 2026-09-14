import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Wrench, Shield, ArrowRight, Sparkles, MapPin, CheckCircle2, Zap, Award } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to their role dashboard
  if (user) {
    if (user.role === 'ADMIN') navigate('/admin');
    else if (user.role === 'OFFICER') navigate('/officer');
    else navigate('/citizen');
  }

  const portals = [
    {
      role: 'CITIZEN',
      title: 'Citizen Portal',
      description: 'Lodge complaints, upload photos, and track village resolution in real-time.',
      icon: User,
      color: 'from-blue-600 to-indigo-600',
      glow: 'shadow-blue-500/20 hover:shadow-blue-500/30',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      borderColor: 'border-blue-200/80 dark:border-blue-800/60 hover:border-blue-500',
      btnClass: 'btn-vibrant-primary',
      path: '/login?role=CITIZEN',
      registerPath: '/register',
      features: ['Multi-Factor AI Triage Priority', 'Geospatial GPS Location Pinning', 'Instant Status Updates']
    },
    {
      role: 'OFFICER',
      title: 'Field Officer Portal',
      description: 'Access assigned department tasks, monitor SLA countdowns, and submit resolution proof.',
      icon: Wrench,
      color: 'from-amber-500 to-orange-600',
      glow: 'shadow-amber-500/20 hover:shadow-amber-500/30',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      borderColor: 'border-amber-200/80 dark:border-amber-800/60 hover:border-amber-500',
      btnClass: 'btn-vibrant-urgent',
      path: '/login?role=OFFICER',
      features: ['Personalized Workload Queue', 'SLA Urgency Countdown Timer', 'Photo Proof Resolution Upload']
    },
    {
      role: 'ADMIN',
      title: 'Panchayat Admin Portal',
      description: 'Panchayat Sarpanch & Executive overview with heatmaps and AI confidence audits.',
      icon: Shield,
      color: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/20 hover:shadow-emerald-500/30',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      borderColor: 'border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-500',
      btnClass: 'btn-vibrant-emerald',
      path: '/login?role=ADMIN',
      features: ['Executive Village Analytics', 'Geospatial Heatmap GIS View', 'AI Priority Override & Audit']
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 bg-mesh-pattern relative overflow-hidden">
      
      {/* Header Banner */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-primary-600 to-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
              G
            </div>
            <div>
              <span className="font-black text-xl tracking-tight block leading-none gradient-text-primary">
                GramSetu
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">
                Panchayat AI Grievance Platform
              </span>
            </div>
          </div>

          <Link
            to="/register"
            className="px-5 py-2.5 rounded-xl btn-vibrant-primary font-extrabold text-xs flex items-center gap-2"
          >
            <span>Register Citizen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 text-xs font-bold border border-primary-200 dark:border-primary-800">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Panchayati Raj E-Governance Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            GramSetu Portal Access
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Select your portal below to sign in to your GramSetu account. Citizens, field officers, and Panchayat administrators have dedicated entry points tailored to their workflow.
          </p>
        </div>

        {/* 3 Separate Login Entry Point Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.role}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border ${portal.borderColor} shadow-lg hover:shadow-xl transition-all flex flex-col justify-between space-y-6 group`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${portal.color} flex items-center justify-center text-white shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${portal.badgeColor}`}>
                      {portal.role}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                      {portal.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                      {portal.description}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {portal.features.map((feat, idx) => (
                      <li key={idx} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 pt-2">
                  <Link
                    to={portal.path}
                    className={`w-full py-3 rounded-xl bg-gradient-to-r ${portal.color} text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 group-hover:scale-[1.02] transition-all`}
                  >
                    <span>Proceed to {portal.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {portal.registerPath && (
                    <Link
                      to={portal.registerPath}
                      className="block text-center text-xs font-semibold text-slate-500 hover:text-primary-600 dark:text-slate-400 py-1"
                    >
                      Need a citizen account? Register here
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-8 border-t border-slate-200 dark:border-slate-800">
          GramSetu — AI-Based Village Complaint Management System
        </div>
      </main>
    </div>
  );
};

export default Home;
