import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Lock, Phone, MapPin, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff, Check, X } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  
  const dropdownRef = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVillages();
  }, []);

  // Click outside handler for village dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    if (!searchQuery || searchQuery === selectedDisplayStr || searchQuery === "My village isn't listed") return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      v.name.toLowerCase().includes(q) || 
      v.district.toLowerCase().includes(q) ||
      (v.state && v.state.toLowerCase().includes(q))
    );
  });

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setVillageId('');
    if (isCustomVillage) {
      setIsCustomVillage(false);
      setPendingVillage('');
    }
    setShowDropdown(true);
  };

  const handleSelectVillage = (v) => {
    setVillageId(v.id);
    setSearchQuery(`${v.name} (${v.district})`);
    setIsCustomVillage(false);
    setPendingVillage('');
    setShowDropdown(false);
  };

  const handleSelectCustomVillage = () => {
    setIsCustomVillage(true);
    setVillageId('');
    setSearchQuery("My village isn't listed");
    setShowDropdown(false);
  };

  const handleClearVillage = () => {
    setSearchQuery('');
    setVillageId('');
    setIsCustomVillage(false);
    setPendingVillage('');
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field validations
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    let targetVillageId = villageId;

    // Auto-resolve typed village query to villageId if not selected via click
    if (!isCustomVillage && !targetVillageId && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const match = villages.find(v => 
        v.name.toLowerCase() === q ||
        `${v.name} (${v.district})`.toLowerCase() === q ||
        v.name.toLowerCase().includes(q)
      );
      if (match) {
        targetVillageId = match.id;
      }
    }

    if (isCustomVillage && !pendingVillage.trim()) {
      setError('Please enter your unlisted village name.');
      return;
    }

    if (!isCustomVillage && !targetVillageId) {
      setError('Please select your village from the list, or select "My village isn\'t listed".');
      return;
    }

    setLoading(true);
    try {
      const regEmail = email.trim().toLowerCase();
      await register({
        name: name.trim(),
        email: regEmail,
        password,
        mobile: cleanMobile,
        village_id: isCustomVillage ? null : parseInt(targetVillageId),
        pending_village_name: isCustomVillage ? pendingVillage.trim() : null,
        role: 'CITIZEN'
      });

      // Redirect to login with success message and pre-filled email
      navigate('/login', {
        state: {
          registeredEmail: regEmail,
          successMsg: 'Account created successfully! Please sign in with your credentials.'
        }
      });
    } catch (err) {
      console.error('Registration error:', err);
      let msg = 'Registration failed. Please check your connection and try again.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          msg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          msg = err.response.data.detail.map(item => item.msg || item.message).join(', ');
        }
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-auth-pattern relative overflow-hidden py-12">
      
      {/* Dynamic Animated Background Floating Glowing Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-3xl pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-10 right-1/4 w-64 h-64 rounded-full bg-blue-500/15 blur-2xl pointer-events-none animate-pulse-glow" />

      <div className="w-full max-w-lg glass-card rounded-3xl p-8 sm:p-10 space-y-6 shadow-2xl relative z-10 border border-white/50 dark:border-slate-800/80 shadow-indigo-500/10">
        
        {/* Navigation Link Back to Home */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Branding & Header */}
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
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                required
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile number (e.g. 9876543210)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Village Selector Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Select Village / Gram Panchayat</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 z-10" />
              <input
                type="text"
                required={!isCustomVillage}
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search and select your village..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearVillage}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {showDropdown && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-1 animate-fadeIn">
                  {loadingVillages ? (
                    <div className="px-3 py-4 text-xs text-slate-500 text-center animate-pulse flex items-center justify-center gap-2">
                      <span>⏳ Loading villages from database...</span>
                    </div>
                  ) : filteredVillages.length > 0 ? (
                    filteredVillages.map((v) => {
                      const isSelected = String(villageId) === String(v.id);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleSelectVillage(v)}
                          className={`w-full text-left px-3 py-2.5 text-xs rounded-xl font-medium flex justify-between items-center transition-colors ${
                            isSelected
                              ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1.5">
                              {v.name}
                              {isSelected && <Check className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold">{v.district}, {v.state}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-xs text-slate-400 text-center font-medium">
                      No matching villages found
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSelectCustomVillage}
                    className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl mt-1 border-t border-slate-100 dark:border-slate-700/80 flex items-center gap-2 transition-colors ${
                      isCustomVillage
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700/80'
                    }`}
                  >
                    <span>➕ My village isn't listed</span>
                  </button>
                </div>
              )}
            </div>

            {isCustomVillage && (
              <div className="mt-2.5 space-y-1 animate-fadeIn p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50">
                <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  Enter Unlisted Village Name (Will be reviewed by Panchayat Admin)
                </label>
                <input
                  type="text"
                  required
                  value={pendingVillage}
                  onChange={(e) => setPendingVillage(e.target.value)}
                  placeholder="e.g. Rampally Thanda"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium"
                />
              </div>
            )}
          </div>

          {/* Password Field with Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field with Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 outline-none transition-all ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-rose-400 focus:ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-primary-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 transition-colors"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1 font-semibold">
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Creating Account...' : (
              <>
                Create Citizen Account <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer & Login Navigation */}
        <div className="text-center pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-black hover:underline">
              Sign In
            </Link>
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Note: Field Officers & Panchayat Admins are registered directly by Platform Administrators.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Register;

