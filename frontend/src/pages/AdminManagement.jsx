import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, UserPlus, MapPin, Building, AlertCircle, CheckCircle2, X } from 'lucide-react';

const AdminManagement = () => {
  const [users, setUsers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

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
            Manage Officers, Citizens, Panchayati Raj Departments, and Village Boundaries.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
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

      {/* Departments Grid */}
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Building className="w-4 h-4 text-indigo-600" />
          Active Panchayati Raj Departments ({departments.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {departments.map((d) => (
            <div key={d.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{d.name}</h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 uppercase">
                  {d.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-2">{d.description || 'Panchayat department'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Villages Grid */}
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-emerald-600" />
          Panchayat Registered Villages ({villages.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {villages.map((v) => (
            <div key={v.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">{v.name}</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{v.district}, {v.state}</p>
              <div className="mt-2 text-[11px] text-emerald-600 font-semibold">Pop: {v.population.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          Active Portal Accounts Directory ({users.length})
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading user directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3 px-3">Name</th>
                  <th className="pb-3 px-3">Email</th>
                  <th className="pb-3 px-3">Mobile</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Village</th>
                  <th className="pb-3 px-3">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono">{u.email}</td>
                    <td className="py-3 px-3 font-mono">{u.mobile || '-'}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'OFFICER' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">{villages.find(v => v.id === u.village_id)?.name || 'N/A'}</td>
                    <td className="py-3 px-3">{departments.find(d => d.id === u.department_id)?.name || 'N/A'}</td>
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
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Create New User / Field Officer</h3>
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
                  placeholder="officer@gramsetu.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
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
