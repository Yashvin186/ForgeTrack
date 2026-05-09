import { useState, useRef, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Upload, FileUp, Database, CheckCircle2, 
  AlertCircle, X, ChevronRight, Loader2,
  Table as TableIcon, Brain, Search, 
  Trash2, RefreshCcw, Save, FileSpreadsheet, Activity, Edit3,
  Info, Sparkles, ChevronDown, ChevronUp, Download, Check
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { getGeminiModel } from '../lib/gemini';
import { supabase } from '../lib/supabaseClient';
import Toast from '../components/Toast';

const TARGET_FIELDS = [
  { value: 'student_name', label: 'Student Name' },
  { value: 'usn',          label: 'USN / ID' },
  { value: 'email',        label: 'Email' },
  { value: 'admission_number', label: 'Admission No' },
  { value: 'branch_code',  label: 'Branch' },
  { value: 'date',         label: 'Date (Session)' },
  { value: 'status',       label: 'Attendance Value' },
  { value: 'IGNORE',       label: 'Ignore Column' }
];

const AI_MESSAGES = [
  { text: "Reading workbook...", pct: 8 },
  { text: "Detecting sheets...", pct: 18 },
  { text: "Parsing attendance patterns...", pct: 30 },
  { text: "Identifying student identifiers...", pct: 42 },
  { text: "Inferring session structure...", pct: 54 },
  { text: "Detecting duplicate records...", pct: 66 },
  { text: "Understanding attendance conventions...", pct: 76 },
  { text: "Building smart mapping...", pct: 88 },
  { text: "Optimizing import preview...", pct: 96 },
];

const FORMAT_BADGES = [
  { label: 'CSV', color: 'text-success border-success-border bg-success-bg' },
  { label: 'XLSX', color: 'text-info border-info-border bg-info-bg' },
  { label: 'Multi-Sheet Excel', color: 'text-warning border-warning-border bg-warning-bg' },
];

export default function CSVImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Core State
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [importStartTime, setImportStartTime] = useState(null);
  
  // Sheet Handling
  const [workbook, setWorkbook] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  
  // Data
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  
  // AI Inference State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiMessageIndex, setAiMessageIndex] = useState(0);

  // Mapping & AI Configuration
  const [columnsMapping, setColumnsMapping] = useState([]);
  const [aiConfig, setAiConfig] = useState({
    is_pivoted: false,
    date_format: 'DD/MM/YYYY',
    attendance_convention: 'P/A',
    overall_confidence: 0,
    reasoning: ''
  });
  
  const [showReasoning, setShowReasoning] = useState(true);

  // Preview & Results
  const [candidates, setCandidates] = useState([]);
  const [filterTag, setFilterTag] = useState('All');
  const [importResults, setImportResults] = useState(null);
  const [stats, setStats] = useState({ new: 0, updates: 0, duplicates: 0, errors: 0 });
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [aiProgress, setAiProgress] = useState(0);
  const [toast, setToast] = useState(null);

  // AI Message Cycler
  useEffect(() => {
    let interval;
    if (isAnalyzing) {
      setAiProgress(0);
      interval = setInterval(() => {
        setAiMessageIndex((prev) => {
          const next = (prev + 1) % AI_MESSAGES.length;
          setAiProgress(AI_MESSAGES[next].pct);
          return next;
        });
      }, 1600);
    } else {
      setAiProgress(0);
      setAiMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // --- Step 1: File Upload & Parsing ---
  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) processFile(selectedFile);
  };

  const processFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setToast({ message: 'Only CSV or Excel files allowed', type: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'File exceeds 5MB limit', type: 'error' });
      return;
    }
    
    setFile(file);
    setIsProcessing(true);
    setProgress({ current: 0, total: 0, status: 'Reading file...' });
    
    if (ext === 'csv') {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          setIsProcessing(false);
          const data = results.data;
          if (data.length < 2) {
             setToast({ message: 'File seems empty or missing data rows', type: 'error' });
             return;
          }
          setRawData(data);
          setHeaders(data[0] || []);
          runAiMapping(data[0] || [], data.slice(1, 15));
        },
        error: (err) => {
          setIsProcessing(false);
          setToast({ message: 'Failed to parse CSV: ' + err.message, type: 'error' });
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          setWorkbook(wb);
          setSheets(wb.SheetNames);
          
          if (wb.SheetNames.length === 1) {
             processExcelSheet(wb, wb.SheetNames[0]);
          } else {
             setSelectedSheet(wb.SheetNames[0]);
             setIsProcessing(false);
          }
        } catch (err) {
          setIsProcessing(false);
          setToast({ message: 'Failed to read Excel file', type: 'error' });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processExcelSheet = (wb, sheetName) => {
    setIsProcessing(true);
    try {
      const worksheet = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      if (json.length < 2) {
         setToast({ message: 'Selected sheet is empty', type: 'warning' });
         setIsProcessing(false);
         return;
      }
      setRawData(json);
      setHeaders(json[0] || []);
      runAiMapping(json[0] || [], json.slice(1, 15));
    } catch (e) {
      setToast({ message: 'Error processing sheet', type: 'error' });
      setIsProcessing(false);
    }
  };

  // --- Step 1.5: AI Mapping ---
  const runAiMapping = async (heads, sampleRows) => {
    try {
      setIsAnalyzing(true);
      setStep(1.5);
      
      const model = getGeminiModel('gemini-2.5-flash');
      if (!model) {
        setToast({ message: 'Gemini API not configured. Falling back to manual.', type: 'warning' });
        initFallbackMapping(heads);
        setIsAnalyzing(false);
        setStep(2);
        return;
      }

      const prompt = `
You are an expert AI data analyst for ForgeTrack's enterprise attendance import system.
I have a spreadsheet with these headers: ${JSON.stringify(heads)}.
Here are the first 15 rows: ${JSON.stringify(sampleRows)}.

Task: Analyze the data structure and map EVERY column by its exact index.
System Fields allowed: ["student_name", "usn", "email", "admission_number", "branch_code", "date", "status", "IGNORE"]

Rules:
1. If multiple dates appear as headers (e.g., "12/03", "14/03", "Mon", "Tue", "Wk1", "04/05/2026"), this is a PIVOTED sheet. Set is_pivoted: true.
2. In pivoted sheets, map ALL the specific session date columns to the "date" target_field.
3. If original_header is empty, vague, or missing, strictly infer the name using the row data beneath it (e.g., "Student Name", "USN") and set it in "inferred_name".
4. Provide a confidence score (0-100) for EACH column mapping, and an overall confidence score for the sheet parsing.

Return ONLY valid JSON in this exact schema (no markdown formatting, no backticks, just the raw JSON object):
{
  "columns": [
    {
      "index": 0,
      "original_header": "string or empty",
      "inferred_name": "string",
      "target_field": "string",
      "confidence": 98
    }
  ],
  "is_pivoted": true,
  "date_format": "string",
  "attendance_convention": "string",
  "overall_confidence": 95,
  "reasoning": "string explanation detailing why you chose pivoted/non-pivoted and how you resolved missing headers."
}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Ensure all indices up to heads.length are covered
      const mappedCols = parsed.columns || [];
      const fullColumns = heads.map((h, i) => {
         const aiMatch = mappedCols.find(c => c.index === i);
         return aiMatch ? aiMatch : {
            index: i,
            original_header: h,
            inferred_name: h || `Column ${i+1}`,
            target_field: 'IGNORE',
            confidence: 0
         };
      });

      setColumnsMapping(fullColumns);
      setAiConfig({
        is_pivoted: parsed.is_pivoted || false,
        date_format: parsed.date_format || 'Auto',
        attendance_convention: parsed.attendance_convention || 'P/A',
        overall_confidence: parsed.overall_confidence || 80,
        reasoning: parsed.reasoning || 'Automated inference applied.'
      });
      
    } catch (err) {
      console.error('[AI Mapping] Error:', err);
      setToast({ message: 'AI Mapping failed. Using manual defaults.', type: 'error' });
      initFallbackMapping(heads);
    } finally {
      setIsAnalyzing(false);
      setStep(2);
    }
  };

  const initFallbackMapping = (heads) => {
    const initial = heads.map((h, i) => ({
      index: i,
      original_header: h,
      inferred_name: h || `Column ${i+1}`,
      target_field: 'IGNORE',
      confidence: 0
    }));
    setColumnsMapping(initial);
  };

  const updateColumnMapping = (index, newTarget) => {
     const updated = [...columnsMapping];
     updated[index].target_field = newTarget;
     setColumnsMapping(updated);
  };

  // --- Step 3: Transformation & Pre-Validation ---
  const proceedToPreview = async () => {
    try {
      setIsProcessing(true);
      setProgress({ current: 0, total: 0, status: 'Normalizing records and dates...' });
      
      const rows = rawData.slice(1);
      console.log(`[Import Agent] Raw parsed rows: ${rows.length}`);

      // Advanced Parsers
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const str = String(dateStr).trim();
        // Handle common Excel formats
        const excelDate = Number(str);
        if (!isNaN(excelDate) && excelDate > 20000) {
           const dateObj = new Date((excelDate - (25567 + 2)) * 86400 * 1000);
           return dateObj.toISOString().split('T')[0];
        }

        const parts = str.split(/[\/\-\.]/);
        let dateObj = new Date(str); // Native fallback
        if (parts.length >= 2) {
           let d = parts[0], m = parts[1], y = parts[2] || new Date().getFullYear();
           if (y.length === 2) y = '20' + y;
           dateObj = new Date(y, parseInt(m) - 1, parseInt(d));
        }
        
        return isNaN(dateObj.getTime()) ? null : dateObj.toISOString().split('T')[0];
      };

      const parseStatus = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const s = String(val).toLowerCase().trim();
        if (['p', 'present', '1', 'true', 'y', 'yes', '✓'].includes(s)) return true;
        if (['a', 'absent', '0', 'false', 'n', 'no', '✗'].includes(s)) return false;
        return null; // Ignore unparseable or blank
      };

      // Extract Candidates via Strict Deduplication Map
      const compositeMap = new Map();

      rows.forEach((row, rowIndex) => {
        // Skip entirely empty rows
        if (!row || !row.some(val => val !== undefined && val !== null && val !== '')) return;

        const studentInfo = {};
        let rowDate = null;
        let rowStatus = null;
        const pivotedDates = []; 

        columnsMapping.forEach(col => {
          const val = row[col.index];
          if (col.target_field === 'IGNORE' || val === undefined || val === null || val === '') return;

          if (aiConfig.is_pivoted && col.target_field === 'date') {
             pivotedDates.push({ 
                dateStr: col.inferred_name || col.original_header, 
                status: parseStatus(val) 
             });
          } else if (col.target_field === 'date') {
             rowDate = parseDate(val);
          } else if (col.target_field === 'status') {
             rowStatus = parseStatus(val);
          } else {
             studentInfo[col.target_field] = val;
          }
        });

        // Skip rows without USN
        if (!studentInfo.usn) return;

        // Generate normalized candidates
        if (aiConfig.is_pivoted) {
          pivotedDates.forEach(pd => {
            if (pd.status !== null) {
              const dateIso = parseDate(pd.dateStr);
              if (dateIso) {
                 const key = `${studentInfo.usn}_${dateIso}`;
                 if (!compositeMap.has(key)) {
                    compositeMap.set(key, {
                       ...studentInfo,
                       date: dateIso,
                       present: pd.status,
                       source_row: rowIndex + 2,
                       action: 'process'
                    });
                 }
              }
            }
          });
        } else {
          if (rowDate && rowStatus !== null) {
              const key = `${studentInfo.usn}_${rowDate}`;
              if (!compositeMap.has(key)) {
                  compositeMap.set(key, {
                    ...studentInfo,
                    date: rowDate,
                    present: rowStatus,
                    source_row: rowIndex + 2,
                    action: 'process'
                  });
              }
          }
        }
      });

      const newCandidates = Array.from(compositeMap.values());
      console.log(`[Import Agent] Flattened & Deduplicated rows: ${newCandidates.length}`);

      setProgress({ current: 0, total: 0, status: 'Cross-checking with Supabase database...' });

      // Identify database duplicates
      const uniqueDates = [...new Set(newCandidates.map(c => c.date))].filter(Boolean);
      const uniqueUSNs = [...new Set(newCandidates.map(c => c.usn))].filter(Boolean);

      const { data: dbSessions } = await supabase.from('sessions').select('id, date').in('date', uniqueDates);
      const sessionMap = new Map();
      dbSessions?.forEach(s => sessionMap.set(s.date, s.id));

      const { data: dbStudents } = await supabase.from('students').select('id, usn').in('usn', uniqueUSNs);
      const studentMap = new Map();
      dbStudents?.forEach(s => studentMap.set(s.usn, s.id));

      const dbAttendanceMap = new Map(); 
      if (dbSessions?.length > 0 && dbStudents?.length > 0) {
        // Chunk attendance fetch if large
        const chunkSize = 100;
        const sessionIds = dbSessions.map(s => s.id);
        for (let i = 0; i < sessionIds.length; i += chunkSize) {
            const chunk = sessionIds.slice(i, i + chunkSize);
            const { data: dbAtt } = await supabase
              .from('attendance')
              .select('student_id, session_id, present')
              .in('session_id', chunk);
              
            dbAtt?.forEach(a => {
              dbAttendanceMap.set(`${a.student_id}_${a.session_id}`, a.present);
            });
        }
      }

      // Validate & Tag
      let counts = { new: 0, updates: 0, duplicates: 0, errors: 0 };
      
      const validated = newCandidates.map(c => {
        let tag = 'New';
        const errors = [];
        if (!c.student_name) errors.push('Missing Name');
        if (!c.usn) errors.push('Missing USN');
        if (!c.date) errors.push('Invalid Date');
        
        if (errors.length > 0) {
          tag = 'Error';
          counts.errors++;
        } else {
          const sessId = sessionMap.get(c.date);
          const stuId = studentMap.get(c.usn);
          
          if (sessId && stuId) {
            const existingPresent = dbAttendanceMap.get(`${stuId}_${sessId}`);
            if (existingPresent !== undefined) {
              if (existingPresent === c.present) {
                tag = 'Duplicate';
                counts.duplicates++;
              } else {
                tag = 'Update';
                counts.updates++;
              }
            } else {
              counts.new++;
            }
          } else {
             counts.new++;
          }
        }
        
        return {
          ...c,
          tag,
          reason: errors.join(', ')
        };
      });

      setCandidates(validated);
      setStats(counts);
      setStep(3);
    } catch (err) {
      console.error('[Preview] Error:', err);
      setToast({ message: 'Validation failed.', type: 'error' });
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0, status: '' });
    }
  };

  const toggleRowAction = (index) => {
     const updated = [...candidates];
     updated[index].action = updated[index].action === 'reject' ? 'process' : 'reject';
     setCandidates(updated);
     
     // Recalculate stats
     let counts = { new: 0, updates: 0, duplicates: 0, errors: 0 };
     updated.forEach(c => {
        if (c.action === 'reject') return;
        if (c.tag === 'New') counts.new++;
        else if (c.tag === 'Update') counts.updates++;
        else if (c.tag === 'Duplicate') counts.duplicates++;
        else if (c.tag === 'Error') counts.errors++;
     });
     setStats(counts);
  };

  const downloadErrorReport = () => {
     const errors = candidates.filter(c => c.tag === 'Error' || c.tag === 'Duplicate' || c.action === 'reject');
     if (errors.length === 0) {
        setToast({ message: 'No errors to download.', type: 'info' });
        return;
     }
     
     const csvRows = [
       ['Row Index', 'Action', 'Student Name', 'USN', 'Date', 'Attendance', 'Reason'],
       ...errors.map(c => [`Row ${c.source_row}`, c.action === 'reject' ? 'Rejected' : c.tag, c.student_name, c.usn, c.date, c.present, c.reason])
     ];
     
     const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "forge_track_import_errors.csv");
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  // --- Step 4: Import Execution ---
  const handleImport = async () => {
    try {
      setIsProcessing(true);
      setImportStartTime(Date.now());
      const validCandidates = candidates.filter(c => c.action !== 'reject' && (c.tag === 'New' || c.tag === 'Update'));
      
      setProgress({ current: 0, total: validCandidates.length, status: 'Initializing import log...' });
      
      const logPayload = {
          filename: file.name,
          total_rows: validCandidates.length,
          status: 'processing',
          column_mapping: columnsMapping.reduce((acc, col) => ({ ...acc, [col.inferred_name]: col.target_field }), {})
      };

      const { data: log, error: logErr } = await supabase.from('import_log').insert(logPayload).select().single();
      
      if (logErr) throw logErr;

      setProgress({ current: 0, total: validCandidates.length, status: 'Resolving Sessions and Students...' });
      const uniqueDates = [...new Set(validCandidates.map(c => c.date))];
      const uniqueUSNs = [...new Set(validCandidates.map(c => c.usn))];
      
      const sessionMap = new Map();
      const studentMap = new Map();
      
      for (const date of uniqueDates) {
        let { data: sess } = await supabase.from('sessions').select('id').eq('date', date).maybeSingle();
        if (!sess) {
          const { data: newSess } = await supabase.from('sessions').insert({
            date,
            topic: aiConfig.inferred_session_topic || `Imported Session (${date})`,
            month_number: new Date(date).getMonth() + 1,
            duration_hours: 2,
            session_type: 'offline'
          }).select('id').single();
          sess = newSess;
        }
        sessionMap.set(date, sess.id);
      }

      for (const usn of uniqueUSNs) {
        const cInfo = validCandidates.find(c => c.usn === usn);
        let { data: stu } = await supabase.from('students').select('id').eq('usn', usn).maybeSingle();
        if (!stu) {
          const { data: newStu } = await supabase.from('students').insert({
            name: cInfo.student_name,
            usn: usn.toUpperCase(),
            branch_code: cInfo.branch_code || 'CS',
            is_active: true
          }).select('id').single();
          stu = newStu;
        }
        studentMap.set(usn, stu.id);
      }

      const attendancePayloads = validCandidates.map(c => ({
        student_id: studentMap.get(c.usn),
        session_id: sessionMap.get(c.date),
        present: c.present,
        marked_by: 'AI CSV Import'
      }));

      const CHUNK_SIZE = 50;
      let importedCount = 0;
      
      for (let i = 0; i < attendancePayloads.length; i += CHUNK_SIZE) {
        const chunk = attendancePayloads.slice(i, i + CHUNK_SIZE);
        setProgress({ current: i, total: attendancePayloads.length, status: `Inserting records ${i} to ${i + chunk.length}...` });
        
        await supabase.from('attendance').upsert(chunk, { onConflict: 'student_id,session_id' });
        importedCount += chunk.length;
      }
      
      setProgress({ current: attendancePayloads.length, total: attendancePayloads.length, status: 'Finalizing log...' });

      const finalLogPayload = {
         status: 'completed',
         rows_inserted: importedCount,
         duplicates_skipped: stats.duplicates,
         failed_rows: stats.errors + (validCandidates.length - importedCount),
         ai_confidence_score: aiConfig.overall_confidence
      };

      const { error: updateErr } = await supabase.from('import_log').update(finalLogPayload).eq('id', log.id);
      
      if (updateErr) {
         await supabase.from('import_log').update({
           status: 'completed',
           imported_rows: importedCount,
           column_mapping: { advanced_metrics: finalLogPayload }
         }).eq('id', log.id);
      }

      setImportResults({
        total: candidates.length,
        imported: importedCount,
        skipped: stats.duplicates,
        failed: stats.errors + (validCandidates.length - importedCount)
      });
      setStep(4);
      setToast({ message: 'Import completed successfully!', type: 'success' });

    } catch (err) {
      console.error('[Import] Error:', err);
      setToast({ message: 'Import encountered a fatal error', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredCandidates = candidates.filter(c => {
     if (filterTag === 'All') return true;
     return c.tag === filterTag;
  });

  // UI Renderers
  return (
    <div className="max-w-[1400px] mx-auto py-10 px-6 animate-fade-in">

      {/* Stepper Header — hidden on landing & AI thinking */}
      {step >= 1 && step !== 1.5 && (
      <div className="flex items-center justify-between mb-12">
        {[
          { n: 1, l: 'Upload', i: FileUp },
          { n: 2, l: 'AI Mapping', i: Brain },
          { n: 3, l: 'Validate', i: TableIcon },
          { n: 4, l: 'Complete', i: CheckCircle2 },
        ].map((s, idx) => (
          <div key={s.n} className={`flex items-center gap-3 ${
            Math.floor(step) === s.n ? 'text-accent-glow' : step > s.n ? 'text-success' : 'text-fg-tertiary'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
              Math.floor(step) === s.n
                ? 'border-accent-glow bg-accent-glow/10 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                : step > s.n
                ? 'border-success bg-success/10'
                : 'border-border-default'
            }`}>
              {step > s.n ? <CheckCircle2 size={18} /> : <s.i size={18} />}
            </div>
            <div className="hidden md:block">
              <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Step {s.n}</p>
              <p className="text-xs font-bold">{s.l}</p>
            </div>
            {idx < 3 && <div className="flex-1 h-px bg-border-subtle mx-3 hidden lg:block" />}
          </div>
        ))}
      </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-bg-void/80 backdrop-blur-sm flex flex-col items-center justify-center">
           <Loader2 className="w-12 h-12 text-accent-glow animate-spin mb-4" />
           <p className="text-lg font-bold text-fg-primary">{progress.status || 'Processing...'}</p>
           {progress.total > 0 && (
             <div className="w-64 mt-6">
                <div className="flex justify-between text-xs text-fg-tertiary mb-2 font-bold uppercase tracking-wider">
                   <span>Progress</span>
                   <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-surface-inset rounded-full overflow-hidden">
                   <div className="h-full bg-accent-glow transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
                </div>
             </div>
           )}
        </div>
      )}


      {/* --- Step 0: Landing --- */}
      {step === 0 && (
        <div className="space-y-14 animate-fade-in">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-glow/30 bg-accent-glow/5 text-accent-glow text-xs font-bold tracking-widest uppercase mb-2">
              <Sparkles size={12} /> Powered by Gemini 2.5 Flash
            </div>
            <h1 className="text-5xl font-black text-fg-primary tracking-tight leading-none">
              AI Attendance<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-glow to-info">Import Studio</span>
            </h1>
            <p className="text-fg-secondary text-lg max-w-xl mx-auto leading-relaxed">
              Upload attendance sheets in any format. ForgeTrack AI automatically understands structure,
              fixes inconsistencies, maps columns, and prepares clean attendance records.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              {FORMAT_BADGES.map(b => (
                <span key={b.label} className={`px-3 py-1 rounded-full border text-xs font-bold tracking-widest ${b.color}`}>{b.label}</span>
              ))}
            </div>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => { setStep(1); setTimeout(() => fileInputRef.current?.click(), 50); }}
            className="relative border-2 border-dashed border-border-default rounded-3xl p-16 flex flex-col items-center justify-center gap-6 hover:border-accent-glow/60 hover:bg-accent-glow/5 transition-all cursor-pointer group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent-glow/5 via-transparent to-info/5 pointer-events-none" />
            <div className="w-24 h-24 rounded-2xl bg-surface-raised border border-border-subtle flex items-center justify-center text-fg-tertiary group-hover:text-accent-glow group-hover:scale-110 group-hover:border-accent-glow/40 group-hover:bg-accent-glow/10 transition-all duration-300 shadow-xl">
              <Upload size={36} />
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-fg-primary group-hover:text-accent-glow transition-colors">Drag &amp; Drop your Roster File</p>
              <p className="text-sm text-fg-tertiary mt-2">or click to browse &mdash; CSV, XLSX, XLS up to 5MB</p>
            </div>
            <input type="file" ref={fileInputRef} onChange={(e) => { if(e.target.files[0]) processFile(e.target.files[0]); }} className="hidden" accept=".csv,.xlsx,.xls" />
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { icon: Brain, title: 'AI Column Inference', desc: 'Gemini detects missing headers, pivoted tables, and attendance conventions automatically.', color: 'text-accent-glow' },
              { icon: Database, title: 'Duplicate Prevention', desc: 'Every row is cross-checked against live Supabase data using composite key deduplication.', color: 'text-success' },
              { icon: Download, title: 'Error Reports', desc: 'Download a full CSV error report for any rows that failed validation or import.', color: 'text-warning' },
            ].map(f => (
              <div key={f.title} className="p-6 rounded-2xl border border-border-subtle bg-surface-raised/30 hover:bg-surface-raised/60 hover:border-border-strong transition-all group">
                <f.icon size={24} className={f.color + ' mb-4 group-hover:scale-110 transition-transform'} />
                <h3 className="font-bold text-fg-primary mb-2">{f.title}</h3>
                <p className="text-sm text-fg-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Step 1: Upload (sheet selector) --- */}
      {step === 1 && (
        <div className="space-y-10 animate-fade-in">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-black text-fg-primary tracking-tight">Select Your File</h2>
            <p className="text-fg-secondary">Drag and drop or click to upload your attendance roster.</p>
          </div>
          {!sheets.length ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-border-default rounded-3xl p-20 flex flex-col items-center justify-center gap-6 hover:border-accent-glow hover:bg-surface-raised/40 transition-all cursor-pointer group shadow-lg bg-surface-raised/10"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".csv,.xlsx,.xls" />
              <div className="w-20 h-20 rounded-2xl bg-surface-raised flex items-center justify-center text-fg-tertiary group-hover:text-accent-glow group-hover:scale-110 transition-all">
                <FileSpreadsheet size={32} />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-fg-primary">Drag &amp; Drop Roster File</p>
                <p className="text-sm text-fg-tertiary mt-1">Supports CSV, XLSX (Max 5MB)</p>
              </div>
            </div>
          ) : (
            <div className="card p-8 border border-border-subtle rounded-2xl bg-surface-raised/30 max-w-xl mx-auto text-center space-y-6">
              <FileSpreadsheet size={40} className="text-accent-glow mx-auto opacity-80" />
              <div>
                <h3 className="text-lg font-bold text-fg-primary">Multiple Sheets Detected</h3>
                <p className="text-sm text-fg-secondary mt-1">Select which sheet contains the attendance data.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2">
                {sheets.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSheet(s)}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all ${selectedSheet === s ? 'border-accent-glow bg-accent-glow/10 text-accent-glow' : 'border-border-default hover:bg-surface-raised text-fg-secondary'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={() => processExcelSheet(workbook, selectedSheet)}
                className="btn-primary w-full py-3 rounded-xl shadow-raised text-sm font-bold"
              >
                Extract Data from Selected Sheet
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- Step 1.5: AI Processing State --- */}
      {step === 1.5 && (
        <div className="max-w-lg mx-auto text-center space-y-10 py-16 animate-fade-in">
          {/* Animated orb */}
          <div className="relative w-40 h-40 mx-auto">
            <div className="absolute inset-0 rounded-full border-[3px] border-accent-glow/20 border-t-accent-glow animate-spin" style={{ animationDuration: '1.2s' }} />
            <div className="absolute inset-3 rounded-full border-[3px] border-info/20 border-b-info animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            <div className="absolute inset-6 rounded-full border-[3px] border-success/20 border-r-success animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain size={44} className="text-accent-glow drop-shadow-[0_0_12px_rgba(99,102,241,0.8)]" style={{ animation: 'pulse 2s infinite' }} />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-fg-primary">Gemini is Analyzing...</h2>
            <div className="h-7 relative overflow-hidden">
              <p className="text-fg-secondary font-mono text-sm absolute inset-0 flex items-center justify-center" key={aiMessageIndex}>
                {AI_MESSAGES[aiMessageIndex].text}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-[11px] text-fg-tertiary font-bold uppercase tracking-widest">
              <span>AI Analysis Progress</span>
              <span>{aiProgress}%</span>
            </div>
            <div className="h-2 w-full bg-surface-inset rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-glow to-info rounded-full transition-all duration-700"
                style={{ width: aiProgress + '%' }}
              />
            </div>
          </div>

          {/* Message Log */}
          <div className="p-4 rounded-2xl bg-surface-raised/40 border border-border-subtle text-left space-y-2 max-h-44 overflow-hidden">
            {AI_MESSAGES.slice(0, aiMessageIndex + 1).map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={12} className={i < aiMessageIndex ? 'text-success' : 'text-accent-glow animate-pulse'} />
                <span className={i < aiMessageIndex ? 'text-fg-tertiary line-through' : 'text-fg-secondary font-bold'}>{m.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Step 2: AI Mapping --- */}
      {step === 2 && (
        <div className="space-y-8 animate-slide-up">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-fg-primary">AI Inference Review</h2>
              <p className="text-sm text-fg-secondary mt-1">Gemini has analyzed your sheet structure. Verify the mapping below.</p>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={proceedToPreview} className="btn-primary flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold shadow-raised">
                 Next: Validate Deduplication <ChevronRight size={16} />
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
             {/* LEFT PANEL: Mappings & Reasoning */}
             <div className="lg:col-span-1 space-y-6">
                {/* AI Reasoning Panel */}
                <div className="card border border-border-subtle rounded-2xl bg-surface-raised/20 overflow-hidden shadow-lg shadow-black/50">
                   <button 
                     onClick={() => setShowReasoning(!showReasoning)}
                     className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-raised/40 transition-colors border-b border-border-subtle"
                   >
                     <div className="flex items-center gap-2 text-accent-glow font-bold text-sm">
                       <Sparkles size={16} /> AI Reasoning
                     </div>
                     {showReasoning ? <ChevronUp size={16} className="text-fg-tertiary" /> : <ChevronDown size={16} className="text-fg-tertiary" />}
                   </button>
                   {showReasoning && (
                     <div className="p-5 space-y-4 bg-surface-inset/30">
                        <div>
                          <p className="text-[10px] text-fg-tertiary uppercase font-black tracking-widest mb-1">Sheet Structure</p>
                          <div className={`px-2 py-1 rounded text-xs font-bold inline-block border ${aiConfig.is_pivoted ? 'bg-info-bg text-info border-info-border' : 'bg-surface-inset text-fg-tertiary border-border-subtle'}`}>
                             {aiConfig.is_pivoted ? 'Pivoted Attendance' : 'Standard List'}
                          </div>
                        </div>
                        <div>
                           <p className="text-[10px] text-fg-tertiary uppercase font-black tracking-widest mb-1">Inference Summary</p>
                           <p className="text-xs text-fg-secondary leading-relaxed">{aiConfig.reasoning}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-fg-tertiary uppercase font-black tracking-widest mb-1">Overall Confidence</p>
                           <div className="w-full bg-surface-inset h-2 rounded-full overflow-hidden">
                              <div className="h-full bg-success transition-all" style={{ width: `${aiConfig.overall_confidence}%` }} />
                           </div>
                           <p className="text-[10px] text-fg-tertiary mt-1 font-bold">{aiConfig.overall_confidence}% Match</p>
                        </div>
                     </div>
                   )}
                </div>

                {/* Column Mappings list */}
                <div className="card p-5 border border-border-subtle rounded-2xl bg-canvas space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                   <h3 className="text-[10px] text-fg-tertiary uppercase font-black tracking-widest sticky top-0 bg-canvas py-1 z-10 border-b border-border-subtle mb-3 pb-2">Detected Columns ({columnsMapping.length})</h3>
                   {columnsMapping.map((col) => (
                      <div key={col.index} className="p-3 border border-border-default rounded-xl bg-surface-raised/40 space-y-2 relative overflow-hidden group hover:border-accent-glow/50 transition-colors">
                         <div className="flex items-start justify-between gap-2">
                           <div>
                              {!col.original_header ? (
                                <p className="text-xs font-bold text-accent-glow flex items-center gap-1.5 mb-1"><Sparkles size={12} /> AI Inferred</p>
                              ) : (
                                <p className="text-[10px] text-fg-tertiary font-bold mb-1">Original: {col.original_header}</p>
                              )}
                              <p className="text-sm font-bold text-fg-primary truncate" title={col.inferred_name}>{col.inferred_name}</p>
                           </div>
                           <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-black border ${col.confidence > 90 ? 'bg-success-bg text-success border-success-border' : col.confidence > 60 ? 'bg-warning-bg text-warning border-warning-border' : 'bg-danger-bg text-danger border-danger-border'}`}>
                             {col.confidence}%
                           </div>
                         </div>
                         <select 
                           value={col.target_field}
                           onChange={(e) => updateColumnMapping(col.index, e.target.value)}
                           className="input w-full h-8 text-xs py-0"
                         >
                           {TARGET_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                         </select>
                      </div>
                   ))}
                </div>
             </div>

             {/* RIGHT PANEL: Data Preview Grid */}
             <div className="lg:col-span-3">
                <div className="card border border-border-subtle rounded-2xl overflow-hidden bg-canvas h-full flex flex-col shadow-lg shadow-black/50">
                   <div className="px-6 py-4 border-b border-border-subtle bg-surface-raised/40 flex justify-between items-center">
                     <h3 className="text-xs font-bold text-fg-primary uppercase tracking-widest flex items-center gap-2">
                       <TableIcon size={14} /> Full Dataset Preview
                     </h3>
                     <span className="text-xs text-fg-tertiary font-mono">{rawData.length - 1} rows detected</span>
                   </div>
                   <div className="overflow-auto flex-1 max-h-[800px] custom-scrollbar">
                      <table className="w-full text-left whitespace-nowrap">
                         <thead className="bg-surface-inset sticky top-0 z-10 shadow-sm border-b border-border-subtle">
                            <tr>
                               {columnsMapping.map(col => (
                                  <th key={col.index} className="px-4 py-3 border-r border-border-subtle last:border-0 bg-surface-inset">
                                     <div className="flex flex-col">
                                        <span className="text-[10px] text-fg-tertiary uppercase font-black tracking-widest truncate max-w-[150px]">{col.inferred_name}</span>
                                        <span className={`text-[10px] font-bold mt-1 ${col.target_field === 'IGNORE' ? 'text-fg-tertiary opacity-50' : 'text-accent-glow'}`}>
                                          → {col.target_field}
                                        </span>
                                     </div>
                                  </th>
                               ))}
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-border-subtle">
                            {rawData.slice(1, 100).map((row, rIdx) => (
                               <tr key={rIdx} className="hover:bg-surface-raised/30 transition-colors">
                                  {columnsMapping.map(col => (
                                     <td key={col.index} className={`px-4 py-2 text-xs border-r border-border-subtle last:border-0 ${col.target_field === 'IGNORE' ? 'opacity-30' : 'text-fg-secondary font-mono'}`}>
                                        {row[col.index] !== undefined && row[col.index] !== null && row[col.index] !== '' ? row[col.index] : <span className="text-fg-tertiary opacity-30 italic">empty</span>}
                                     </td>
                                  ))}
                               </tr>
                            ))}
                         </tbody>
                      </table>
                      {rawData.length > 101 && (
                        <div className="p-4 text-center text-xs text-fg-tertiary font-bold bg-surface-inset border-t border-border-subtle">
                           + {rawData.length - 101} more rows hidden in preview to save memory. They will be processed during validation.
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- Step 3: Validation --- */}
      {step === 3 && (
        <div className="space-y-8 animate-slide-up">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-fg-primary">Deduplication & Validation</h2>
              <p className="text-sm text-fg-secondary mt-1">Memory flattening complete. Cross-checked {candidates.length} unique records with Supabase.</p>
            </div>
            <div className="flex items-center gap-3">
               <button onClick={() => setStep(2)} className="px-6 py-2.5 rounded-xl border border-border-default hover:bg-surface-raised text-fg-tertiary text-sm font-bold transition-all">Back</button>
               <button 
                 onClick={handleImport}
                 disabled={stats.new + stats.updates === 0}
                 className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                    stats.new + stats.updates > 0 ? 'btn-primary shadow-accent-glow/20' : 'bg-surface-inset text-fg-tertiary cursor-not-allowed border border-border-subtle'
                 }`}
               >
                 <Database size={16} /> Execute Batch ({stats.new + stats.updates})
               </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
             <button onClick={() => setFilterTag('New')} className={`card p-5 border rounded-2xl flex items-center justify-between transition-all ${filterTag === 'New' ? 'border-success bg-success-bg/30 ring-2 ring-success/20' : 'border-success-border bg-success-bg/10 hover:bg-success-bg/20'}`}>
                <div className="text-left">
                   <p className="text-[10px] text-success uppercase font-black tracking-widest mb-1">Ready for Insert</p>
                   <p className="text-fg-secondary text-xs">Clean new records</p>
                </div>
                <p className="text-3xl font-black text-success">{stats.new}</p>
             </button>
             <button onClick={() => setFilterTag('Update')} className={`card p-5 border rounded-2xl flex items-center justify-between transition-all ${filterTag === 'Update' ? 'border-info bg-info-bg/30 ring-2 ring-info/20' : 'border-info-border bg-info-bg/10 hover:bg-info-bg/20'}`}>
                <div className="text-left">
                   <p className="text-[10px] text-info uppercase font-black tracking-widest mb-1">Status Updates</p>
                   <p className="text-fg-secondary text-xs">Existing row, new value</p>
                </div>
                <p className="text-3xl font-black text-info">{stats.updates}</p>
             </button>
             <button onClick={() => setFilterTag('Duplicate')} className={`card p-5 border rounded-2xl flex items-center justify-between transition-all ${filterTag === 'Duplicate' ? 'border-warning bg-warning-bg/30 ring-2 ring-warning/20' : 'border-warning-border bg-warning-bg/10 hover:bg-warning-bg/20'}`}>
                <div className="text-left">
                   <p className="text-[10px] text-warning uppercase font-black tracking-widest mb-1">Duplicates Skipped</p>
                   <p className="text-fg-secondary text-xs">Exact match in DB</p>
                </div>
                <p className="text-3xl font-black text-warning">{stats.duplicates}</p>
             </button>
             <button onClick={() => setFilterTag('Error')} className={`card p-5 border rounded-2xl flex items-center justify-between transition-all ${filterTag === 'Error' ? 'border-danger bg-danger-bg/30 ring-2 ring-danger/20' : 'border-danger-border bg-danger-bg/10 hover:bg-danger-bg/20'}`}>
                <div className="text-left">
                   <p className="text-[10px] text-danger uppercase font-black tracking-widest mb-1">Invalid Rows</p>
                   <p className="text-fg-secondary text-xs">Missing critical data</p>
                </div>
                <p className="text-3xl font-black text-danger">{stats.errors}</p>
             </button>
          </div>

          <div className="card border border-border-subtle rounded-2xl overflow-hidden bg-canvas shadow-xl shadow-black/50">
             <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-surface-raised/50">
                <div className="flex items-center gap-4">
                  <h3 className="text-xs font-bold text-fg-primary uppercase tracking-widest">Reviewing: {filterTag}</h3>
                  {filterTag !== 'All' && (
                     <button onClick={() => setFilterTag('All')} className="text-xs text-accent-glow font-bold hover:underline">Clear Filter</button>
                  )}
                </div>
                <button 
                  onClick={downloadErrorReport} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle hover:bg-surface-inset text-xs font-bold text-fg-secondary transition-all"
                >
                  <Download size={14} /> Export Error Report
                </button>
             </div>
             <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                   <thead className="bg-surface-inset sticky top-0 z-10 shadow-sm border-b border-border-subtle">
                      <tr>
                        <th className="px-6 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest">Validation Status</th>
                        <th className="px-6 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest">Student Name</th>
                        <th className="px-6 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest">USN</th>
                        <th className="px-6 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest">Standardized Date</th>
                        <th className="px-6 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest">Attendance</th>
                        <th className="px-6 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest text-right">Row Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border-subtle">
                      {filteredCandidates.slice(0, 500).map((c, i) => (
                        <tr key={i} className={`transition-colors ${c.action === 'reject' ? 'bg-danger-bg/5 opacity-50' : 'hover:bg-surface-raised/30'}`}>
                           <td className="px-6 py-3">
                              {c.action === 'reject' ? (
                                 <span className="inline-flex items-center gap-1.5 text-[10px] text-fg-tertiary font-black px-2.5 py-1 rounded-md bg-surface-inset border border-border-subtle uppercase tracking-widest line-through">Rejected</span>
                              ) : (
                                 <>
                                    {c.tag === 'New' && <span className="inline-flex items-center gap-1.5 text-[10px] text-success font-black px-2.5 py-1 rounded-md bg-success-bg border border-success-border uppercase tracking-widest"><CheckCircle2 size={12}/> New</span>}
                                    {c.tag === 'Update' && <span className="inline-flex items-center gap-1.5 text-[10px] text-info font-black px-2.5 py-1 rounded-md bg-info-bg border border-info-border uppercase tracking-widest"><RefreshCcw size={12}/> Update</span>}
                                    {c.tag === 'Duplicate' && <span className="inline-flex items-center gap-1.5 text-[10px] text-warning font-black px-2.5 py-1 rounded-md bg-warning-bg border border-warning-border uppercase tracking-widest"><AlertCircle size={12}/> Skip</span>}
                                    {c.tag === 'Error' && <span className="inline-flex items-center gap-1.5 text-[10px] text-danger font-black px-2.5 py-1 rounded-md bg-danger-bg border border-danger-border uppercase tracking-widest"><X size={12}/> Error</span>}
                                 </>
                              )}
                              {c.reason && <p className="text-[9px] text-danger mt-1 font-bold">{c.reason}</p>}
                           </td>
                           <td className="px-6 py-3 text-sm font-bold text-fg-primary">{c.student_name || <span className="text-danger italic text-xs">Missing</span>}</td>
                           <td className="px-6 py-3 text-xs font-mono text-fg-secondary">{c.usn || <span className="text-danger italic">Missing</span>}</td>
                           <td className="px-6 py-3 text-xs font-mono text-fg-tertiary">{c.date || <span className="text-danger italic">Missing</span>}</td>
                           <td className="px-6 py-3">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${c.present ? 'text-success bg-success-bg' : c.present === false ? 'text-danger bg-danger-bg' : 'text-fg-tertiary bg-surface-inset'}`}>
                                 {c.present ? 'Present' : c.present === false ? 'Absent' : 'Unknown'}
                              </span>
                           </td>
                           <td className="px-6 py-3 text-right">
                               <button 
                                 onClick={() => toggleRowAction(candidates.indexOf(c))}
                                 className={`p-2 rounded-lg transition-colors ${c.action === 'reject' ? 'bg-success-bg text-success hover:bg-success/20' : 'bg-surface-inset text-fg-tertiary hover:bg-danger-bg hover:text-danger'}`}
                                 title={c.action === 'reject' ? 'Restore Row' : 'Reject Row'}
                               >
                                  {c.action === 'reject' ? <Check size={14} /> : <Trash2 size={14} />}
                               </button>
                           </td>
                        </tr>
                      ))}
                      {filteredCandidates.length === 0 && (
                         <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-fg-secondary">No rows match this filter.</td>
                         </tr>
                      )}
                      {filteredCandidates.length > 500 && (
                         <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-xs font-bold text-fg-tertiary bg-surface-inset/50">
                               + {filteredCandidates.length - 500} more rows truncated for performance.
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {/* --- Step 4: Results --- */}
      {step === 4 && (
        <div className="max-w-2xl mx-auto text-center space-y-10 py-10 animate-scale-in">
           <div className="w-32 h-32 rounded-full bg-success-bg border-4 border-success flex items-center justify-center mx-auto text-success shadow-[0_0_50px_rgba(var(--success-rgb),0.3)]">
              <CheckCircle2 size={64} />
           </div>
           <div className="space-y-4">
              <h2 className="text-display-sm font-black text-fg-primary tracking-tight">Enterprise Import Complete</h2>
              <p className="text-fg-secondary">Your attendance data has been successfully mapped, deduplicated, and integrated into the live Supabase database.</p>
           </div>
           
           <div className="grid grid-cols-3 gap-4">
              <div className="p-6 bg-surface-raised/80 rounded-2xl border border-border-subtle shadow-lg">
                 <p className="text-display-xs font-black text-success">{importResults?.imported}</p>
                 <p className="text-[10px] text-fg-tertiary uppercase font-bold tracking-widest mt-1">Rows Inserted</p>
              </div>
              <div className="p-6 bg-surface-raised/80 rounded-2xl border border-border-subtle shadow-lg">
                 <p className="text-display-xs font-black text-warning">{importResults?.skipped}</p>
                 <p className="text-[10px] text-fg-tertiary uppercase font-bold tracking-widest mt-1">Duplicates Skipped</p>
              </div>
              <div className="p-6 bg-surface-raised/80 rounded-2xl border border-border-subtle shadow-lg">
                 <p className="text-display-xs font-black text-danger">{importResults?.failed}</p>
                 <p className="text-[10px] text-fg-tertiary uppercase font-bold tracking-widest mt-1">Invalid Rows Rejected</p>
              </div>
           </div>
           
           <div className="flex items-center justify-center gap-4 text-xs font-bold text-fg-tertiary pb-4">
              <span>Time Taken: {((Date.now() - importStartTime) / 1000).toFixed(1)}s</span>
              <span>•</span>
              <span>AI Confidence: {aiConfig.overall_confidence}%</span>
           </div>

           <div className="flex items-center justify-center gap-4">
              <button onClick={() => navigate('/dashboard')} className="btn-primary px-10 py-3 rounded-xl text-sm font-bold shadow-accent-glow/20 shadow-xl transition-all">Return to Dashboard</button>
              <button 
                onClick={() => { setStep(1); setFile(null); setSheets([]); setRawData([]); setColumnsMapping([]); setCandidates([]); }}
                className="px-10 py-3 rounded-xl border border-border-default hover:bg-surface-raised text-sm font-bold text-fg-secondary transition-all"
              >
                Import Another Roster
              </button>
           </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
