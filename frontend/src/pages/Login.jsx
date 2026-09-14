import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight, User, Wrench, Shield, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const targetRole = searchParams.get('role')?.toUpperCase() || '';

  const [activeRole, setActiveRole] = useState(targetRole || 'CITIZEN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (targetRole) {
      setActiveRole(targetRole);
    }
  }, [targetRole]);

  // Handle automatic role switch if email contains officer/admin keywords
  const handleEmailChange = (val) => {
    setEmail(val);
    if (val.toLowerCase().includes('officer')) {
      setActiveRole('OFFICER');
    } else if (val.toLowerCase().includes('admin')) {
      setActiveRole('ADMIN');
    }
  };

  const handleRoleTabChange = (role) => {
    setActiveRole(role);
    setSearchParams({ role: role.toLowerCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'OFFICER') navigate('/officer');
      else navigate('/citizen');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid login credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleInfo = {
    CITIZEN: { label: 'Citizen Portal Login', icon: User, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    OFFICER: { label: 'Field Officer Portal Login', icon: Wrench, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    ADMIN: { label: 'Panchayat Admin Portal Login', icon: Shield, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }
  }[activeRole] || roleInfo?.CITIZEN;

  const showRegisterLink = activeRole !== 'OFFICER' && activeRole !== 'ADMIN' && targetRole !== 'OFFICER' && targetRole !== 'ADMIN';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-auth-pattern relative overflow-hidden">
      
      {/* Dynamic Animated Background Floating Glowing Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-10 right-1/4 w-64 h-64 rounded-full bg-blue-500/15 blur-2xl pointer-events-none animate-pulse-glow" />

      <div className="w-full max-w-md glass-card rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl relative z-10 border border-white/50 dark:border-slate-800/80 shadow-indigo-500/10">
        
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Branding Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary-600 to-emerald-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30">
            G
          </div>
          <h2 className="text-3xl font-black gradient-text-primary tracking-tight">
            GramSetu Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            Panchayat AI Grievance Platform
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleRoleTabChange('CITIZEN')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
              activeRole === 'CITIZEN'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Citizen</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('OFFICER')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
              activeRole === 'OFFICER'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Officer</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleTabChange('ADMIN')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1 ${
              activeRole === 'ADMIN'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Role Indicator Banner */}
        {roleInfo && (
          <div className={`p-3 rounded-2xl border ${roleInfo.bg} flex items-center justify-center gap-2 text-xs font-black ${roleInfo.color}`}>
            <roleInfo.icon className="w-4 h-4" />
            <span>{roleInfo.label}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder={activeRole === 'OFFICER' ? 'officer.water1@gramsetu.in' : activeRole === 'ADMIN' ? 'admin@gramsetu.in' : 'citizen1@gramsetu.in'}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/70 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl btn-vibrant-primary font-black text-xs flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In as {activeRole === 'OFFICER' ? 'Field Officer' : activeRole === 'ADMIN' ? 'Panchayat Admin' : 'Citizen'} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {showRegisterLink && (
          <div className="text-center pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-black hover:underline">
                Register as Citizen
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Login;
