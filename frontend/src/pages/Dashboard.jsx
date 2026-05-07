import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, Button } from '../components/ui/FuturisticUI';
import { 
  Calendar, 
  Users, 
  Activity, 
  Clock, 
  Plus, 
  BarChart2, 
  Zap,
  Shield,
  TrendingUp,
  ArrowUpRight,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <Card glowColor={color} className="flex flex-col gap-4">
    <div className={`w-12 h-12 rounded-2xl bg-neon-${color}/10 flex items-center justify-center text-neon-${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-fg-tertiary mb-1">{label}</p>
      <h3 className="text-3xl font-bold font-space tracking-tight">{value}</h3>
    </div>
    {trend && (
      <div className="flex items-center gap-1 text-[10px] font-bold text-success">
        <TrendingUp size={12} />
        <span>{trend}</span>
      </div>
    )}
  </Card>
);

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSessions: '-', avgAttendance: '-', activeStudents: '-', lastSessionDate: '-' });
  const [todaySessions, setTodaySessions] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const today = new Date().toLocaleDateString('en-CA');
      
      const [sessionsRes, studentsRes, allAttendanceRes] = await Promise.all([
        supabase.from('sessions').select('*').order('date', { ascending: false }),
        supabase.from('students').select('*').eq('is_active', true),
        supabase.from('attendance').select('*, students(name), sessions(topic)')
      ]);

      if (sessionsRes.error) console.error("Sessions fetch error:", sessionsRes.error);
      if (studentsRes.error) console.error("Students fetch error:", studentsRes.error);
      if (allAttendanceRes.error) console.error("Attendance fetch error:", allAttendanceRes.error);

      const sessions = sessionsRes.data || [];
      const students = studentsRes.data || [];
      const attendance = allAttendanceRes.data || [];

      console.log(`Fetched ${students.length} active students and ${sessions.length} sessions.`);

      const totalSessions = sessions.length;
      const activeStudents = students.length;
      const lastSession = sessions.filter(s => s.date <= today)[0];
      
      let avgAttendance = 0;
      if (attendance.length > 0) {
        const presentCount = attendance.filter(a => a.present).length;
        avgAttendance = Math.round((presentCount / attendance.length) * 100);
      }

      setStats({
        totalSessions,
        activeStudents,
        avgAttendance,
        lastSessionDate: lastSession ? new Date(lastSession.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '-'
      });

      setTodaySessions(sessions.filter(s => s.date === today));
      
      // Mock recent activity for visual flair
      setRecentActivity([
        { id: 1, desc: 'AI Logic mapped 45 students', time: '2 mins ago', type: 'ai' },
        { id: 2, desc: 'Attendance marked for System Design', time: '1 hour ago', type: 'manual' },
        { id: 3, desc: 'New database sync completed', time: '3 hours ago', type: 'system' }
      ]);
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="relative p-12 rounded-[3rem] overflow-hidden bg-white/5 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-neon-gradient opacity-10 blur-[100px]" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/20 mb-4"
            >
              <Zap size={14} className="text-neon-blue" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-neon-blue">Neural Core Active</span>
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-bold font-space tracking-tighter mb-4 leading-none">
              Welcome Back, <br />
              <span className="neon-text-pink">{profile?.display_name?.split(' ')[0] || 'Mentor'}</span>
            </h1>
            <p className="text-fg-secondary max-w-md">Your database is synced and all systems are operational. You have 3 pending reviews today.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <Button onClick={() => navigate('/attendance')} className="h-14 px-8">
                <Plus size={20} />
                Quick Mark
              </Button>
              <Button variant="secondary" onClick={() => navigate('/upload')} className="h-14 px-8">
                <Upload size={20} className="text-neon-blue" />
                Sync CSV
              </Button>
            </div>
            <button 
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Terminating session...");
                try {
                  await signOut();
                  window.location.href = '/'; // Hard redirect to Landing page as requested
                } catch (err) {
                  console.error("Logout failed:", err);
                  window.location.href = '/';
                }
              }}
              className="text-xs font-bold text-fg-tertiary hover:text-danger flex items-center justify-end gap-2 pr-4 transition-colors group cursor-pointer"
            >
              <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Calendar} label="Total Sessions" value={stats.totalSessions} trend="+12% from last month" color="blue" />
        <StatCard icon={Activity} label="Avg Attendance" value={`${stats.avgAttendance}%`} trend="+5% global" color="pink" />
        <StatCard icon={Users} label="Active Users" value={stats.activeStudents} trend="Stable" color="purple" />
        <StatCard icon={Clock} label="Last Session" value={stats.lastSessionDate} color="blue" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2" glowColor="blue">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neon-blue/10 text-neon-blue">
                <Calendar size={20} />
              </div>
              <h3 className="text-xl font-bold font-space tracking-tight">Today's Protocol</h3>
            </div>
            <button className="text-xs font-bold text-neon-blue hover:underline">View Schedule</button>
          </div>
          
          {todaySessions.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
              <p className="text-fg-tertiary mb-4">No active sessions detected for today.</p>
              <Button variant="secondary" onClick={() => navigate('/attendance')} size="sm">Schedule Now</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {todaySessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-dark-bg flex items-center justify-center text-neon-blue font-bold font-space border border-white/5">
                      {new Date(session.date).getDate()}
                    </div>
                    <div>
                      <h4 className="font-bold mb-1 group-hover:text-neon-blue transition-colors">{session.topic}</h4>
                      <p className="text-xs text-fg-tertiary">{session.session_type} • {session.duration_hours} Hours</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => navigate('/attendance')}>Initialize</Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Students List */}
        <Card glowColor="purple">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-neon-purple/10 text-neon-purple">
                <Users size={20} />
              </div>
              <h3 className="text-xl font-bold font-space tracking-tight">Sync Status</h3>
            </div>
            <button 
              onClick={() => navigate('/history')}
              className="text-xs font-bold text-neon-purple hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {stats.activeStudents === 0 ? (
              <p className="text-fg-tertiary text-center py-10">No students detected in database.</p>
            ) : (
              // We'll pass the students to a state and map them here
              // For now, showing the count and a CTA
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                <p className="text-3xl font-bold font-space mb-2">{stats.activeStudents}</p>
                <p className="text-xs text-fg-tertiary uppercase tracking-widest mb-6">Verified Identities</p>
                <Button variant="secondary" className="w-full" onClick={() => navigate('/history')}>
                  Browse Student Profiles
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Activity Log */}
        <Card glowColor="pink">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-neon-pink/10 text-neon-pink">
              <Activity size={20} />
            </div>
            <h3 className="text-xl font-bold font-space tracking-tight">System Logs</h3>
          </div>
          
          <div className="space-y-6">
            {recentActivity.map(act => (
              <div key={act.id} className="flex gap-4 relative">
                <div className="w-[1px] h-full absolute left-[7px] top-4 bg-white/5" />
                <div className={`w-4 h-4 rounded-full mt-1 shrink-0 ${
                  act.type === 'ai' ? 'bg-neon-blue' : act.type === 'manual' ? 'bg-neon-pink' : 'bg-neon-purple'
                } shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                <div>
                  <p className="text-sm font-medium mb-1">{act.desc}</p>
                  <p className="text-[10px] uppercase tracking-widest text-fg-tertiary font-bold">{act.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="secondary" className="w-full mt-8">View Full Log</Button>
        </Card>
      </div>
    </div>
  );
}

const Upload = ({ className, size }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
