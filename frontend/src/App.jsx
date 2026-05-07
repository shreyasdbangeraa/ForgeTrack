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
  const { user, role, loading } = useAuth();

  // Only show the global loader on the initial load when we don't have a user yet
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-space font-bold text-2xl tracking-tighter">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-neon-pink/20 border-t-neon-pink rounded-full animate-spin"></div>
          <div>FORGE<span className="text-neon-pink">TRACK</span></div>
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
