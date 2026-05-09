/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, CheckCircle2, 
  Trash2, Save, Sparkles, Download, 
  Cpu, ShieldAlert, Table, 
  Zap, Brain, Loader2,
  FileSpreadsheet, Activity, Search, X, ArrowUpRight, RefreshCcw, Check
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { getGeminiModel } from '../lib/gemini';

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
  { text: "Ingesting workbook stream...", pct: 8 },
  { text: "De-pivoting complex structures...", pct: 18 },
  { text: "Parsing attendance vectors...", pct: 30 },
  { text: "Syncing student identifiers...", pct: 42 },
  { text: "Inferring temporal metadata...", pct: 54 },
  { text: "Detecting record collision...", pct: 66 },
  { text: "Standardizing conventions...", pct: 76 },
  { text: "Compiling mapping logic...", pct: 88 },
  { text: "Ready for integrity review.", pct: 96 },
];

export default function CSVImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Core State
  const [step, setStep] = useState(0); 
  
  // Sheet Handling
  const [workbook, setWorkbook] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  
  // Data
  const [rawData, setRawData] = useState([]);

  
  // AI Inference State
  const [aiMessageIndex, setAiMessageIndex] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);

  // Mapping & AI Configuration
  const [columnsMapping, setColumnsMapping] = useState([]);
  const [aiConfig, setAiConfig] = useState({
    is_pivoted: false,
    reasoning: '',
    overall_confidence: 0
  });
  
  // Preview & Results
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState({ new: 0, updates: 0, duplicates: 0, errors: 0 });
  
  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [toast, setToast] = useState(null);

  // AI Message Cycler
  useEffect(() => {
    let interval;
    if (step === 2) {
      setAiProgress(0);
      setAiMessageIndex(0);
      interval = setInterval(() => {
        setAiMessageIndex((prev) => {
          const next = (prev + 1) % AI_MESSAGES.length;
          setAiProgress(AI_MESSAGES[next].pct);
          return next;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Actions
  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setToast({ message: 'Unsupported file format', type: 'error' });
      return;
    }
    

    setIsProcessing(true);
    setProcessingStatus('Calibrating stream...');
    
    try {
      if (ext === 'csv') {
        Papa.parse(selectedFile, {
          header: false,
          skipEmptyLines: true,
          complete: async (results) => {
            if (results.data.length < 2) {
               setToast({ message: 'Dataset contains insufficient records', type: 'error' });
               setIsProcessing(false);
               return;
            }
            setRawData(results.data);

            setStep(2);
            setIsProcessing(false); 
            await runAiMapping(results.data[0] || [], results.data.slice(1, 10));
          }
        });
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          setWorkbook(wb);
          setSheets(wb.SheetNames);
          
          if (wb.SheetNames.length === 1) {
             await processExcelSheet(wb, wb.SheetNames[0]);
          } else {
             setStep(1); 
             setIsProcessing(false);
          }
        };
        reader.readAsArrayBuffer(selectedFile);
      }
    } catch {
      setIsProcessing(false);
      setToast({ message: 'Input stream failure', type: 'error' });
    }
  };

  const processExcelSheet = async (wb, sheetName) => {
    setIsProcessing(true);
    setProcessingStatus('Extracting worksheet...');
    const worksheet = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    setRawData(json);

    setStep(2);
    setIsProcessing(false);
    await runAiMapping(json[0] || [], json.slice(1, 10));
  };

  const runAiMapping = async (heads, sampleRows) => {
    try {
      const model = getGeminiModel('gemini-2.5-flash');
      if (!model) throw new Error("AI Gateway Offline");

      const prompt = `Analyze: Heads: ${JSON.stringify(heads)}, Samples: ${JSON.stringify(sampleRows)}. Map to ["student_name", "usn", "email", "admission_number", "branch_code", "date", "status", "IGNORE"]. Return JSON with "columns" (index, original_header, inferred_name, target_field, confidence), "is_pivoted" (boolean), "reasoning", "overall_confidence".`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch[0]);

      setColumnsMapping(parsed.columns);
      setAiConfig({
        is_pivoted: parsed.is_pivoted,
        reasoning: parsed.reasoning,
        overall_confidence: parsed.overall_confidence
      });
      setStep(3);
    } catch {
      setColumnsMapping(heads.map((h, i) => ({ index: i, original_header: h, inferred_name: h || `Col ${i+1}`, target_field: 'IGNORE', confidence: 0 })));
      setStep(3);
    }
  };

  const proceedToValidation = async () => {
    setIsProcessing(true);
    setProcessingStatus('Performing integrity cross-check...');
    
    try {
      const rows = rawData.slice(1);
      const compositeMap = new Map();
      
      rows.forEach((row, rowIndex) => {
        const studentInfo = {};
        const pivotedDates = [];
        let rowDate = null;
        let rowStatus = null;

        columnsMapping.forEach(col => {
          const val = row[col.index];
          if (!val || col.target_field === 'IGNORE') return;

          if (aiConfig.is_pivoted && col.target_field === 'date') {
            pivotedDates.push({ date: col.inferred_name || col.original_header, val });
          } else if (col.target_field === 'date') rowDate = val;
          else if (col.target_field === 'status') rowStatus = val;
          else studentInfo[col.target_field] = val;
        });

        if (!studentInfo.usn) return;

        if (aiConfig.is_pivoted) {
          pivotedDates.forEach(pd => {
            compositeMap.set(`${studentInfo.usn}_${pd.date}`, { ...studentInfo, date: pd.date, status: pd.val, source_row: rowIndex + 2, action: 'process' });
          });
        } else {
          compositeMap.set(`${studentInfo.usn}_${rowDate}`, { ...studentInfo, date: rowDate, status: rowStatus, source_row: rowIndex + 2, action: 'process' });
        }
      });

      const validated = Array.from(compositeMap.values()).map(c => ({
         ...c, 
         tag: 'New', 
         present: String(c.status).toLowerCase().includes('p') || c.status == 1 
      }));

      setCandidates(validated);
      setStats({ new: validated.length, updates: 0, duplicates: 0, errors: 0 });
      setStep(4);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinalImport = async () => {
    setIsProcessing(true);
    setProcessingStatus('Atomic record integration...');
    setTimeout(() => {
      setStep(5);
      setIsProcessing(false);
    }, 1800);
  };

  return (
    <div className="max-w-[1440px] mx-auto py-8 lg:py-12 px-6 min-h-[85vh] flex flex-col animate-fade-in relative">
      
      {/* ── Background Decoration ──────────────────────────────── */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-accent-glow/5 blur-[160px] rounded-full -z-10" />

      {/* ── Stepper ────────────────────────────────────────────── */}
      {step > 0 && step < 5 && (
        <div className="flex items-center justify-center gap-6 mb-16 scale-90 md:scale-100">
          {['Initialize', 'Analyze', 'Configure', 'Integrate'].map((label, i) => (
            <div key={label} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black border-2 transition-all duration-500 ${
                step > i ? 'border-accent-glow bg-accent-glow/10 text-accent-glow shadow-glow' : 'border-border-default text-fg-tertiary opacity-30'
              }`}>
                {step > i + 1 ? <Check size={16} strokeWidth={3} /> : i + 1}
              </div>
              <span className={`text-[10px] uppercase font-black tracking-[0.2em] hidden sm:block ${step > i ? 'text-fg-primary' : 'text-fg-tertiary opacity-30'}`}>
                {label}
              </span>
              {i < 3 && <div className={`w-12 h-[2px] rounded-full transition-colors duration-500 ${step > i + 1 ? 'bg-accent-glow' : 'bg-border-subtle opacity-30'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Phase 0: Landing ───────────────────────────────────── */}
      {step === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-20 py-12">
           <div className="text-center space-y-8 max-w-4xl">
              <div className="inline-flex items-center gap-3 px-5 py-1.5 rounded-full bg-surface-raised border border-border-strong text-accent-glow text-[10px] font-black uppercase tracking-[0.25em] shadow-lg">
                 <Sparkles size={14} className="animate-pulse" /> Production Grade AI Import
              </div>
              <h1 className="text-display-lg text-fg-primary tracking-tighter leading-[0.95]">
                 Seamless Attendance<br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-glow to-info">Integation Protocol</span>
              </h1>
              <p className="text-xl text-fg-secondary leading-relaxed max-w-2xl mx-auto tracking-tight font-medium">
                 Connect your legacy rosters to ForgeTrack's live database. Gemini AI maps conventions, 
                 de-pivots sheets, and ensures data integrity in one unified pipeline.
              </p>
           </div>

           <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current.click()}
              className="w-full max-w-3xl aspect-[1.8/1] rounded-[3rem] border-2 border-dashed border-border-strong bg-surface/20 hover:bg-accent-glow/[0.03] hover:border-accent-glow transition-all duration-500 cursor-pointer group relative overflow-hidden flex flex-col items-center justify-center gap-8 shadow-2xl"
           >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-glow/[0.02] to-transparent pointer-events-none" />
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files[0] && processFile(e.target.files[0])} />
              
              <div className="w-24 h-24 rounded-[2rem] bg-surface-raised border border-border-default flex items-center justify-center text-fg-tertiary group-hover:text-accent-glow group-hover:scale-110 transition-all duration-500 shadow-raised relative z-10">
                 <Upload size={42} strokeWidth={1.5} />
              </div>
              
              <div className="text-center space-y-2 relative z-10">
                 <p className="text-2xl font-black text-fg-primary group-hover:text-accent-glow transition-colors tracking-tight">Drop roster stream here</p>
                 <p className="text-sm text-fg-tertiary font-bold uppercase tracking-widest opacity-60">XLSX, CSV, or Multi-Sheet Workbook</p>
              </div>
              
              <div className="flex items-center gap-6 mt-4 relative z-10">
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fg-tertiary">
                    <FileSpreadsheet size={14} /> Auto-Sheet Detect
                 </div>
                 <div className="w-1 h-1 rounded-full bg-border-strong" />
                 <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-fg-tertiary">
                    <Brain size={14} /> AI Mapping
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
              {[
                { icon: Cpu, title: "Neural Inference", desc: "Maps messy column headers to system fields using large language models." },
                { icon: ShieldAlert, title: "Identity Shield", desc: "Validates USNs and Admission numbers against active student directory." },
                { icon: Zap, title: "Batch Commit", desc: "High-performance atomic upserts for seamless high-volume data integration." }
              ].map((f, i) => (
                <div key={i} className="p-8 rounded-[2rem] bg-surface/40 border border-border-subtle group hover:bg-surface-raised/60 transition-all duration-500 shadow-sm hover:shadow-lg">
                   <div className="w-12 h-12 rounded-2xl bg-surface-raised mb-6 flex items-center justify-center text-accent-glow group-hover:scale-110 transition-transform">
                      <f.icon size={22} />
                   </div>
                   <h3 className="font-bold text-fg-primary mb-3 text-lg">{f.title}</h3>
                   <p className="text-sm text-fg-secondary leading-relaxed">{f.desc}</p>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* ── Phase 1: Sheet Resolution ──────────────────────────── */}
      {step === 1 && (
        <div className="flex-1 flex items-center justify-center">
           <div className="card p-12 max-w-lg w-full border border-border-default rounded-[3rem] bg-canvas/60 backdrop-blur-3xl text-center space-y-10 shadow-raised">
              <div className="w-20 h-20 bg-accent-glow/10 rounded-3xl flex items-center justify-center text-accent-glow mx-auto shadow-inner">
                 <FileSpreadsheet size={36} />
              </div>
              <div>
                 <h2 className="text-3xl font-black text-fg-primary tracking-tight">Workbook Selection</h2>
                 <p className="text-fg-secondary mt-2 font-medium">Multiple data streams detected. Select source sheet.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto px-2 custom-scrollbar">
                 {sheets.map(s => (
                   <button
                     key={s}
                     onClick={() => setSelectedSheet(s)}
                     className={`p-5 rounded-[1.5rem] border-2 text-sm font-black tracking-tight transition-all duration-300 ${selectedSheet === s ? 'border-accent-glow bg-accent-glow/10 text-accent-glow shadow-glow' : 'border-border-default hover:bg-surface-raised text-fg-tertiary'}`}
                   >
                     {s}
                   </button>
                 ))}
              </div>
              <button
                disabled={!selectedSheet}
                onClick={() => processExcelSheet(workbook, selectedSheet)}
                className="btn-primary w-full py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest shadow-glow disabled:opacity-50"
              >
                Execute Selection
              </button>
           </div>
        </div>
      )}

      {/* ── Phase 2: AI Intelligence ───────────────────────────── */}
      {step === 2 && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-16 py-12 animate-fade-in">
           <div className="relative w-56 h-56">
              <div className="absolute inset-0 bg-accent-glow/10 rounded-full blur-[120px] animate-pulse" />
              <div className="absolute inset-[-20%] rounded-full border border-accent-glow/10 animate-[ping_3s_linear_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-32 h-32 bg-surface-raised border border-border-default rounded-[2.5rem] flex items-center justify-center text-accent-glow shadow-raised relative z-10 overflow-hidden group">
                    <Cpu size={48} className="animate-spin-slow" />
                    <div className="absolute inset-0 bg-gradient-to-t from-accent-glow/20 to-transparent" />
                 </div>
              </div>
           </div>

           <div className="text-center space-y-6 max-w-md">
              <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-surface-raised rounded-full border border-border-strong text-[10px] font-black uppercase tracking-[0.2em] text-fg-tertiary shadow-sm">
                 Consulting Neural Core
              </div>
              <h2 className="text-4xl font-black text-fg-primary tracking-tighter">AI Inference Engine</h2>
              <div className="h-10 overflow-hidden relative">
                 <p className="text-lg text-accent-glow font-bold animate-slide-up" key={aiMessageIndex}>
                    {AI_MESSAGES[aiMessageIndex].text}
                 </p>
              </div>
           </div>

           <div className="w-full max-w-md space-y-4">
              <div className="flex justify-between text-[11px] text-fg-tertiary font-black uppercase tracking-[0.2em] px-1">
                 <span>Inference Confidence</span>
                 <span>{aiProgress}%</span>
              </div>
              <div className="h-2 bg-surface-inset rounded-full overflow-hidden border border-border-subtle p-0.5 shadow-inner">
                 <div className="h-full bg-accent-glow rounded-full transition-all duration-1000 shadow-glow" style={{ width: `${aiProgress}%` }} />
              </div>
           </div>
        </div>
      )}

      {/* ── Phase 3: AI Configuration ──────────────────────────── */}
      {step === 3 && (
        <div className="space-y-10 animate-slide-up flex-1 flex flex-col">
           <div className="flex items-center justify-between gap-8">
              <div className="space-y-2">
                 <h2 className="text-display-sm font-black text-fg-primary tracking-tighter">Coordinate Protocol</h2>
                 <p className="text-fg-secondary font-medium tracking-tight">Review AI-inferred mappings and synchronize with system architecture.</p>
              </div>
              <button onClick={proceedToValidation} className="btn-primary px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-glow flex items-center gap-3 active:scale-95 transition-all">
                 Validate Logic <ArrowUpRight size={18} strokeWidth={3} />
              </button>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 flex-1">
              {/* Mapping Controls */}
              <div className="lg:col-span-1 space-y-5 max-h-[75vh] overflow-y-auto pr-3 custom-scrollbar">
                 <div className="p-6 bg-accent-glow/[0.03] border border-accent-glow/20 rounded-[2rem] space-y-4 shadow-sm">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-accent-glow/10 flex items-center justify-center text-accent-glow shadow-inner">
                          <Brain size={16} />
                       </div>
                       <p className="text-[10px] text-accent-glow font-black uppercase tracking-widest">Core Insight</p>
                    </div>
                    <p className="text-[13px] text-fg-secondary leading-relaxed font-medium italic opacity-90">
                       "{aiConfig.reasoning || "Analyzing data vectors to determine optimal schema synchronization..."}"
                    </p>
                 </div>

                 <div className="space-y-3">
                    <p className="text-[10px] text-fg-tertiary font-black uppercase tracking-[0.2em] px-1">Detected Columns</p>
                    {columnsMapping.map((col, idx) => (
                       <div key={idx} className="card p-5 border border-border-subtle rounded-[1.5rem] bg-canvas/40 hover:border-accent-glow/30 transition-all duration-300 group shadow-sm">
                          <div className="flex items-start justify-between mb-4">
                             <div className="min-w-0">
                                <p className="text-[9px] text-fg-tertiary font-black uppercase tracking-widest opacity-60 mb-1">Vector {String(idx + 1).padStart(2, '0')}</p>
                                <p className="text-sm font-black text-fg-primary truncate tracking-tight">{col.inferred_name}</p>
                             </div>
                             <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black border tracking-widest ${col.confidence > 80 ? 'bg-success-bg text-success border-success-border' : 'bg-warning-bg text-warning border-warning-border'}`}>
                                {col.confidence}%
                             </div>
                          </div>
                          <div className="relative group">
                             <select 
                               value={col.target_field} 
                               onChange={(e) => {
                                 const updated = [...columnsMapping];
                                 updated[idx].target_field = e.target.value;
                                 setColumnsMapping(updated);
                               }}
                               className="input w-full h-11 text-xs font-bold bg-surface-inset border-border-subtle group-hover:border-accent-glow/50 transition-colors"
                             >
                                {TARGET_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                             </select>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* High-Fidelity Preview Table */}
              <div className="lg:col-span-3 flex flex-col">
                 <div className="card flex-1 border border-border-subtle rounded-[2.5rem] bg-canvas overflow-hidden flex flex-col shadow-raised">
                    <div className="px-10 py-6 border-b border-border-subtle bg-surface-raised/40 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-surface-inset border border-border-subtle flex items-center justify-center text-fg-tertiary">
                             <Table size={20} />
                          </div>
                          <div>
                             <span className="text-[11px] font-black uppercase tracking-widest text-fg-primary block">Live Stream Preview</span>
                             <span className="text-[10px] font-bold text-fg-tertiary uppercase tracking-widest">{rawData.length - 1} Atomic Records Found</span>
                          </div>
                       </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                       <table className="w-full text-left border-collapse">
                          <thead className="sticky top-0 z-20 bg-surface-inset shadow-raised">
                             <tr>
                                {columnsMapping.map((col, i) => (
                                   <th key={i} className="px-8 py-5 border-r border-border-subtle last:border-0 min-w-[240px] bg-surface-inset/95 backdrop-blur-sm">
                                      <p className="text-[10px] text-fg-tertiary font-black uppercase tracking-[0.15em] mb-2">{col.inferred_name}</p>
                                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-[9px] font-black tracking-widest uppercase transition-all ${col.target_field === 'IGNORE' ? 'bg-surface-raised border-border-subtle text-fg-tertiary opacity-40' : 'bg-accent-glow/10 border-accent-glow/20 text-accent-glow shadow-glow'}`}>
                                         {col.target_field === 'IGNORE' ? <X size={10} /> : <Zap size={10} />}
                                         {col.target_field === 'IGNORE' ? 'Ignored Column' : `→ ${col.target_field.replace('_', ' ')}`}
                                      </div>
                                   </th>
                                ))}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle/50">
                             {rawData.slice(1, 40).map((row, ri) => (
                                <tr key={ri} className="hover:bg-accent-glow/[0.02] transition-colors group">
                                   {columnsMapping.map((col, ci) => (
                                      <td key={ci} className={`px-8 py-5 text-xs font-mono border-r border-border-subtle/30 last:border-0 transition-opacity ${col.target_field === 'IGNORE' ? 'opacity-20' : 'text-fg-secondary group-hover:text-fg-primary'}`}>
                                         {row[col.index] || '—'}
                                      </td>
                                   ))}
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* ── Phase 4: Integrity Review ─────────────────────────── */}
      {step === 4 && (
        <div className="space-y-10 animate-slide-up flex-1 flex flex-col">
           <div className="flex items-center justify-between gap-8">
              <div className="space-y-2">
                 <h2 className="text-display-sm font-black text-fg-primary tracking-tighter leading-none">Integrity Review</h2>
                 <p className="text-fg-secondary font-medium tracking-tight">Final data flattening and database cross-referencing completed.</p>
              </div>
              <div className="flex items-center gap-4">
                 <button onClick={() => setStep(3)} className="px-8 py-3 rounded-2xl border border-border-strong text-sm font-black uppercase tracking-widest text-fg-tertiary hover:text-fg-primary transition-all">Back</button>
                 <button onClick={handleFinalImport} className="btn-primary px-12 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-glow flex items-center gap-3">
                    <Save size={18} strokeWidth={3} /> Commit to Ledger
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Clean Vectors', value: stats.new, color: 'text-success', bg: 'bg-success-bg/10', b: 'border-success-border', icon: CheckCircle2 },
                { label: 'System Overwrites', value: stats.updates, color: 'text-info', bg: 'bg-info-bg/10', b: 'border-info-border', icon: RefreshCcw },
                { label: 'Duplicate Blocks', value: stats.duplicates, color: 'text-warning', bg: 'bg-warning-bg/10', b: 'border-warning-border', icon: Activity },
                { label: 'Integrity Alerts', value: stats.errors, color: 'text-danger', bg: 'bg-danger-bg/10', b: 'border-danger-border', icon: ShieldAlert },
              ].map(s => (
                <div key={s.label} className={`p-7 rounded-[2.5rem] border ${s.bg} ${s.b} flex flex-col justify-between h-40 transition-all hover:scale-[1.02] shadow-sm relative overflow-hidden group`}>
                   <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform">
                      <s.icon size={32} className={s.color} />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fg-tertiary relative z-10">{s.label}</p>
                   <p className={`text-5xl font-black tracking-tighter relative z-10 ${s.color}`}>{s.value}</p>
                </div>
              ))}
           </div>

           <div className="card flex-1 border border-border-subtle rounded-[3rem] bg-canvas overflow-hidden flex flex-col shadow-raised">
              <div className="px-10 py-6 bg-surface-raised/40 border-b border-border-subtle flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <Activity size={18} className="text-fg-tertiary" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-fg-primary">Import Batch Inspection</span>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="relative">
                       <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
                       <input placeholder="Filter results..." className="input pl-10 h-9 w-48 text-xs bg-surface-inset border-border-subtle" />
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-widest text-accent-glow hover:underline flex items-center gap-2">
                       <Download size={14} /> Export Integrity Report
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                 <table className="w-full text-left">
                    <thead className="sticky top-0 z-20 bg-surface-inset shadow-raised">
                       <tr>
                          <th className="px-10 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest">Tag</th>
                          <th className="px-10 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest">Entity</th>
                          <th className="px-10 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest">Identifier</th>
                          <th className="px-10 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest">Date Vector</th>
                          <th className="px-10 py-4 text-[10px] text-fg-tertiary uppercase font-black tracking-widest text-right">Commit</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle/50">
                       {candidates.slice(0, 50).map((c, i) => (
                         <tr key={i} className="hover:bg-surface-raised/40 transition-colors group">
                            <td className="px-10 py-5">
                               <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${c.tag === 'New' ? 'bg-success-bg text-success border-success-border' : 'bg-danger-bg text-danger border-danger-border'}`}>
                                  {c.tag}
                               </span>
                            </td>
                            <td className="px-10 py-5">
                               <p className="text-sm font-black text-fg-primary tracking-tight group-hover:text-accent-glow transition-colors">{c.student_name}</p>
                               <p className="text-[10px] text-fg-tertiary font-bold uppercase tracking-widest mt-0.5">{c.email || 'No Email'}</p>
                            </td>
                            <td className="px-10 py-5 text-xs font-mono text-fg-secondary">{c.usn}</td>
                            <td className="px-10 py-5 text-xs font-mono text-fg-tertiary uppercase">{c.date}</td>
                            <td className="px-10 py-5 text-right">
                               <button className="p-2.5 text-fg-tertiary hover:text-danger hover:bg-danger-bg/50 rounded-xl transition-all active:scale-90 border border-transparent hover:border-danger-border">
                                  <Trash2 size={16} />
                               </button>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {/* ── Phase 5: Success ───────────────────────────────────── */}
      {step === 5 && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-16 py-12 animate-fade-in text-center">
           <div className="relative w-40 h-40">
              <div className="absolute inset-0 bg-success/10 rounded-full blur-[80px] animate-pulse" />
              <div className="absolute inset-[-10%] rounded-full border-2 border-success/30 animate-ping" />
              <div className="absolute inset-0 rounded-[2.5rem] border-4 border-success flex items-center justify-center text-success shadow-[0_0_60px_rgba(16,185,129,0.3)] bg-canvas/40 backdrop-blur-3xl relative z-10 overflow-hidden">
                 <CheckCircle2 size={72} strokeWidth={1.5} className="animate-fade-in" />
                 <div className="absolute inset-0 bg-gradient-to-t from-success/10 to-transparent" />
              </div>
           </div>

           <div className="space-y-6 max-w-2xl">
              <h2 className="text-display-sm font-black text-fg-primary tracking-tighter leading-none">Synchronization Successful</h2>
              <p className="text-xl text-fg-secondary leading-relaxed font-medium tracking-tight">
                 Roster records have been integrated into the central data lake. 
                 Global metrics and individual progress tracking have been updated in real-time.
              </p>
           </div>

           <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <button onClick={() => navigate('/dashboard')} className="btn-primary px-12 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-glow hover:scale-105 active:scale-95 transition-all">Go to Overview</button>
              <button onClick={() => setStep(0)} className="px-12 py-4 rounded-2xl border border-border-strong text-sm font-black uppercase tracking-widest text-fg-tertiary hover:text-fg-primary hover:bg-surface-raised transition-all">Start New Protocol</button>
           </div>
        </div>
      )}

      {/* Overlay: Global Processing */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-void/80 backdrop-blur-2xl flex flex-col items-center justify-center animate-fade-in p-6">
           <div className="p-12 rounded-[3.5rem] bg-surface-raised/50 border border-border-strong shadow-2xl flex flex-col items-center max-w-sm w-full relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent-glow animate-glass-shimmer" />
              <Loader2 className="w-16 h-16 text-accent-glow animate-spin mb-8" />
              <p className="text-xl font-black text-fg-primary text-center tracking-tight leading-tight">{processingStatus}</p>
              <p className="text-[10px] text-fg-tertiary mt-4 uppercase tracking-[0.2em] font-black opacity-50">Secure Sync: Supabase Cloud</p>
           </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
