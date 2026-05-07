import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileText, CheckCircle2, AlertCircle, ArrowRight, Loader2, Database, Trash2, X, Settings, Calendar, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { analyzeSheet, generateDates, isAiConfigured } from '../lib/aiAgent';

const UploadCSV = () => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Sheets, 3: AI Analysis/Map, 4: Date Recovery, 5: Validate, 6: Success
  const [file, setFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [aiConfig, setAiConfig] = useState(null);
  const [scheduleInfo, setScheduleInfo] = useState({ startDate: '', days: '' });
  const [validationResults, setValidationResults] = useState({ ready: 0, warnings: 0, errors: 0, rows: [] });
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef(null);

  const targetFields = [
    { value: 'IGNORE', label: 'Ignore Column' },
    { value: 'student_name', label: 'Student Name' },
    { value: 'usn', label: 'USN' },
    { value: 'email', label: 'Email' },
    { value: 'branch_code', label: 'Branch Code' },
    { value: 'attendance_col', label: 'Attendance Column' }
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const uploadedFile = e.dataTransfer.files[0];
    if (uploadedFile) {
      processFile(uploadedFile);
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      processFile(uploadedFile);
    }
  };

  const processFile = (uploadedFile) => {
    setFile(uploadedFile);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        setSheets(wb.SheetNames);
        if (wb.SheetNames.length === 1) {
          processSheet(wb, wb.SheetNames[0]);
        } else {
          setStep(2);
        }
      } catch (err) {
        console.error("Error reading file:", err);
        alert("Could not read file. Please ensure it is a valid CSV or Excel file.");
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const processSheet = (wb, sheetName) => {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    
    // Find the primary header row (usually contains USN/Name)
    const headerRowIndex = data.findIndex(row => 
      row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('usn') || cell.toLowerCase().includes('name')))
    );
    const validHeaderIndex = headerRowIndex === -1 ? 0 : headerRowIndex;
    
    // Check if the row ABOVE has "Day X" or "Session X" (Nested headers)
    let rawHeaders = [...(data[validHeaderIndex] || [])];
    if (validHeaderIndex > 0) {
      const parentRow = data[validHeaderIndex - 1];
      let currentParent = '';
      rawHeaders = rawHeaders.map((h, i) => {
        if (parentRow[i]) currentParent = parentRow[i].toString().trim();
        return currentParent ? `${currentParent} - ${h}` : h;
      });
    }

    const rawRows = data.slice(validHeaderIndex + 1);

    // Convert to array of objects
    const formattedData = rawRows.map(row => {
      const obj = {};
      rawHeaders.forEach((h, i) => {
        if (h) {
          const cleanHeader = h.toString().trim();
          obj[cleanHeader] = row[i];
        }
      });
      return obj;
    });

    const cleanHeaders = rawHeaders.filter(Boolean).map(h => {
      const val = typeof h === 'string' ? parseFloat(h) : h;
      // If header is a number in Excel date range (roughly 1970 to 2100)
      if (typeof val === 'number' && !isNaN(val) && val > 30000 && val < 60000) {
        try {
          // Excel date serial to JS Date
          const date = new Date(Math.round((val - 25569) * 86400 * 1000));
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        } catch (e) {
          return h.toString();
        }
      }
      return h.toString().trim();
    });

    setCsvData(formattedData);
    setHeaders(cleanHeaders);
    setSelectedSheet(sheetName);
    runAIAnalysis(cleanHeaders, formattedData.slice(0, 5));
  };

  const runAIAnalysis = async (h, rows) => {
    setLoading(true);
    setStep(3);
    setLoading(true);
    setStep(3);
    
    // Baseline Mapping (Heuristics)
    const baselineMapping = {};
    h.forEach(header => {
      const lowerH = header.toLowerCase();
      let val = 'IGNORE';
      if (lowerH.includes('usn') || lowerH.includes('roll')) val = 'usn';
      else if (lowerH.includes('name')) val = 'student_name';
      else if (lowerH.includes('email')) val = 'email';
      else if (lowerH.includes('branch') || lowerH.includes('dept')) val = 'branch_code';
      else if (lowerH.includes('attendance') || /\d{2}-\d{2}-\d{4}/.test(header) || /\d{2}\/\d{2}\/\d{2}/.test(header)) {
        val = 'attendance_col';
      }
      baselineMapping[header] = val;
    });
    setMapping(baselineMapping);

    try {
      if (!isAiConfigured()) {
        console.warn("AI not configured, using heuristics only.");
        setAiConfig({ missing_dates: false, detected_dates: [], is_pivoted: false });
        setLoading(false);
        return; 
      }

      const result = await analyzeSheet(h, rows);
      if (result) {
        setAiConfig(result);
        const finalMapping = {};
        h.forEach(header => {
          // AI results take precedence over heuristics if they aren't IGNORE
          finalMapping[header] = result.mapping[header] && result.mapping[header] !== 'IGNORE' 
            ? result.mapping[header] 
            : baselineMapping[header];
        });
        setMapping(finalMapping);
      }
    } catch (e) {
      console.error("AI Analysis failed, falling back to heuristics:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySchedule = async () => {
    setLoading(true);
    try {
      const sessionCols = Object.keys(mapping).filter(k => mapping[k] === 'attendance_col');
      const dates = await generateDates(scheduleInfo.startDate, scheduleInfo.days, sessionCols.length);
      
      const newAiConfig = { ...aiConfig, detected_dates: dates };
      setAiConfig(newAiConfig);
      validateData(newAiConfig);
    } catch (e) {
      console.error(e);
      alert("Failed to generate dates. Please check the schedule format.");
    } finally {
      setLoading(false);
    }
  };

  const validateData = async (currentAiConfig = aiConfig) => {
    setLoading(true);
    setStep(5);
    try {
      if (!currentAiConfig) {
        alert("AI analysis not complete. Please wait or try again.");
        return;
      }

      const nameCol = Object.keys(mapping).find(k => mapping[k] === 'student_name');
      const usnCol = Object.keys(mapping).find(k => mapping[k] === 'usn');

      if (!nameCol || !usnCol) {
        setValidationResults({
          ready: 0,
          warnings: 0,
          errors: csvData.length,
          rows: csvData.map((r, i) => ({ id: i, data: r, errors: ['Critical Mapping Missing: Please map a column to "Student Name" and "USN" in the previous step.'], warnings: [], status: 'error' }))
        });
        return;
      }

      const { data: existingSessions } = await supabase.from('sessions').select('date, topic');
      const attendanceCols = Object.keys(mapping).filter(k => mapping[k] === 'attendance_col');
      const dates = currentAiConfig.detected_dates || [];

      const rows = csvData.map((row, idx) => {
        const errors = [];
        const warnings = [];
        
        const name = row[nameCol];
        const usn = row[usnCol];
        
        if (!name) errors.push('Missing name');
        if (!usn) errors.push('Missing USN');
        
        // Check for session overlaps/duplicates
        dates.forEach((date, dIdx) => {
          const alreadyExists = existingSessions?.find(s => s.date === date);
          if (alreadyExists) {
            warnings.push(`Session on ${date} already exists in DB (${alreadyExists.topic})`);
          }
        });

        return { 
          id: idx, 
          data: row, 
          errors, 
          warnings: [...new Set(warnings)], 
          status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'clean' 
        };
      });

      setValidationResults({
        ready: rows.filter(r => r.status === 'clean').length,
        warnings: rows.filter(r => r.status === 'warning').length,
        errors: rows.filter(r => r.status === 'error').length,
        rows
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    setLoading(true);
    const validRows = validationResults.rows.filter(r => r.status !== 'error');
    const total = validRows.length;
    setImportStatus({ current: 0, total });

    try {
      const attendanceCols = Object.keys(mapping).filter(k => mapping[k] === 'attendance_col');
      const dates = aiConfig.detected_dates;
      const studentNameCol = Object.keys(mapping).find(k => mapping[k] === 'student_name');
      const usnCol = Object.keys(mapping).find(k => mapping[k] === 'usn');
      const emailCol = Object.keys(mapping).find(k => mapping[k] === 'email');
      const branchCol = Object.keys(mapping).find(k => mapping[k] === 'branch_code');

      // 1. Upsert Students
      const studentsToUpsert = validRows.map(r => ({
        name: r.data[studentNameCol],
        usn: r.data[usnCol],
        email: r.data[emailCol] || `${r.data[usnCol].toLowerCase()}@forge.local`,
        branch_code: r.data[branchCol] || 'CS',
        is_active: true
      }));

      const { data: students, error: sError } = await supabase
        .from('students')
        .upsert(studentsToUpsert, { onConflict: 'usn' })
        .select();

      if (sError) throw sError;

      // 2. Ensure Sessions exist
      const sessionIds = {};
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        const topic = attendanceCols[i];
        
        // First check if it exists (since date is not unique in DB)
        const { data: existing } = await supabase
          .from('sessions')
          .select('id')
          .eq('date', date)
          .maybeSingle();
        
        if (existing) {
          sessionIds[date] = existing.id;
        } else {
          const { data: session, error: sesError } = await supabase
            .from('sessions')
            .insert({ 
              date, 
              topic, 
              month_number: 1,
              duration_hours: 2.0,
              session_type: 'offline'
            })
            .select()
            .single();
          
          if (sesError) {
            console.error(`Error creating session for ${date}:`, sesError);
            // If it's a trigger error (future date or before program start), we should skip this date
            if (sesError.message.includes('Attendance date')) {
              console.warn(`Skipping date ${date} due to DB constraints: ${sesError.message}`);
              continue; 
            }
            throw sesError;
          }
          if (session) sessionIds[date] = session.id;
        }
      }

      // 3. Insert Attendance
      const attendanceToInsert = [];
      validRows.forEach(r => {
        const student = students.find(s => s.usn === r.data[usnCol]);
        if (!student) return;

        attendanceCols.forEach((col, i) => {
          const date = dates[i];
          const sessionId = sessionIds[date];
          if (!sessionId) return; // Skip if session creation failed

          const val = r.data[col];
          let isPresent = false;
          if (aiConfig.attendance_convention === 'TRUE/FALSE') isPresent = val === true || val === 'TRUE' || val === 'true';
          else if (aiConfig.attendance_convention === 'P/A') isPresent = val === 'P' || val === 'Present' || val === 'present';
          else isPresent = !!val;

          attendanceToInsert.push({
            student_id: student.id,
            session_id: sessionId,
            present: isPresent,
            marked_by: 'AI Import'
          });
        });
      });

      // Batch insert in chunks of 100
      for (let i = 0; i < attendanceToInsert.length; i += 100) {
        const chunk = attendanceToInsert.slice(i, i + 100);
        const { error: attError } = await supabase.from('attendance').upsert(chunk, { onConflict: 'student_id, session_id' });
        if (attError) {
          console.error("Attendance insert error:", attError);
          // If some fail, we continue to others
        }
        setImportStatus({ current: i + chunk.length, total: attendanceToInsert.length });
      }

      setStep(6);
    } catch (e) {
      console.error("Import failed:", e);
      alert(`Import failed: ${e.message || "Unknown error"}. Check console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setWorkbook(null);
    setSheets([]);
    setSelectedSheet('');
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setAiConfig(null);
    setScheduleInfo({ startDate: '', days: '' });
    setValidationResults({ ready: 0, warnings: 0, errors: 0, rows: [] });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <h1 className="text-display-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent-glow to-primary-600 mb-2">
          AI Bulk Attendance Import
        </h1>
        <p className="text-body text-fg-secondary">Sync your complex Excel data using Gemini 3.1 Pro intelligence</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 mb-12 overflow-x-auto pb-4 hide-scrollbar">
        {[1, 2, 3, 4, 5, 6].map(s => (
          <React.Fragment key={s}>
            <div className={`flex flex-col items-center gap-2 min-w-[70px]`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                step >= s ? 'bg-accent-glow border-accent-glow text-white shadow-lg shadow-accent-glow/20' : 'bg-surface border-border-default text-fg-tertiary'
              }`}>
                {step > s ? <CheckCircle2 size={20} /> : <span className="font-bold">{s}</span>}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= s ? 'text-accent-glow' : 'text-fg-tertiary'}`}>
                {['Upload', 'Sheets', 'Mapping', 'Recovery', 'Review', 'Finish'][s-1]}
              </span>
            </div>
            {s < 6 && (
              <div className={`w-8 h-[2px] mb-6 transition-all duration-300 ${step > s ? 'bg-accent-glow' : 'bg-border-subtle'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <Card 
          className="p-16 border-dashed border-2 border-border-default hover:border-accent-glow/50 transition-all duration-300 group cursor-pointer bg-surface/50 backdrop-blur-sm" 
          onClick={() => fileInputRef.current.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input type="file" accept=".csv,.xlsx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-accent-glow/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <Upload className="text-accent-glow" size={40} />
            </div>
            <h3 className="text-h3 text-fg-primary mb-3">Drop your attendance sheet</h3>
            <p className="text-body-sm text-fg-tertiary mb-8 text-center max-w-sm">
              We'll use AI to reason through nested headers and multiple attendance columns in your <span className="font-mono text-accent-glow">.xlsx</span> file.
            </p>
            <Button variant="secondary" className="px-10 h-12 rounded-xl">Browse Local Files</Button>
          </div>
        </Card>
      )}

      {/* Step 2: Sheet Selection */}
      {step === 2 && (
        <div className="animate-in slide-in-from-right-4 duration-500">
          <Card className="p-8 border border-border-subtle">
            <CardHeader label="WORKBOOK DETECTED" title="Which sheet has the data?" icon={FileText} />
            <div className="grid grid-cols-1 gap-4 mt-8">
              {sheets.map(name => (
                <button
                  key={name}
                  onClick={() => processSheet(workbook, name)}
                  className="flex items-center justify-between p-5 rounded-2xl border border-border-default hover:border-accent-glow/40 hover:bg-accent-glow/5 transition-all group text-left shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center group-hover:bg-white transition-colors">
                      <Database className="text-accent-glow" size={20} />
                    </div>
                    <div>
                      <span className="text-body font-bold text-fg-primary">{name}</span>
                      <p className="text-[11px] text-fg-tertiary uppercase tracking-widest mt-0.5">Click to analyze</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-fg-tertiary group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
            <Button variant="ghost" className="mt-10" onClick={reset}>Cancel and Start Over</Button>
          </Card>
        </div>
      )}

      {/* Step 3: AI Map */}
      {step === 3 && (
        <div className="animate-in zoom-in-95 duration-500">
          <Card className="p-8 border border-border-subtle">
            <CardHeader label="AI REASONING" title="Confirm Mapping" icon={Database} />
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-8">
                  <div className="w-20 h-20 rounded-full border-4 border-accent-glow/20 border-t-accent-glow animate-spin"></div>
                  <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-glow animate-pulse" size={24} />
                </div>
                <p className="text-body font-bold text-fg-primary mb-2">Gemini is reading your sheet...</p>
                <p className="text-body-sm text-fg-tertiary animate-pulse">Detecting USNs, Student Names, and Attendance columns</p>
              </div>
            ) : (
              <>
                <div className="p-5 mb-10 bg-accent-glow/5 border border-accent-glow/20 rounded-2xl flex items-start gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-accent-glow/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="text-accent-glow" size={20} />
                  </div>
                  <div>
                    <h4 className="text-body font-bold text-fg-primary">AI Mapping Complete</h4>
                    <p className="text-body-sm text-fg-secondary mt-1">
                      Detected <b>{aiConfig?.attendance_convention}</b> convention and 
                      <b>{Object.keys(mapping).filter(k => mapping[k] === 'attendance_col').length}</b> attendance sessions.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar mb-10 p-2">
                  {headers.map(header => (
                    <div key={header} className="flex items-center gap-4 p-4 bg-surface-inset rounded-2xl border border-border-default hover:border-accent-glow/30 transition-colors shadow-sm">
                      <div className="flex-1 min-w-0">
                        <div className="text-body-sm font-bold text-fg-primary truncate">{header}</div>
                      </div>
                      <ArrowRight size={14} className="text-fg-tertiary flex-shrink-0" />
                      <select 
                        value={mapping[header]} 
                        onChange={(e) => setMapping({...mapping, [header]: e.target.value})}
                        className="select !h-10 !text-[12px] w-56 bg-surface-raised border-border-default focus:border-accent-glow rounded-xl font-medium"
                      >
                        {targetFields.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center bg-surface-raised -mx-8 -mb-8 p-8 border-t border-border-subtle rounded-b-2xl">
                  <Button variant="ghost" onClick={reset}>Discard File</Button>
                  <Button 
                    className="px-12 h-12 rounded-xl shadow-lg shadow-accent-glow/20"
                    onClick={() => aiConfig?.missing_dates ? setStep(4) : validateData()}
                  >
                    Next: {aiConfig?.missing_dates ? 'Recover Dates' : 'Validate Records'}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Step 4: Date Recovery */}
      {step === 4 && (
        <div className="animate-in slide-in-from-bottom-8 duration-500">
          <Card className="p-8 border border-border-subtle">
            <CardHeader label="DATA RECOVERY" title="Gaps in Timeline" icon={AlertCircle} />
            <div className="flex items-start gap-4 p-5 bg-warning/5 border border-warning/20 rounded-2xl mb-10">
              <Calendar className="text-warning mt-1" size={24} />
              <p className="text-body-sm text-fg-secondary">
                Your headers (e.g., "Day 1", "Day 2") don't have actual dates. We need a reference schedule to fill the gaps in the database.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-caption font-bold text-fg-tertiary uppercase tracking-widest">Start Date of Bootcamp</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={scheduleInfo.startDate}
                    onChange={(e) => setScheduleInfo({...scheduleInfo, startDate: e.target.value})}
                    className="input h-14 pl-12 rounded-2xl border-border-default"
                  />
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary" size={20} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-caption font-bold text-fg-tertiary uppercase tracking-widest">Weekly Class Schedule</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="e.g. Mon, Wed, Fri"
                    value={scheduleInfo.days}
                    onChange={(e) => setScheduleInfo({...scheduleInfo, days: e.target.value})}
                    className="input h-14 pl-12 rounded-2xl border-border-default"
                  />
                  <Settings className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-tertiary" size={20} />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-12 bg-surface-raised -mx-8 -mb-8 p-8 border-t border-border-subtle rounded-b-2xl">
              <Button variant="ghost" onClick={() => setStep(3)}>Back to Mapping</Button>
              <Button 
                className="px-12 h-12 rounded-xl shadow-lg shadow-accent-glow/20"
                onClick={handleApplySchedule} 
                loading={loading}
              >
                Apply Schedule
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Step 5: Validate */}
      {step === 5 && (
        <div className="animate-in fade-in duration-700">
          <Card className="p-8 border border-border-subtle">
            <CardHeader label="PRE-IMPORT CHECK" title="Verify & Sync" icon={CheckCircle2} />
            
            <div className="grid grid-cols-3 gap-6 my-10">
              <div className="p-6 bg-success/5 border border-success/20 rounded-3xl text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4 text-success">
                  <UserPlus size={24} />
                </div>
                <div className="text-h2 font-bold text-success">{validationResults.ready}</div>
                <div className="text-caption font-bold text-success/60 uppercase tracking-widest">New Students</div>
              </div>
              <div className="p-6 bg-warning/5 border border-warning/20 rounded-3xl text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto mb-4 text-warning">
                  <AlertCircle size={24} />
                </div>
                <div className="text-h2 font-bold text-warning">{validationResults.warnings}</div>
                <div className="text-caption font-bold text-warning/60 uppercase tracking-widest">Sync Overlaps</div>
              </div>
              <div className="p-6 bg-danger/5 border border-danger/20 rounded-3xl text-center shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4 text-danger">
                  <X size={24} />
                </div>
                <div className="text-h2 font-bold text-danger">{validationResults.errors}</div>
                <div className="text-caption font-bold text-danger/60 uppercase tracking-widest">Blockers</div>
              </div>
            </div>

            <div className="max-h-[350px] overflow-y-auto border border-border-default rounded-2xl custom-scrollbar mb-10 shadow-inner bg-surface-inset">
              <table className="w-full text-left text-body-sm border-collapse">
                <thead className="sticky top-0 bg-surface border-b border-border-default z-10">
                  <tr>
                    <th className="px-6 py-4 font-bold text-fg-secondary tracking-wider uppercase text-[10px]">Student</th>
                    <th className="px-6 py-4 font-bold text-fg-secondary tracking-wider uppercase text-[10px]">USN</th>
                    <th className="px-6 py-4 font-bold text-fg-secondary tracking-wider uppercase text-[10px]">Status</th>
                    <th className="px-6 py-4 font-bold text-fg-secondary tracking-wider uppercase text-[10px]">AI Reasoning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {validationResults.rows.map(row => (
                    <tr key={row.id} className="hover:bg-surface-raised transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-body-sm font-bold text-fg-primary group-hover:text-accent-glow transition-colors">
                          {row.data[Object.keys(mapping).find(k => mapping[k] === 'student_name')] || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-fg-tertiary font-mono">{row.data[Object.keys(mapping).find(k => mapping[k] === 'usn')] || '-'}</td>
                      <td className="px-6 py-4">
                        <Pill status={row.status === 'clean' ? 'success' : row.status === 'warning' ? 'warning' : 'danger'} className="rounded-lg px-3">
                          {row.status}
                        </Pill>
                      </td>
                      <td className="px-6 py-4 text-[11px] max-w-[250px]">
                        {row.errors.length > 0 && <div className="text-danger flex items-center gap-1"><X size={12}/> {row.errors.join(', ')}</div>}
                        {row.warnings.length > 0 && <div className="text-warning italic flex items-center gap-1"><AlertCircle size={12}/> {row.warnings[0]}</div>}
                        {row.status === 'clean' && <div className="text-success flex items-center gap-1"><CheckCircle2 size={12}/> Ready for sync</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-surface-raised -mx-8 -mb-8 p-8 border-t border-border-subtle rounded-b-2xl">
              <Button variant="ghost" onClick={() => setStep(3)}>Back to Mapping</Button>
              <div className="flex gap-4">
                <Button variant="secondary" onClick={reset} className="rounded-xl px-8">Discard</Button>
                <Button 
                  className="px-12 h-12 rounded-xl shadow-lg shadow-accent-glow/20"
                  onClick={runImport} 
                  disabled={validationResults.ready === 0 || loading} 
                  loading={loading ? 1 : 0}
                >
                  {loading ? `Syncing...` : `Sync ${validationResults.ready} Records`}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Step 6: Success */}
      {step === 6 && (
        <Card className="p-16 text-center flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-10 shadow-inner relative">
            <div className="absolute inset-0 rounded-full animate-ping bg-success/20"></div>
            <CheckCircle2 size={48} className="text-success relative z-10" />
          </div>
          <h2 className="text-display-sm font-bold text-fg-primary mb-4">Sync Successful!</h2>
          <p className="text-body text-fg-secondary mb-12 max-w-md">
            AI has successfully bridged the gaps, handled nested headers, and synced records to your Supabase instance.
          </p>
          <div className="flex gap-6">
            <Button variant="secondary" onClick={reset} className="px-8 rounded-xl">Upload Another</Button>
            <Button onClick={() => window.location.href = '/dashboard'} className="px-10 rounded-xl shadow-lg shadow-accent-glow/20">Go to Dashboard</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UploadCSV;
