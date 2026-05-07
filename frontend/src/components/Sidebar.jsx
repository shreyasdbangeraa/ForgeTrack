import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BookOpen, 
  Upload, 
  UserCheck, 
  Calendar, 
  Settings, 
  LogOut,
  Database,
  ChevronRight
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const { role, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  const navItemClass = ({ isActive }) => {
    return `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative
      ${isActive 
        ? 'bg-neon-gradient text-white shadow-[0_0_20px_rgba(255,0,122,0.3)]' 
        : 'text-fg-secondary hover:bg-white/5 hover:text-white'}
    `;
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to} className={navItemClass}>
      <Icon size={20} className="relative z-10" />
      <span className="font-medium tracking-tight relative z-10">{label}</span>
      <ChevronRight className="ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" size={16} />
    </NavLink>
  );

  return (
    <div className="flex flex-col w-full h-full glass-card border-r border-white/5 relative z-20">
      {/* Brand */}
      <div className="p-8 flex items-center gap-3">
        <motion.div 
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 1 }}
          className="w-10 h-10 bg-neon-gradient rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,0,122,0.4)]"
        >
          <Database size={24} className="text-white" />
        </motion.div>
        <span className="text-xl font-bold font-space tracking-tighter">FORGE<span className="text-neon-pink">TRACK</span></span>
      </div>

      <div className="h-px bg-white/5 mx-6 mb-6"></div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {role === 'mentor' && (
          <>
            <div className="text-[10px] uppercase tracking-[0.2em] text-fg-tertiary font-bold mb-4 ml-4">Main Core</div>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

            <div className="text-[10px] uppercase tracking-[0.2em] text-fg-tertiary font-bold mb-4 mt-8 ml-4">Activity</div>
            <NavItem to="/attendance" icon={CheckSquare} label="Mark Attendance" />
            <NavItem to="/history" icon={Users} label="Student History" />
            <NavItem to="/materials" icon={BookOpen} label="Materials" />

            <div className="text-[10px] uppercase tracking-[0.2em] text-fg-tertiary font-bold mb-4 mt-8 ml-4">Data System</div>
            <NavItem to="/upload" icon={Upload} label="Upload CSV" />
          </>
        )}

        {role === 'student' && (
          <>
            <div className="text-[10px] uppercase tracking-[0.2em] text-fg-tertiary font-bold mb-4 ml-4">My Core</div>
            <NavItem to="/me/attendance" icon={UserCheck} label="Attendance" />
            <NavItem to="/me/upcoming" icon={Calendar} label="Schedule" />
            
            <div className="text-[10px] uppercase tracking-[0.2em] text-fg-tertiary font-bold mb-4 mt-8 ml-4">Resources</div>
            <NavItem to="/me/materials" icon={BookOpen} label="Materials" />
          </>
        )}
      </nav>

      {/* Account Section */}
      <div className="p-4 mt-auto border-t border-white/5">
        <NavItem to="/settings" icon={Settings} label="Settings" />
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl text-fg-secondary hover:bg-danger/10 hover:text-danger transition-all duration-300 group mt-2"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
