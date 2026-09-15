import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Lock, Phone, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [villageId, setVillageId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomVillage, setIsCustomVillage] = useState(false);
  const [pendingVillage, setPendingVillage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [villages, setVillages] = useState([]);
  const [loadingVillages, setLoadingVillages] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVillages();
  }, []);

  const fetchVillages = async () => {
    setLoadingVillages(true);
    try {
      const res = await api.get('/villages');
      setVillages(res.data);
    } catch (err) {
      console.error('Failed to load villages', err);
    } finally {
      setLoadingVillages(false);
    }
  };

  const selectedVillage = villages.find(v => String(v.id) === String(villageId));
  const selectedDisplayStr = selectedVillage ? `${selectedVillage.name} (${selectedVillage.district})` : '';

  const filteredVillages = villages.filter(v => {
    if (!searchQuery || searchQuery === selectedDisplayStr) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) || 
      v.district.toLowerCase().includes(q) ||
      (v.state && v.state.toLowerCase().includes(q))
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isCustomVillage && !pendingVillage.trim()) {
      setError('Please type your village name.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        mobile,
        village_id: isCustomVillage ? null : (villageId ? parseInt(villageId) : null),
        pending_village_name: isCustomVillage ? pendingVillage.trim() : null,
        role: 'CITIZEN'
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-auth-pattern relative overflow-hidden">
      
      {/* Dynamic Animated Background Floating Glowing Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-10 right-1/4 w-64 h-64 rounded-full bg-blue-500/15 blur-2xl pointer-events-none animate-pulse-glow" />

      <div className="w-full max-w-lg glass-card rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl relative z-10 border border-white/50 dark:border-slate-800/80 shadow-indigo-500/10">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary-600 to-emerald-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-500/30">
            G
          </div>
          <h2 className="text-3xl font-black gradient-text-primary tracking-tight">
            Citizen Registration
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            Register to submit & track village complaints
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Kumar"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@gmail.com"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Village</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 z-10" />
              <input
                type="text"
                required={!isCustomVillage}
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsCustomVillage(false);
                  setPendingVillage('');
                  setShowDropdown(true);
                }}
                placeholder="Search and select your village..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 outline-none"
              />
              {showDropdown && (
                <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 p-1">
                  {loadingVillages ? (
                    <div className="px-3 py-3 text-xs text-slate-500 text-center animate-pulse flex items-center justify-center gap-2">
                      <span>⏳ Loading villages from server...</span>
                    </div>
                  ) : filteredVillages.length > 0 ? (
                    filteredVillages.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setVillageId(v.id);
                          setSearchQuery(`${v.name} (${v.district})`);
                          setIsCustomVillage(false);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium flex justify-between items-center"
                      >
                        <span>{v.name === 'Vempa' ? 'Vempa (includes Komatitippa North & Srirampuram)' : v.name}</span>
                        <span className="text-[10px] text-slate-400">{v.district}, {v.state}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-400 text-center">
                      No matching villages found
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomVillage(true);
                      setVillageId('');
                      setSearchQuery("My village isn't listed");
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg mt-1 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5"
                  >
                    <span>➕ My village isn't listed</span>
                  </button>
                </div>
              )}
            </div>

            {isCustomVillage && (
              <div className="mt-2.5 space-y-1 animate-fadeIn">
                <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  Enter Unlisted Village Name (Will be reviewed by Panchayat Admin)
                </label>
                <input
                  type="text"
                  required
                  value={pendingVillage}
                  onChange={(e) => setPendingVillage(e.target.value)}
                  placeholder="e.g. Rampally Thanda"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-xs shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Registering...' : (
              <>
                Create Citizen Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
