import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  User, 
  Mail, 
  BookOpen,
  Filter,
  ChevronRight
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';

export default function History() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('students').select('*').order('name');
    if (data) {
      setStudents(data);
      setFilteredStudents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const filtered = students.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.usn.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const handleStudentSelect = async (student) => {
    setSelectedStudent(student);
    setHistoryLoading(true);
    
    const { data } = await supabase
      .from('attendance')
      .select('*, sessions(*)')
      .eq('student_id', student.id)
      .order('sessions(date)', { ascending: false });

    if (data) {
      const sorted = data.sort((a, b) => new Date(b.sessions?.date) - new Date(a.sessions?.date));
      setAttendanceRecords(sorted);
    }
    setHistoryLoading(false);
  };

  const calcStats = () => {
    if (!attendanceRecords.length) return { present: 0, total: 0, pct: 0, streak: 0 };
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(a => a.present).length;
    const pct = Math.round((present / total) * 100);
    
    let streak = 0;
    for (let a of attendanceRecords) {
      if (a.present) streak++;
      else break;
    }
    return { present, total, pct, streak };
  };

  const stats = calcStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-neon-pink/20 border-t-neon-pink rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-4 pb-12 px-4 md:px-8 max-w-[1600px] mx-auto overflow-hidden">
      <AnimatePresence mode="wait">
        {!selectedStudent ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-display-lg font-bold font-space tracking-tighter mb-2">
                  Student <span className="neon-text-blue">Intelligence</span>
                </h1>
                <p className="text-fg-tertiary uppercase tracking-[0.3em] text-[10px] font-bold">Forge Database // {students.length} Identities Verified</p>
              </div>

              <div className="relative group w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary group-focus-within:text-neon-blue transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search USN or Name..."
                  className="neon-input !pl-12 !h-14 !rounded-2xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Student Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStudents.map((student, idx) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleStudentSelect(student)}
                  className="group cursor-pointer"
                >
                  <Card glowColor="blue" className="h-full hover:border-neon-blue/30 transition-all duration-500">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue group-hover:bg-neon-blue group-hover:text-white transition-all duration-500">
                        <User size={24} />
                      </div>
                      <Pill className="text-[10px] uppercase font-bold tracking-widest bg-white/5">{student.branch_code}</Pill>
                    </div>
                    <h3 className="text-xl font-bold font-space tracking-tight mb-1 group-hover:text-neon-blue transition-colors">{student.name}</h3>
                    <p className="text-xs font-mono text-fg-tertiary mb-6">{student.usn}</p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase tracking-widest text-fg-tertiary font-bold mb-1">Status</span>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${student.is_active ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-danger'}`} />
                          <span className="text-xs font-medium">{student.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-neon-blue group-hover:text-white transition-all duration-500">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredStudents.length === 0 && (
              <div className="py-24 text-center">
                <Search size={48} className="mx-auto text-fg-tertiary opacity-20 mb-4" />
                <h3 className="text-xl font-bold text-fg-secondary">No Identities Found</h3>
                <p className="text-fg-tertiary text-sm mt-2">Try searching with a different USN or name.</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Detail View Header */}
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-neon-pink hover:text-white transition-all duration-300"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-4xl font-bold font-space tracking-tighter">{selectedStudent.name}</h1>
                <p className="text-xs font-mono text-neon-pink tracking-widest uppercase mt-1">{selectedStudent.usn} // Detail Terminal</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Stats */}
              <div className="space-y-6">
                <Card glowColor="pink">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 rounded-lg bg-neon-pink/10 text-neon-pink">
                      <TrendingUp size={20} />
                    </div>
                    <h3 className="text-lg font-bold font-space tracking-tight">Performance Metrics</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs uppercase tracking-widest text-fg-tertiary font-bold">Attendance Ratio</span>
                        <span className="text-2xl font-bold font-space text-neon-pink">{stats.pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.pct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-neon-pink shadow-[0_0_15px_rgba(255,0,122,0.5)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] uppercase tracking-widest text-fg-tertiary font-bold block mb-1">Total Present</span>
                        <span className="text-xl font-bold font-space">{stats.present}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="text-[10px] uppercase tracking-widest text-fg-tertiary font-bold block mb-1">Current Streak</span>
                        <span className="text-xl font-bold font-space">{stats.streak}d</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-neon-blue/10 text-neon-blue">
                      <Mail size={20} />
                    </div>
                    <h3 className="text-lg font-bold font-space tracking-tight">Identity Details</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-sm text-fg-tertiary">Email</span>
                      <span className="text-sm font-medium">{selectedStudent.email}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-white/5">
                      <span className="text-sm text-fg-tertiary">Branch</span>
                      <span className="text-sm font-medium">{selectedStudent.branch_code}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-sm text-fg-tertiary">Registered</span>
                      <span className="text-sm font-medium">{new Date(selectedStudent.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: History List */}
              <div className="lg:col-span-2">
                <Card className="!p-0 h-full overflow-hidden">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-neon-purple/10 text-neon-purple">
                        <Calendar size={20} />
                      </div>
                      <h3 className="text-lg font-bold font-space tracking-tight">Attendance Timeline</h3>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-fg-tertiary font-bold">Latest Records</div>
                  </div>

                  {historyLoading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-neon-purple/20 border-t-neon-purple rounded-full animate-spin"></div>
                      <p className="text-sm text-fg-tertiary font-space">Accessing historical records...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/[0.01]">
                            <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-fg-tertiary font-bold">Session Date</th>
                            <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-fg-tertiary font-bold">Topic</th>
                            <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-fg-tertiary font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {attendanceRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-5 font-mono text-xs text-fg-secondary">
                                {new Date(record.sessions?.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="px-8 py-5 text-sm font-medium group-hover:text-white transition-colors">{record.sessions?.topic}</td>
                              <td className="px-8 py-5">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  record.present 
                                    ? 'bg-success/10 text-success border border-success/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                                    : 'bg-danger/10 text-danger border border-danger/20'
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${record.present ? 'bg-success animate-pulse' : 'bg-danger'}`} />
                                  {record.present ? 'Present' : 'Absent'}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {attendanceRecords.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-8 py-20 text-center text-fg-tertiary">
                                No historical data available for this identity.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
