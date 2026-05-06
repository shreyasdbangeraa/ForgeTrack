import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Pill, StatusDot } from '../components/ui/Pill';
import { ConfirmModal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Save, CheckSquare, Plus, ArrowLeft, Search, Clock } from 'lucide-react';

export default function MarkAttendance() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Navigation State: 'list' | 'mark' | 'create'
  const [view, setView] = useState('list');
  
  // Data State
  const [allSessions, setAllSessions] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [newTopic, setNewTopic] = useState('');
  const [newType, setNewType] = useState('offline');
  const [newDuration, setNewDuration] = useState('2.0');
  
  // Attendance State
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // student_id -> boolean
  const [initialAttendance, setInitialAttendance] = useState({}); // tracking to see if dirty
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (view === 'list') {
      fetchAllSessions();
    }
  }, [view]);

  const fetchAllSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      addToast('Error', 'Failed to fetch sessions', 'danger');
    } else {
      setAllSessions(data || []);
    }
    setLoading(false);
  };

  const fetchStudentsAndAttendance = async (sessionId) => {
    setLoading(true);
    const [studentsRes, attendanceRes] = await Promise.all([
      supabase.from('students').select('*').eq('is_active', true).order('name'),
      supabase.from('attendance').select('*').eq('session_id', sessionId)
    ]);

    const activeStudents = studentsRes.data || [];
    const existingAtt = attendanceRes.data || [];

    setStudents(activeStudents);

    const attMap = {};
    existingAtt.forEach(a => {
      attMap[a.student_id] = a.present;
    });

    setAttendance(attMap);
    setInitialAttendance({ ...attMap });
    setLoading(false);
  };

  const handleCreateSession = async () => {
    if (!newTopic) return;
    
    setLoading(true);
    const monthNumber = new Date(date).getMonth() + 1;
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        date,
        topic: newTopic,
        session_type: newType,
        duration_hours: parseFloat(newDuration),
        month_number: monthNumber
      })
      .select()
      .single();

    setLoading(false);
    if (error) {
      addToast('Error', error.message, 'danger');
    } else {
      addToast('Success', 'Session created', 'success');
      setNewTopic('');
      // Switch to marking view for the new session
      setSession(data);
      setView('mark');
      await fetchStudentsAndAttendance(data.id);
    }
  };

  const handleMarkSession = async (s) => {
    setSession(s);
    setView('mark');
    await fetchStudentsAndAttendance(s.id);
  };

  const toggleStudent = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const selectAll = (status) => {
    const newAtt = {};
    students.forEach(s => newAtt[s.id] = status);
    setAttendance(newAtt);
  };

  const isUpdate = () => Object.keys(initialAttendance).length > 0;

  const handleSaveClick = () => {
    if (Object.keys(attendance).length === 0) return;
    if (isUpdate()) {
      setIsConfirmOpen(true);
    } else {
      saveAttendance();
    }
  };

  const saveAttendance = async () => {
    setIsConfirmOpen(false);
    setIsSaving(true);

    const payload = students.map(s => ({
      student_id: s.id,
      session_id: session.id,
      present: attendance[s.id] || false,
      marked_by: user.display_name
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'student_id,session_id' });

    setIsSaving(false);

    if (error) {
      addToast('Error saving attendance', error.message, 'danger');
    } else {
      const presentCount = Object.values(attendance).filter(Boolean).length;
      const absentCount = students.length - presentCount;
      addToast('Saved', `Marked ${presentCount} present, ${absentCount} absent`, 'success');
      setView('list');
    }
  };

  const filteredSessions = allSessions.filter(s => 
    s.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.date.includes(searchQuery)
  );

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  // Render Helpers
  const renderListView = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-h1 text-fg-primary mb-2">Sessions Overview</h1>
          <p className="text-body text-fg-secondary">Manage and mark attendance for all sessions.</p>
        </div>
        <Button onClick={() => setView('create')} className="w-full md:w-auto">
          <Plus size={18} className="mr-2" /> Create New Session
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" size={18} />
        <input 
          type="text" 
          placeholder="Search by topic or date (YYYY-MM-DD)..." 
          className="input pl-10 mb-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && allSessions.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse bg-surface-inset rounded-xl" />)}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-20 bg-surface-inset rounded-2xl border border-dashed border-border-subtle">
          <Calendar size={48} className="mx-auto text-fg-tertiary mb-4 opacity-50" />
          <h3 className="text-h3 text-fg-secondary">No sessions found</h3>
          <p className="text-body text-fg-tertiary mt-1">Try adjusting your search or create a new session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map(s => (
            <Card key={s.id} className="group hover:border-accent-glow transition-all duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-inset flex flex-col items-center justify-center border border-border-subtle shrink-0">
                    <span className="text-micro font-bold text-accent-fg uppercase">{new Date(s.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-body-lg font-bold text-fg-primary leading-none">{new Date(s.date).getDate()}</span>
                  </div>
                  <div>
                    <h3 className="text-h3 text-fg-primary group-hover:text-accent-glow transition-colors">{s.topic}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-caption text-fg-tertiary flex items-center gap-1">
                        <Clock size={12} /> {s.duration_hours}h
                      </span>
                      <span className="w-1 h-1 rounded-full bg-border-strong" />
                      <Pill size="sm" className="bg-surface-inset">{s.session_type}</Pill>
                    </div>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => handleMarkSession(s)}>
                  Mark Attendance
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateView = () => (
    <div className="animate-in fade-in slide-in-from-top-4 duration-500 max-w-[600px] mx-auto">
      <button onClick={() => setView('list')} className="flex items-center gap-2 text-fg-secondary hover:text-fg-primary mb-6 transition-colors">
        <ArrowLeft size={18} /> Back to Sessions
      </button>
      
      <h1 className="text-h1 text-fg-primary mb-8">Create New Session</h1>
      
      <Card className="!p-8 border-accent-glow shadow-[0_0_20px_rgba(99,102,241,0.1)]">
        <div className="space-y-6">
          <Input 
            label="Topic" 
            placeholder="e.g. LLM Foundations & 8-Layer AI Stack" 
            value={newTopic} 
            onChange={e => setNewTopic(e.target.value)} 
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input 
              type="date" 
              label="Date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              max={new Date().toLocaleDateString('en-CA')}
            />
            <Input 
              type="number" 
              step="0.5" 
              label="Duration (hours)" 
              value={newDuration} 
              onChange={e => setNewDuration(e.target.value)} 
            />
          </div>
          
          <Select 
            label="Session Type" 
            value={newType} 
            onChange={e => setNewType(e.target.value)}
            options={[{label: 'Offline (In-Person)', value: 'offline'}, {label: 'Online (Remote)', value: 'online'}]}
          />
          
          <Button onClick={handleCreateSession} className="w-full mt-4" disabled={!newTopic || loading}>
            {loading ? 'Creating...' : 'Create Session'}
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderMarkView = () => (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-fg-secondary hover:text-fg-primary mb-2 transition-colors">
            <ArrowLeft size={16} /> Back to Sessions
          </button>
          <h1 className="text-h1 text-fg-primary">{session?.topic}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-body text-fg-tertiary">{new Date(session?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span className="w-1 h-1 rounded-full bg-border-strong" />
            <Pill>{session?.session_type}</Pill>
            <Pill>{session?.duration_hours}h</Pill>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="secondary" onClick={() => selectAll(true)}>All Present</Button>
          <Button variant="secondary" onClick={() => selectAll(false)}>All Absent</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 animate-pulse bg-surface-inset rounded-lg" />)}
        </div>
      ) : (
        <Card className="!p-0 overflow-hidden relative">
          <div className="divide-y divide-border-subtle">
            {students.map((student) => {
              const isPresent = attendance[student.id];
              return (
                <div 
                  key={student.id} 
                  className="flex items-center px-6 py-4 hover:bg-surface-raised cursor-pointer transition-colors"
                  onClick={() => toggleStudent(student.id)}
                >
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-4 shrink-0 transition-colors ${isPresent ? 'bg-success border-success text-[#07070B]' : 'border-fg-tertiary bg-surface-inset'}`}>
                    {isPresent && <CheckSquare size={14} className="stroke-[3px]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-body-lg font-medium text-fg-primary">{student.name}</p>
                    <p className="text-caption font-mono text-fg-tertiary uppercase">{student.usn}</p>
                  </div>
                  <Pill size="sm" className="bg-surface-inset border-border-subtle">{student.branch_code}</Pill>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Action Bar */}
      {!loading && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-20 flex justify-center pointer-events-none">
          <div className="w-full max-w-[800px] bg-surface-raised border border-border-default shadow-raised rounded-2xl p-4 flex items-center justify-between pointer-events-auto backdrop-blur-md bg-opacity-90">
            <div className="flex items-center gap-6 ml-2">
              <div className="flex flex-col">
                <span className="text-caption text-fg-tertiary uppercase tracking-tighter">Present</span>
                <span className="text-h3 text-success font-bold tabular-nums leading-none">{presentCount}</span>
              </div>
              <div className="w-[1px] h-6 bg-border-subtle" />
              <div className="flex flex-col">
                <span className="text-caption text-fg-tertiary uppercase tracking-tighter">Absent</span>
                <span className="text-h3 text-danger font-bold tabular-nums leading-none">{absentCount}</span>
              </div>
            </div>
            <Button onClick={handleSaveClick} disabled={isSaving} className="px-8 py-6 shadow-glow">
              {isSaving ? 'Saving...' : isUpdate() ? 'Update Attendance' : 'Save Attendance'}
            </Button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={saveAttendance}
        title="Update Existing Records?"
        message="You are modifying attendance records that have already been saved for this session. Do you wish to overwrite the previous data?"
        confirmText="Yes, Update"
        isDestructive={true}
      />
    </div>
  );

  return (
    <div className="max-w-[1000px] mx-auto px-6 pt-8 pb-32">
      {view === 'list' && renderListView()}
      {view === 'create' && renderCreateView()}
      {view === 'mark' && renderMarkView()}
    </div>
  );
}
