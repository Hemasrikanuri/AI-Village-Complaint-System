import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, UserPlus, MapPin, Building, AlertCircle, CheckCircle2, X, Search, Shield, RefreshCw, UserCheck, Briefcase } from 'lucide-react';

const AdminManagement = () => {
  const [users, setUsers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [villageFilter, setVillageFilter] = useState('ALL');

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('officer123');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('OFFICER');
  const [villageId, setVillageId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, vRes, dRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/villages'),
        api.get('/departments')
      ]);
      setUsers(uRes.data);
      setVillages(vRes.data);
      setDepartments(dRes.data);

      if (vRes.data.length > 0) setVillageId(vRes.data[0].id);
      if (dRes.data.length > 0) setDepartmentId(dRes.data[0].id);
    } catch (err) {
      console.error('Failed to load management data');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOfficers = async () => {
    setSyncLoading(true);
    setSyncMessage('');
    try {
      const res = await api.post('/admin/users/seed-officers');
      setSyncMessage(res.data?.message || 'Field officers roster synchronized successfully!');
      fetchData();
    } catch (err) {
      setSyncMessage('Failed to sync officers.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      await api.post('/admin/users', {
        name,
        email,
        password,
        mobile,
        role,
        village_id: villageId ? parseInt(villageId) : null,
        department_id: role === 'OFFICER' && departmentId ? parseInt(departmentId) : null
      });

      setShowAddUserModal(false);
      setName('');
      setEmail('');
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setFormLoading(false);
    }
  };

  // New Department Form State
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [deptFormError, setDeptFormError] = useState('');
  const [deptFormLoading, setDeptFormLoading] = useState(false);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    setDeptFormError('');
    setDeptFormLoading(true);

    try {
      await api.post('/departments', {
        name: deptName,
        code: deptCode.toUpperCase(),
        description: deptDesc
      });

      setShowAddDeptModal(false);
      setDeptName('');
      setDeptCode('');
      setDeptDesc('');
      fetchData();
    } catch (err) {
      setDeptFormError(err.response?.data?.detail || 'Failed to create department');
    } finally {
      setDeptFormLoading(false);
    }
  };

  // Compute officer stats
  const officers = users.filter(u => u.role === 'OFFICER');
  const citizens = users.filter(u => u.role === 'CITIZEN');
  const admins = users.filter(u => u.role === 'ADMIN');

  // Filtered users list
  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (deptFilter !== 'ALL' && String(u.department_id) !== String(deptFilter)) return false;
    if (villageFilter !== 'ALL' && String(u.village_id) !== String(villageFilter)) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const nameMatch = u.name.toLowerCase().includes(q);
      const emailMatch = u.email.toLowerCase().includes(q);
      const mobMatch = u.mobile && u.mobile.includes(q);
      return nameMatch || emailMatch || mobMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Panchayat User, Department & Village Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Field Officers, Citizens, Panchayati Raj Departments, and Village Boundaries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={handleSyncOfficers}
            disabled={syncLoading}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Auto-provision field officers across all departments & villages"
          >
            <RefreshCw className={`w-4 h-4 ${syncLoading ? 'animate-spin' : ''}`} />
            {syncLoading ? 'Syncing...' : 'Sync Officer Roster'}
          </button>
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <Building className="w-4 h-4" /> Add Department
          </button>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="px-3.5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add Officer / User
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage('')} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Headcount Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{officers.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Field Officers</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{departments.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Depts</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{villages.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Covered Villages</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{users.length}</div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Accounts</div>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Building className="w-4 h-4 text-indigo-600" />
          Active Panchayati Raj Departments ({departments.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((d) => {
            const deptOfficerCount = officers.filter(o => o.department_id === d.id).length;
            return (
              <div key={d.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">{d.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 uppercase">
                    {d.code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2">{d.description || 'Panchayat department'}</p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Staff Headcount:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{deptOfficerCount} Field Officers</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Villages Grid */}
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-emerald-600" />
          Panchayat Registered Villages ({villages.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {villages.map((v) => {
            const vilOfficerCount = officers.filter(o => o.village_id === v.id).length;
            return (
              <div key={v.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{v.name}</h4>
                <p className="text-[10px] text-slate-500">{v.district}, {v.state}</p>
                <div className="pt-1 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-600 font-semibold">Pop: {v.population.toLocaleString()}</span>
                  <span className="font-bold text-slate-600 dark:text-slate-300">{vilOfficerCount} Officers</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Active Portal Accounts Directory ({filteredUsers.length} of {users.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Filter accounts by role, department, or assigned village.</p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name/email/phone..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none w-48 text-xs"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none text-xs"
            >
              <option value="ALL">All Roles ({users.length})</option>
              <option value="OFFICER">Officers ({officers.length})</option>
              <option value="CITIZEN">Citizens ({citizens.length})</option>
              <option value="ADMIN">Admins ({admins.length})</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none text-xs"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={villageFilter}
              onChange={(e) => setVillageFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none text-xs"
            >
              <option value="ALL">All Villages</option>
              {villages.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading user directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 font-medium">
            No portal accounts match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Name</th>
                  <th className="pb-3 px-3">Email & Credentials</th>
                  <th className="pb-3 px-3">Mobile</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3 px-3">Assigned Village</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono">{u.email}</td>
                    <td className="py-3 px-3 font-mono">{u.mobile || '-'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300' :
                        u.role === 'OFFICER' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300' : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {departments.find(d => d.id === u.department_id)?.name || (u.role === 'OFFICER' ? 'Unassigned' : 'N/A')}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      {villages.find(v => v.id === u.village_id)?.name || 'All Villages'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create New Field Officer / Portal Account</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Officer Name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer.dept@gramsetu.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9123456789"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold outline-none"
                >
                  <option value="OFFICER">OFFICER (Field Staff)</option>
                  <option value="CITIZEN">CITIZEN</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {role === 'OFFICER' && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department *</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Village</label>
                <select
                  value={villageId}
                  onChange={(e) => setVillageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                >
                  <option value="">None / All Villages</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-md transition-all mt-2"
              >
                {formLoading ? 'Creating User...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create New Panchayati Raj Department</h3>
              <button onClick={() => setShowAddDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {deptFormError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deptFormError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Agriculture & Irrigation"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Unique Code *</label>
                <input
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. AGRI"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Responsibilities and scope of this department..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={deptFormLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition-all mt-2"
              >
                {deptFormLoading ? 'Adding Department...' : 'Create Department'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminManagement;
