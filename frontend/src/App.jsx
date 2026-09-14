import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import NewComplaint from './pages/NewComplaint';
import TrackComplaint from './pages/TrackComplaint';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminHeatmap from './pages/AdminHeatmap';
import AdminTriageAudit from './pages/AdminTriageAudit';
import AdminReports from './pages/AdminReports';
import AdminManagement from './pages/AdminManagement';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-xs text-slate-400">Authenticating session...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'OFFICER') return <Navigate to="/officer" replace />;
    return <Navigate to="/citizen" replace />;
  }
  return children;
};

const MainLayout = ({ children, darkMode, setDarkMode }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) return children;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('gramsetu_theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gramsetu_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gramsetu_theme', 'light');
    }
  }, [darkMode]);

  return (
    <MainLayout darkMode={darkMode} setDarkMode={setDarkMode}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen Routes */}
        <Route path="/citizen" element={
          <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
            <CitizenDashboard />
          </ProtectedRoute>
        } />
        <Route path="/citizen/new" element={
          <ProtectedRoute allowedRoles={['CITIZEN', 'ADMIN']}>
            <NewComplaint />
          </ProtectedRoute>
        } />

        {/* Officer Routes */}
        <Route path="/officer" element={
          <ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']}>
            <OfficerDashboard />
          </ProtectedRoute>
        } />

        {/* Track Complaint (All Authenticated Users) */}
        <Route path="/track" element={
          <ProtectedRoute>
            <TrackComplaint />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/heatmap" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminHeatmap />
          </ProtectedRoute>
        } />
        <Route path="/admin/triage" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminTriageAudit />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminReports />
          </ProtectedRoute>
        } />
        <Route path="/admin/management" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminManagement />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
