import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import MapPicker from '../components/MapPicker';
import { Upload, MapPin, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Navigation, LocateFixed, Loader2 } from 'lucide-react';

const NewComplaint = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [villageId, setVillageId] = useState('');
  const [villageSearch, setVillageSearch] = useState('');
  const [showVillageDropdown, setShowVillageDropdown] = useState(false);
  const [isCustomVillage, setIsCustomVillage] = useState(false);
  const [pendingVillage, setPendingVillage] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');

  const [addressText, setAddressText] = useState('');
  const [location, setLocation] = useState({ lat: 17.3850, lng: 78.4867 });
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [categories, setCategories] = useState([]);
  const [villages, setVillages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMeta();
  }, []);

  const fetchMeta = async () => {
    try {
      const [catRes, vilRes] = await Promise.all([
        api.get('/departments/categories'),
        api.get('/villages')
      ]);
      setCategories(catRes.data);
      if (catRes.data.length > 0) setCategoryId(catRes.data[0].id);

      setVillages(vilRes.data);

      // Default to citizen's profile village if available
      let defaultVil = null;
      if (user && user.village_id) {
        defaultVil = vilRes.data.find(v => v.id === user.village_id);
      }
      if (!defaultVil && vilRes.data.length > 0) {
        defaultVil = vilRes.data[0];
      }

      if (defaultVil) {
        setVillageId(defaultVil.id);
        setVillageSearch(`${defaultVil.name} (${defaultVil.district})`);
        if (defaultVil.latitude && defaultVil.longitude) {
          setLocation({ lat: defaultVil.latitude, lng: defaultVil.longitude });
        }
      }
    } catch (err) {
      console.error('Failed to load form metadata');
    }
  };

  const selectedVillage = villages.find(v => String(v.id) === String(villageId));
  const selectedDisplayStr = selectedVillage ? `${selectedVillage.name} (${selectedVillage.district})` : '';

  const filteredVillages = villages.filter(v => {
    if (!villageSearch || villageSearch === selectedDisplayStr) return true;
    const q = villageSearch.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.district.toLowerCase().includes(q) ||
      (v.state && v.state.toLowerCase().includes(q))
    );
  });

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please select manually on map.');
      return;
    }

    setError('');
    setDetectingLoc(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLocation({ lat, lng });

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`, {
            headers: {
              'User-Agent': 'GramSetu-App/1.0',
              'Accept-Language': 'en-US,en;q=0.9'
            }
          });
          const data = await res.json();
          if (data && data.display_name) {
            setAddressText(data.display_name);
          }
        } catch (err) {
          console.warn('Reverse geocoding error:', err);
        } finally {
          setDetectingLoc(false);
        }
      },
      (err) => {
        setDetectingLoc(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location permission denied. Please click on the map to pin your location manually.');
        } else {
          setError('Unable to detect location. Please click on the map to pin your location manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Photo file size exceeds maximum 5MB limit.');
      return;
    }

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      setError('Invalid photo format. Only JPG, PNG, WEBP files allowed.');
      return;
    }

    setError('');
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (description.length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }
    if (isCustomVillage && !pendingVillage.trim()) {
      setError('Please specify your unlisted village name.');
      return;
    }
    if (isCustomCategory && !customCategoryText.trim()) {
      setError('Please specify your custom category / problem type.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      const finalDesc = isCustomCategory 
        ? `[Custom Category: ${customCategoryText.trim()}]\n\n${description}`
        : description;
      formData.append('description', finalDesc);
      formData.append('category_id', categoryId);
      if (!isCustomVillage && villageId) {
        formData.append('village_id', villageId);
      }
      if (isCustomVillage && pendingVillage) {
        formData.append('address_text', `[Unlisted Village: ${pendingVillage.trim()}] ${addressText}`);
      } else if (addressText) {
        formData.append('address_text', addressText);
      }
      
      formData.append('latitude', location.lat);
      formData.append('longitude', location.lng);
      if (photo) formData.append('photo', photo);

      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate('/citizen');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Citizen Grievance Submission
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            Register New Civic Complaint
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Submit details, photo proof, and map pin. Our AI engine will auto-triage and assign the issue to your village field officer.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Searchable Village Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Village Location *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required={!isCustomVillage}
                  value={villageSearch}
                  onFocus={() => setShowVillageDropdown(true)}
                  onChange={(e) => {
                    setVillageSearch(e.target.value);
                    setIsCustomVillage(false);
                    setShowVillageDropdown(true);
                  }}
                  placeholder="Search and confirm village..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                />
                {showVillageDropdown && (
                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 p-1">
                    {filteredVillages.length > 0 ? (
                      filteredVillages.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setVillageId(v.id);
                            setVillageSearch(`${v.name} (${v.district})`);
                            setIsCustomVillage(false);
                            setShowVillageDropdown(false);
                            if (v.latitude && v.longitude) {
                              setLocation({ lat: v.latitude, lng: v.longitude });
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium flex justify-between items-center"
                        >
                          <span>{v.name === 'Vempa' ? 'Vempa (includes Komatitippa North & Srirampuram)' : v.name}</span>
                          <span className="text-[10px] text-slate-400">{v.district}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-slate-400">No matching village found</div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomVillage(true);
                        setVillageId('');
                        setVillageSearch("My village isn't listed");
                        setShowVillageDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg mt-1 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5"
                    >
                      <span>➕ My village isn't listed</span>
                    </button>
                  </div>
                )}
              </div>

              {isCustomVillage && (
                <div className="mt-2 space-y-1">
                  <input
                    type="text"
                    required
                    value={pendingVillage}
                    onChange={(e) => setPendingVillage(e.target.value)}
                    placeholder="Enter village name..."
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Complaint Category *
              </label>
              <select
                value={isCustomCategory ? 'OTHER' : categoryId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'OTHER') {
                    setIsCustomCategory(true);
                    const otherCat = categories.find(c => c.code === 'GENERAL_OTHER' || c.name.toLowerCase().includes('other'));
                    setCategoryId(otherCat ? otherCat.id : (categories[0]?.id || ''));
                  } else {
                    setIsCustomCategory(false);
                    setCategoryId(val);
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="OTHER">➕ Others / Unlisted Category</option>
              </select>

              {isCustomCategory && (
                <div className="mt-2 space-y-1">
                  <label className="block text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    Specify your issue / problem type *
                  </label>
                  <input
                    type="text"
                    required
                    value={customCategoryText}
                    onChange={(e) => setCustomCategoryText(e.target.value)}
                    placeholder="Enter your custom problem or issue category..."
                    className="w-full px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Complaint Subject / Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Burst water pipeline spilling onto Main Street near temple"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details about the problem, location landmarks, and urgency..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Address Text / Landmark (Optional)
            </label>
            <input
              type="text"
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="e.g., House No. 4-12, Opposite Sri Rama Temple"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {/* Leaflet Map Pin Selection with Auto-detect Location Button */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-600" />
                Pin Location on Map
              </label>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLoc}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-sm"
              >
                {detectingLoc ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting GPS Location...</span>
                  </>
                ) : (
                  <>
                    <LocateFixed className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>📍 Use My Current Location</span>
                  </>
                )}
              </button>
            </div>
            <MapPicker
              initialLat={location.lat}
              initialLng={location.lng}
              onLocationSelect={(pos) => setLocation(pos)}
            />
          </div>

          {/* Photo Evidence Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Upload Photo Evidence (JPG, PNG, WEBP - Max 5MB)
            </label>
            <div className="flex items-center gap-4">
              <label className="px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary-500 cursor-pointer bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 transition-colors">
                <Upload className="w-4 h-4 text-primary-600" />
                <span>{photo ? photo.name : 'Choose Image File'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
                />
              )}
            </div>
          </div>

          {/* AI Auto-Triage & Load Balancer Info Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary-50 to-emerald-50 dark:from-slate-800 dark:to-slate-800/80 border border-primary-200 dark:border-slate-700 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Automated AI Triage & Load Balancer</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Upon submitting, our system will automatically classify urgency, check for duplicate issues in your village, and route the complaint to the field officer with the minimum workload.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold text-xs shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Submitting & Classifying...' : (
              <>
                Submit Complaint to Panchayat <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default NewComplaint;
