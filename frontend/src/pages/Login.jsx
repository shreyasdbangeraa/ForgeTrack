import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Database, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import BackgroundElements from '../components/BackgroundElements';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('mentor'); // 'mentor' or 'student'
  const { user } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    let loginEmail = email;
    if (activeTab === 'student' && !email.includes('@')) {
      loginEmail = `${email.toLowerCase()}@forge.local`;
    }
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError) throw authError;
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        // If profile doesn't exist yet, we check if it's a known mentor
        const isMentor = loginEmail === 'shreyas@gmail.com' || loginEmail === 'nischay@theboringpeople.in';
        const detectedRole = isMentor ? 'mentor' : 'student';
        
        if (detectedRole !== activeTab) {
          await supabase.auth.signOut();
          throw new Error(`This account is registered as a ${detectedRole}. Please use the correct login portal.`);
        }
      } else if (userData.role !== activeTab) {
        await supabase.auth.signOut();
        throw new Error(`This account is registered as a ${userData.role}. Please use the correct login portal.`);
      }

      // If sign in and role check are successful, force immediate redirect
      console.log("Authentication and role check successful, redirecting...");
      window.location.href = '/dashboard';
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Immediate redirect when user state is detected (e.g. from session)
  React.useEffect(() => {
    if (user) {
      console.log("User detected, redirecting to dashboard...");
      window.location.href = '/dashboard';
    }
  }, [user]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#050505] font-outfit overflow-hidden">
      <BackgroundElements />

      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-10 rounded-[2.5rem] neon-border shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <motion.div 
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="w-16 h-16 bg-neon-gradient rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(157,0,255,0.4)] mb-6"
            >
              <Database size={32} className="text-white" />
            </motion.div>
            
            {/* Role Switcher Tabs */}
            <div className="flex p-1 bg-white/5 rounded-2xl mb-8 w-full">
              <button 
                onClick={() => setActiveTab('mentor')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  activeTab === 'mentor' ? 'bg-neon-blue text-white shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 'text-fg-tertiary hover:text-white'
                }`}
              >
                Mentor Login
              </button>
              <button 
                onClick={() => setActiveTab('student')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  activeTab === 'student' ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(255,0,122,0.3)]' : 'text-fg-tertiary hover:text-white'
                }`}
              >
                Student Login
              </button>
            </div>

            <h1 className="text-3xl font-bold font-space tracking-tighter">
              {activeTab === 'mentor' ? 'Mentor Portal' : 'Student Access'}
            </h1>
            <p className="text-fg-secondary text-sm mt-2 text-center">
              {activeTab === 'mentor' 
                ? 'Authorized access only. Enter your mentor credentials.' 
                : 'Enter your student ID and access key to view your progress.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-fg-tertiary ml-1">Identity (Email)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-neon-blue transition-colors">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  placeholder="nischay@theboringpeople.in"
                  className="neon-input !pl-14"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-fg-tertiary ml-1">Access Key (Password)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-neon-pink transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="neon-input !pl-14"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-xs font-medium"
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary w-full h-14 flex items-center justify-center gap-3 text-lg group"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Authenticate
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <a href="#" className="text-xs font-bold text-neon-blue hover:text-white transition-colors uppercase tracking-widest">
              Forgot Access Key?
            </a>
          </div>
        </div>
        
        {/* Footer info */}
        <p className="mt-8 text-center text-fg-tertiary text-[10px] uppercase tracking-[0.2em]">
          Secure Terminal v1.0.4 // ForgeTrack Systems
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
