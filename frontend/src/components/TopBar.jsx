import React, { useState, useRef, useEffect } from 'react';
import { Search, LogOut, User, Bell, ChevronDown } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPath = pathParts.length > 0 
    ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() + pathParts[pathParts.length - 1].slice(1)
    : 'Dashboard';

  return (
    <header className="h-20 glass-card border-b border-white/5 flex items-center justify-between px-8 z-30 sticky top-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center text-fg-secondary text-sm font-medium">
          <span className="hover:text-white transition-colors cursor-pointer">Overview</span>
          <span className="mx-2 opacity-30">/</span>
          <span className="text-white font-bold tracking-tight">{currentPath}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group hidden md:block">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-neon-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Search database..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-64 bg-white/5 border border-white/5 rounded-2xl py-2 pl-10 pr-4 outline-none focus:border-neon-blue/30 focus:ring-4 focus:ring-neon-blue/5 transition-all text-sm"
          />
        </div>

        <div className="h-8 w-[1px] bg-white/10 hidden md:block" />

        <div className="flex items-center gap-4">
          <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-95 group">
            <Bell size={18} className="text-fg-secondary group-hover:text-white transition-colors" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-neon-pink rounded-full shadow-[0_0_8px_rgba(255,0,122,0.8)]" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95 group"
            >
              <div className="w-8 h-8 rounded-xl bg-neon-gradient p-[1px] shadow-[0_0_10px_rgba(157,0,255,0.2)]">
                <div className="w-full h-full rounded-[inherit] bg-dark-bg flex items-center justify-center text-sm font-bold font-space">
                  {profile?.display_name?.[0] || 'U'}
                </div>
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold leading-none mb-0.5">{profile?.display_name || 'User'}</div>
                <div className="text-[9px] uppercase tracking-widest text-fg-tertiary font-bold leading-none">{profile?.role || 'Mentor'}</div>
              </div>
              <ChevronDown size={14} className={`text-fg-tertiary transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-56 glass-card rounded-2xl border border-white/10 p-2 shadow-2xl z-50 backdrop-blur-2xl"
                >
                  <div className="px-4 py-3 border-b border-white/5 mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-fg-tertiary font-bold mb-1">Identity</p>
                    <p className="text-xs font-medium truncate">{user?.email}</p>
                  </div>
                  
                  <button 
                    onClick={async () => {
                      await signOut();
                      window.location.href = '/';
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-danger hover:bg-danger/10 rounded-xl transition-all group"
                  >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-bold">Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
