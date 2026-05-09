import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './components/AuthContext';
import RoleGuard from './components/RoleGuard';
import Layout from './components/Layout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import DevTokens from './pages/DevTokens';

// Mentor Pages
import Dashboard from './pages/Dashboard';
import MarkAttendance from './pages/MarkAttendance';
import History from './pages/History';
import Materials from './pages/Materials';
import UploadCSV from './pages/UploadCSV';
import SearchResults from './pages/SearchResults';
import CustomCursor from './components/CustomCursor';

// Global style to hide default cursor
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    html, body, * {
      cursor: none !important;
    }
    a, button, [role="button"], input, select, textarea {
      cursor: none !important;
    }
  ` }} />
);
import Settings from './pages/Settings';

// Placeholders for Phase 4/5
const MyAttendance = () => <div className="text-display-lg text-white">My Attendance</div>;
const Upcoming = () => <div className="text-display-lg text-white">Upcoming Sessions</div>;
const StudentMaterials = () => <div className="text-display-lg text-white">Materials (Read-Only)</div>;

function App() {
  const { user, profile, loading } = useAuth();
  
  // Show the global loader whenever we are in a loading state
  // or if we have a user but their profile hasn't finished loading yet
  if (loading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-pink/10 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-neon-purple/10 rounded-full blur-[80px] animate-pulse"></div>

        <div className="flex flex-col items-center gap-8 relative z-10">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-2 border-white/5 rounded-full"></div>
            <div className="absolute inset-0 border-t-2 border-r-2 border-neon-pink rounded-full animate-spin shadow-[0_0_15px_rgba(255,0,122,0.5)]"></div>
            <div className="absolute inset-2 border-b-2 border-l-2 border-neon-blue rounded-full animate-[spin_1.5s_linear_infinite_reverse] opacity-70"></div>
            <div className="absolute inset-8 bg-neon-gradient rounded-full animate-pulse-slow shadow-[0_0_20px_rgba(157,0,255,0.4)]"></div>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="font-space font-bold text-3xl tracking-tighter mb-2">
              FORGE<span className="text-neon-pink">TRACK</span>
            </div>
            <div className="h-[1px] w-12 bg-white/10 mb-4"></div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-fg-tertiary font-bold animate-pulse">
              Initializing Core Modules
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalStyles />
      <CustomCursor />
      <Routes>
        <Route path="/" element={!user ? <Landing /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="/dev-tokens" element={<DevTokens />} />

        {/* Main App Routes */}
        <Route path="/" element={user ? <Layout /> : <Navigate to="/" />}>
          {/* Mentor Routes */}
          <Route path="dashboard" element={<RoleGuard allowedRoles={['mentor']}><Dashboard /></RoleGuard>} />
          <Route path="attendance" element={<RoleGuard allowedRoles={['mentor']}><MarkAttendance /></RoleGuard>} />
          <Route path="history" element={<RoleGuard allowedRoles={['mentor']}><History /></RoleGuard>} />
          <Route path="materials" element={<RoleGuard allowedRoles={['mentor']}><Materials /></RoleGuard>} />
          <Route path="upload" element={<RoleGuard allowedRoles={['mentor']}><UploadCSV /></RoleGuard>} />
          <Route path="search" element={<RoleGuard allowedRoles={['mentor']}><SearchResults /></RoleGuard>} />
          <Route path="settings" element={<RoleGuard allowedRoles={['mentor']}><Settings /></RoleGuard>} />

          {/* Student Routes */}
          <Route path="me/attendance" element={<RoleGuard allowedRoles={['student']}><MyAttendance /></RoleGuard>} />
          <Route path="me/upcoming" element={<RoleGuard allowedRoles={['student']}><Upcoming /></RoleGuard>} />
          <Route path="me/materials" element={<RoleGuard allowedRoles={['student']}><StudentMaterials /></RoleGuard>} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default App;
