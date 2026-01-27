import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { 
  ClipboardPaste, TrendingUp, AlertCircle, Loader2, User, ListTodo, ShieldCheck, 
  ArrowUpRight, AlertTriangle, LayoutDashboard, X, Eye, FileDown, ThumbsUp, Activity, Database, Settings, Scale, Brain, Calendar, MessageSquareText, Hash, Printer, Users, CheckCircle2, ExternalLink, Filter, Check, ChevronDown, Download
} from 'lucide-react';

// --- STYLES ET CLASSES ---
const cardClass = "bg-white rounded-3xl p-6 shadow-sm border border-blue-50 transition-all hover:shadow-lg";

// --- MOTEUR D'AUDIT LOCAL DÉVELOPPÉ (6 CLÉS) ---
const runDetailedAudit = (averages, isAgency = false) => {
  if (!averages) return [];

  const check = (val, threshold, label, successMsg, failMsg, isMax = true, suffix = "") => {
    const num = parseFloat(val);
    const met = isMax ? num <= threshold : num >= threshold;
    const valueDisplay = `${num}${suffix}`;
    const targetDisplay = isMax ? `≤ ${threshold}${suffix}` : `≥ ${threshold}${suffix}`;
    
    const subject = isAgency ? "L'agence affiche" : "La moyenne est de";

    return {
      label,
      met,
      summary: met ? successMsg : failMsg,
      numericalDetail: `Pourquoi ? Car ${subject} ${valueDisplay} pour une cible de ${targetDisplay}.`
    };
  };

  return [
    check(averages.rPortePres, 3, "Portes / Présents", "L'accroche est maîtrisée, le passage en présentation est fluide.", "L'accroche initiale manque de percussion."),
    check(averages.rPresProsp, 2, "Présents / Prospects", "Bonne détection du besoin pendant la présentation.", "La phase de découverte doit être approfondie."),
    check(averages.rProspClose, 2, "Prospects / Closing", "Très bon tri des prospects, l'engagement est fort.", "Difficulté à transformer l'intérêt en engagement."),
    check(averages.rClosingBC, 2, "Closing / BC", "Conclusion sécurisée, la qualité des BC est excellente.", "La phase de conclusion doit être plus sécurisée."),
    check(averages.valBC, 12, "BC / Jour", "Rythme de production conforme aux standards.", "Volume de BC moyen insuffisant sur la période.", false),
    check(averages.attendance, 100, "Taux de présence", "Assiduité exemplaire sur la période.", "Présence irrégulière impactant les résultats.", false, "%")
  ];
};

// --- COMPOSANTS DE L'INTERFACE ---

const SidebarLink = ({ active, onClick, icon, label, disabled }) => (
  <button 
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-black transition-all ${
      disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 hover:text-white'
    } ${active ? 'bg-white text-[#0033a0] shadow-xl' : 'text-blue-100'}`}
  >
    <span className="shrink-0">{icon}</span>
    <span className="truncate text-left">{label}</span>
  </button>
);

const RuleItem = ({ label, target }) => (
  <div className="flex items-center justify-between text-[9px] bg-white/10 p-2.5 rounded-lg border border-white/5 backdrop-blur-sm text-left">
    <span className="font-bold text-blue-50 text-left uppercase tracking-tighter">{label}</span>
    <span className={`font-black ${target.includes('≥') || target.includes('100') ? 'text-emerald-300' : 'text-blue-200'}`}>{target}</span>
  </div>
);

const StatBox = ({ label, value, threshold, isMax = true, isAverage = false, suffix = "", colorTheme = "default" }) => {
  const numValue = parseFloat(value);
  const isTargetMet = isMax ? numValue <= threshold : numValue >= threshold;
  
  const colors = {
    default: isTargetMet ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100',
    agency: isTargetMet ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'
  };

  const textColors = {
    default: isTargetMet ? 'text-emerald-700' : 'text-rose-700',
    agency: isTargetMet ? 'text-blue-700' : 'text-rose-700'
  };

  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden ${colors[colorTheme]} shadow-sm print:p-1`}>
      <span className="text-[6px] font-black text-slate-400 uppercase mb-0.5 tracking-widest text-center leading-tight h-4 overflow-hidden print:text-[5px]">{label}</span>
      <span className={`text-base font-black ${textColors[colorTheme]} print:text-[11px]`}>{value}{suffix}</span>
      <span className="text-[5px] font-bold text-slate-300 uppercase tracking-tighter">{isAverage ? "MOYENNE" : "ACTUEL"}</span>
    </div>
  );
};

// --- COMPOSANT DROPDOWN MULTI-SÉLECTION ---
const MultiSelectDropdown = ({ label, options, selected, onToggle, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
        <Icon size={14} /> {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-[#0033a0] transition-all"
      >
        <span className="text-xs font-bold text-slate-700 truncate mr-2">
          {selected.length === 0 ? "Tous sélectionnés" : `${selected.length} sélectionné(s)`}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((opt) => (
            <button
              key={`opt-${opt}`}
              type="button"
              onClick={() => onToggle(opt)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-[11px] font-black uppercase transition-colors mb-1 last:mb-0 ${
                selected.includes(opt) ? 'bg-blue-50 text-[#0033a0]' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span>{opt}</span>
              {selected.includes(opt) && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- APPLICATION PRINCIPALE ---

export default function App() {
  const [tab, setTab] = useState('import');
  const [pastedData, setPastedData] = useState('');
  const [analysisResults, setAnalysisResults] = useState({});
  const [agencyAudit, setAgencyAudit] = useState([]);
  const [managerComments, setManagerComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  // Filtres
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedWeeks, setSelectedWeeks] = useState([]);

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Injection du script html2pdf
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.html2pdf) {
      const s = document.createElement('script');
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  // Parsing des données brutes
  const rawDataEntries = useMemo(() => {
    if (!pastedData || pastedData.trim().length < 10) return [];
    const lines = pastedData.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(/[|\t]/).map(h => h.trim().toLowerCase());
    const f = (k) => headers.findIndex(h => k.some(x => h.includes(x)));
    
    const idx = { 
      name: f(["nom"]), 
      semaine: f(["semaine"]), 
      mois: f(["mois"]), 
      date: f(["date"]), 
      po: f(["portes"]), 
      pr: f(["présent"]), 
      ps: f(["prospect"]), 
      cl: f(["closings"]), 
      bc: f(["bc"]), 
      att: f(["présence"]) 
    };

    return lines.slice(1).map(line => {
      const p = line.split(/[|\t]/).map(v => v.trim());
      if (!p[idx.name] || p[idx.name].toLowerCase().includes("nom")) return null;
      
      const monthFromCol = idx.mois !== -1 ? p[idx.mois] : "Inconnu";
      const weekVal = p[idx.semaine] || "0";

      return {
        name: p[idx.name],
        week: weekVal,
        month: monthFromCol,
        po: parseInt(p[idx.po]) || 0,
        pr: parseInt(p[idx.pr]) || 0,
        ps: parseInt(p[idx.ps]) || 0,
        cl: parseInt(p[idx.cl]) || 0,
        bc: parseInt(p[idx.bc]) || 0,
        isPresent: (idx.att !== -1 && p[idx.att]) ? (p[idx.att].toUpperCase().startsWith('P')) : true
      };
    }).filter(e => e !== null);
  }, [pastedData]);

  // Extraction des filtres disponibles (uniques)
  const availableFilters = useMemo(() => {
    const m = [...new Set(rawDataEntries.map(e => e.month))].filter(v => v && v !== "Inconnu").sort();
    const w = [...new Set(rawDataEntries.map(e => e.week))].sort((a, b) => parseInt(a) - parseInt(b));
    return { months: m, weeks: w.map(v => `S${v}`) };
  }, [rawDataEntries]);

  // Réinitialisation des filtres au changement de source
  useEffect(() => {
    setSelectedMonths([]);
    setSelectedWeeks([]);
  }, [pastedData]);

  // Calcul du résumé filtré
  const dataSummary = useMemo(() => {
    if (rawDataEntries.length === 0) return { count: 0, collabs: [], agencyAvg: {} };

    const filtered = rawDataEntries.filter(e => {
      const mMatch = selectedMonths.length === 0 || selectedMonths.includes(e.month);
      const wMatch = selectedWeeks.length === 0 || selectedWeeks.includes(`S${e.week}`);
      return mMatch && wMatch;
    });

    if (filtered.length === 0) return { count: 0, collabs: [], agencyAvg: {} };

    const map = {};
    let agS = { po: 0, pr: 0, ps: 0, cl: 0, bc: 0, attD: 0, totD: 0 };

    filtered.forEach(e => {
      const k = e.name.toLowerCase().replace(/\s/g, '');
      if (!map[k]) map[k] = { name: e.name, weeks: [] };
      if (e.isPresent) {
          agS.po += e.po; agS.pr += e.pr; agS.ps += e.ps; 
          agS.cl += e.cl; agS.bc += e.bc; agS.attD += 1;
      }
      agS.totD += 1;
      map[k].weeks.push({ isPresent: e.isPresent, po: e.po, pr: e.pr, ps: e.ps, cl: e.cl, bc: e.bc, weekLabel: `S${e.week}` });
    });

    const collabs = Object.values(map).map(c => {
      const worked = c.weeks.filter(w => w.isPresent);
      const wL = worked.length || 1;
      const sums = worked.reduce((a, b) => ({
        po: a.po + (b.pr > 0 ? b.po/b.pr : 0),
        pr: a.pr + (b.ps > 0 ? b.pr/b.ps : 0),
        ps: a.ps + (b.cl > 0 ? b.ps/b.cl : 0),
        cl: a.cl + (b.bc > 0 ? b.cl/b.bc : 0),
        bc: a.bc + b.bc
      }), { po: 0, pr: 0, ps: 0, cl: 0, bc: 0 });

      return {
        name: c.name,
        averages: {
          rPortePres: (sums.po / wL).toFixed(2),
          rPresProsp: (sums.pr / wL).toFixed(2),
          rProspClose: (sums.ps / wL).toFixed(2),
          rClosingBC: (sums.cl / wL).toFixed(2),
          valBC: (sums.bc / wL).toFixed(1),
          attendance: Math.round((worked.length / c.weeks.length) * 100)
        }
      };
    });

    const agencyAvg = {
      rPortePres: agS.pr > 0 ? (agS.po / agS.pr).toFixed(2) : 0,
      rPresProsp: agS.ps > 0 ? (agS.pr / agS.ps).toFixed(2) : 0,
      rProspClose: agS.cl > 0 ? (agS.ps / agS.cl).toFixed(2) : 0,
      rClosingBC: agS.bc > 0 ? (agS.cl / agS.bc).toFixed(2) : 0,
      valBC: agS.attD > 0 ? (agS.bc / agS.attD).toFixed(1) : 0,
      attendance: agS.totD > 0 ? Math.round((agS.attD / agS.totD) * 100) : 0
    };

    const range = `Sélection : ${selectedMonths.length > 0 ? selectedMonths.join(', ') : 'Période complète'} | ${selectedWeeks.length > 0 ? selectedWeeks.join(', ') : 'Toutes semaines'}`;

    return { count: collabs.length, collabs, agencyAvg, range };
  }, [rawDataEntries, selectedMonths, selectedWeeks]);

  const handleAnalyse = () => {
    setLoading(true);
    const agencyRes = runDetailedAudit(dataSummary.agencyAvg, true);
    setAgencyAudit(agencyRes);
    const results = {};
    dataSummary.collabs.forEach(c => { results[c.name] = runDetailedAudit(c.averages); });
    setAnalysisResults(results);
    setTab('analyse');
    setLoading(false);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) {
      alert("La fenêtre d'impression a été bloquée. Veuillez autoriser les pop-ups pour Looker Studio.");
      return;
    }
    const html = document.getElementById('print-area').innerHTML;
    const styles = document.head.innerHTML;
    win.document.write(`<html><head>${styles}<style>
      body { font-family: sans-serif; margin: 0; padding: 0; background: white; }
      .print-page { width: 210mm; height: 296mm; padding: 15mm; box-sizing: border-box; page-break-after: always; display: flex; flex-direction: column; }
      .print-page:last-child { page-break-after: auto; }
      @media print { @page { size: A4 portrait; margin: 0; } }
    </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
  };

  const exportToPDF = () => {
    if (!window.html2pdf) return;
    setIsExporting(true);
    const el = document.getElementById('print-area');
    window.html2pdf().from(el).set({
      margin: 0, filename: `Audit_Performance_${today.replace(/\s/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: '.print-page' }
    }).toPdf().get('pdf').then(pdf => {
      setDownloadUrl(URL.createObjectURL(pdf.output('blob')));
      setIsExporting(false);
    });
  };

  const toggle = (v, list, set) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans text-left text-sm">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0033a0] text-white p-6 flex flex-col gap-8 print:hidden shrink-0 relative z-20 shadow-2xl text-left">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-lg"><ShieldCheck className="text-[#0033a0]" size={20} /></div>
          <div><span className="font-black tracking-tighter uppercase text-sm block leading-none">EM Executive</span><span className="text-[7px] text-blue-200 font-bold tracking-[0.2em] uppercase">v45.1 Fix</span></div>
        </div>
        <nav className="flex flex-col gap-1.5">
          <SidebarLink active={tab==='import'} onClick={()=>setTab('import')} icon={<Database size={16}/>} label="Données Sheet" />
          <SidebarLink active={tab==='analyse'} onClick={()=>setTab('analyse')} icon={<LayoutDashboard size={16}/>} label="Bilan Audit" disabled={Object.keys(analysisResults).length === 0}/>
          <SidebarLink active={tab==='config'} onClick={()=>setTab('config')} icon={<Settings size={16}/>} label="Réglages" />
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10 text-left">
          <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-4 flex items-center gap-2"><Scale size={12}/> Seuils Cibles</h3>
          <div className="space-y-1.5"><RuleItem label="Porte / Pres" target="≤ 3" /><RuleItem label="Pres / Prosp" target="≤ 2" /><RuleItem label="Prosp / Close" target="≤ 2" /><RuleItem label="Close / BC" target="≤ 2" /><RuleItem label="Volume BC / J" target="≥ 12" /><RuleItem label="Taux Présence" target="100%" /></div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F4F7FF] print:bg-white text-left">
        <header className="h-16 bg-white border-b border-blue-100 px-8 flex items-center justify-between shrink-0 print:hidden z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-black uppercase tracking-tight italic text-sm text-[#0033a0]">Dashboard Stratégique</h2>
            <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase italic">Portrait A4</span>
          </div>
          <button onClick={()=>setShowPdf(true)} disabled={Object.keys(analysisResults).length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-[#0033a0] text-white rounded-xl font-bold uppercase text-[10px] shadow-xl hover:bg-blue-800 transition-all uppercase"><Eye size={14}/> Aperçu & Impression</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 print:p-0 text-left">
          {tab === 'import' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 text-left">
              <div className={cardClass}>
                <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-50 text-[#0033a0] rounded-2xl"><ClipboardPaste size={24}/></div><h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Import des données</h3></div>
                
                <textarea className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:border-[#0033a0] font-mono text-[11px] mb-8" value={pastedData} onChange={(e)=>setPastedData(e.target.value)} placeholder="Collez ici votre tableau Google Sheet (avec entêtes)..."/>
                
                {rawDataEntries.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 animate-in slide-in-from-top-4 text-left">
                    <MultiSelectDropdown label="Filtrer par Mois" options={availableFilters.months} selected={selectedMonths} onToggle={(v)=>toggle(v, selectedMonths, setSelectedMonths)} icon={Filter}/>
                    <MultiSelectDropdown label="Filtrer par Semaine" options={availableFilters.weeks} selected={selectedWeeks} onToggle={(v)=>toggle(v, selectedWeeks, setSelectedWeeks)} icon={Calendar}/>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100 text-left">
                  <div className="flex gap-10">
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Nombre d'agents</span><span className="text-2xl font-black text-slate-900 leading-none">{dataSummary.count} <User className="inline text-[#0033a0]" size={18}/></span></div>
                    <div className="h-10 w-px bg-slate-100"></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Statut</span><span className="text-sm font-black text-slate-900 leading-none">Prêt pour calcul</span></div>
                  </div>
                  <button onClick={handleAnalyse} disabled={loading || dataSummary.count === 0} className="px-12 py-5 bg-[#0033a0] text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all uppercase">Générer le Dossier Complet</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'analyse' && (
            <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700 text-left">
              {/* VUE AGENCE */}
              <div className="bg-[#0033a0] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20"><Users size={28}/></div>
                  <div><h3 className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white">Bilan Agence Global</h3><p className="text-[9px] font-bold text-blue-200 uppercase tracking-[0.2em] mt-2">Moyennes consolidées de l'équipe</p></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
                  <StatBox label="Moy. Porte/Pres" value={dataSummary.agencyAvg.rPortePres} threshold={3} colorTheme="agency" isAverage={true} />
                  <StatBox label="Moy. Pres/Prosp" value={dataSummary.agencyAvg.rPresProsp} threshold={2} colorTheme="agency" isAverage={true} />
                  <StatBox label="Moy. Prosp/Cl" value={dataSummary.agencyAvg.rProspClose} threshold={2} colorTheme="agency" isAverage={true} />
                  <StatBox label="Moy. Close/BC" value={dataSummary.agencyAvg.rClosingBC} threshold={2} colorTheme="agency" isAverage={true} />
                  <StatBox label="Moy. BC / J" value={dataSummary.agencyAvg.valBC} threshold={12} isMax={false} colorTheme="agency" isAverage={true} />
                  <StatBox label="Moy. Présence" value={dataSummary.agencyAvg.attendance} threshold={100} isMax={false} suffix="%" colorTheme="agency" isAverage={true} />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4 text-blue-100 font-black text-[10px] uppercase tracking-widest"><Activity size={14}/> Diagnostic Stratégique Collectif</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agencyAudit.map((item, i) => (
                      <div key={`agency-item-${i}`} className={`p-4 rounded-2xl border flex items-start gap-3 ${item.met ? 'bg-white/10 border-white/20' : 'bg-rose-500/20 border-rose-500/30'}`}>
                         <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.met ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                         <div><span className="text-[8px] font-black uppercase opacity-60 block">{item.label}</span><p className="text-xs font-bold leading-snug">{item.summary}</p><p className="text-[9px] opacity-70 mt-1 italic">{item.numericalDetail}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLLABORATEURS */}
              {dataSummary.collabs.map((c) => (
                <div key={`card-${c.name}`} className={cardClass}>
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-blue-50">
                    <div className="w-14 h-14 rounded-2xl bg-[#0033a0] text-white flex items-center justify-center font-black text-2xl shadow-xl">{c.name[0]}</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#0033a0]">{c.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
                    <StatBox label="Porte / Pres" value={c.averages.rPortePres} threshold={3} isAverage={true} />
                    <StatBox label="Pres / Prosp" value={c.averages.rPresProsp} threshold={2} isAverage={true} />
                    <StatBox label="Prosp / Cl" value={c.averages.rProspClose} threshold={2} isAverage={true} />
                    <StatBox label="Close / BC" value={c.averages.rClosingBC} threshold={2} isAverage={true} />
                    <StatBox label="BC / J" value={c.averages.valBC} threshold={12} isMax={false} isAverage={true} />
                    <StatBox label="Présence" value={c.averages.attendance} threshold={100} isMax={false} suffix="%" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-blue-50/40 border border-blue-100 rounded-3xl shadow-inner">
                      <div className="flex items-center gap-2 mb-4 text-[#0033a0] font-black text-[10px] uppercase tracking-widest text-left"><Activity size={14}/> Diagnostic Nominatif</div>
                      <div className="space-y-4">
                        {(analysisResults[c.name] || []).map((item, i) => (
                          <div key={`diag-${c.name}-${i}`} className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${item.met ? 'bg-white border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <div><span className="text-[8px] font-black uppercase opacity-40 block">{item.label}</span><p className="text-xs font-black leading-snug">{item.summary}</p><p className="text-[9px] font-bold text-slate-500 mt-1 italic">{item.numericalDetail}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 bg-emerald-50/40 border border-emerald-100 rounded-3xl shadow-inner text-left text-left">
                      <div className="flex items-center gap-2 mb-3 text-emerald-700 font-black text-[10px] uppercase tracking-widest"><ThumbsUp size={14}/> Directives Manager</div>
                      <textarea className="w-full h-full min-h-[300px] bg-transparent border-none outline-none text-emerald-950 font-bold placeholder:text-emerald-300 resize-none italic text-base" value={managerComments[c.name] || ''} onChange={(e) => setManagerComments({...managerComments, [c.name]: e.target.value})} placeholder="Saisissez ici vos conseils personnalisés..."/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'config' && (
            <div className="max-w-xl mx-auto text-left"><div className={cardClass}><h3 className="text-lg font-black uppercase mb-6 text-[#0033a0] flex items-center gap-2"><Settings size={20}/> Configuration</h3><div className="p-6 bg-slate-50/50 rounded-3xl border border-blue-50 text-center text-slate-400 font-black uppercase text-[10px]">Menus de filtrage dynamiques activés</div></div></div>
          )}
        </div>
      </main>

      {/* MODAL APERÇU PDF */}
      {showPdf && (
        <div className="fixed inset-0 z-[100] bg-blue-900/95 backdrop-blur-xl flex flex-col p-4 animate-in fade-in duration-300 overflow-hidden text-left print:hidden">
          <div className="flex justify-between text-white mb-4 px-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg text-[#0033a0] shadow-lg"><Printer size={20}/></div>
              <span className="font-black uppercase tracking-widest italic text-xs">Aperçu Portrait A4</span>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={handlePrint} className="px-6 py-3 bg-white text-[#0033a0] font-black rounded-xl flex items-center gap-2 shadow-2xl text-[10px] uppercase hover:bg-blue-50 transition-all">Ouvrir Impression</button>
               <div className="flex flex-col gap-1">
                  <button onClick={exportToPDF} disabled={isExporting} className="px-6 py-3 bg-emerald-500 text-white font-black rounded-xl flex items-center gap-2 shadow-2xl text-[10px] uppercase hover:bg-emerald-600 transition-all disabled:opacity-50">{isExporting ? <Loader2 className="animate-spin" size={16}/> : <FileDown size={16}/>} Préparer PDF</button>
                  {downloadUrl && <a href={downloadUrl} target="_blank" rel="noreferrer" className="text-[9px] text-emerald-300 font-bold underline flex items-center gap-1"><ExternalLink size={10}/> Télécharger le PDF</a>}
               </div>
               <button onClick={()=>setShowPdf(false)} className="p-2 bg-white/10 rounded-full hover:bg-rose-50 text-white transition-all"><X size={24}/></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-200/20 p-4 flex flex-col items-center">
            <div className="bg-white shadow-2xl w-[210mm] p-0" id="print-area">
                {/* PAGE 1 : BILAN AGENCE */}
                <div className="print-page">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-blue-50">
                       <div className="flex items-center gap-5">
                          <ShieldCheck size={48} className="text-[#0033a0]"/>
                          <div className="text-left">
                            <h1 className="text-3xl font-black uppercase text-[#0033a0] tracking-tighter italic leading-none">Bilan Stratégique Agence</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-none">Executive Management Report • {today}</p>
                            <p className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mt-0.5 italic">{dataSummary.range}</p>
                          </div>
                       </div>
                    </div>
                    <div className="mb-8">
                      <div className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mb-4 flex items-center gap-2 text-left"><Users size={14}/> Moyennes Globales Équipe</div>
                      <div className="grid grid-cols-6 gap-2">
                          <StatBox label="Porte/Pres" value={dataSummary.agencyAvg.rPortePres} threshold={3} colorTheme="agency" isAverage={true} />
                          <StatBox label="Pres/Prosp" value={dataSummary.agencyAvg.rPresProsp} threshold={2} colorTheme="agency" isAverage={true} />
                          <StatBox label="Prosp/Cl" value={dataSummary.agencyAvg.rProspClose} threshold={2} colorTheme="agency" isAverage={true} />
                          <StatBox label="Close/BC" value={dataSummary.agencyAvg.rClosingBC} threshold={2} colorTheme="agency" isAverage={true} />
                          <StatBox label="BC/J" value={dataSummary.agencyAvg.valBC} threshold={12} isMax={false} colorTheme="agency" isAverage={true} />
                          <StatBox label="Présence" value={dataSummary.agencyAvg.attendance} threshold={100} isMax={false} suffix="%" colorTheme="agency" isAverage={true} />
                      </div>
                    </div>
                    <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2rem] flex-1 text-left">
                      <div className="text-[9px] font-black text-[#0033a0] uppercase mb-4">Diagnostic Global Agence</div>
                      <div className="space-y-4">
                        {agencyAudit.map((item, i) => (
                          <div key={`pdf-ag-${i}`} className="flex items-start gap-3">
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <div className="text-left">
                              <span className="text-[9px] font-black uppercase opacity-40 block leading-none">{item.label}</span>
                              <p className="text-xs font-black text-slate-800 leading-tight">{item.summary}</p>
                              <p className="text-[9px] font-bold text-slate-500 mt-0.5 italic">{item.numericalDetail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>

                {/* PAGES COLLABORATEURS */}
                {dataSummary.collabs.map((c) => {
                  const detailedAudit = analysisResults[c.name] || [];
                  return (
                    <div key={`pdf-${c.name}`} className="print-page">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-10 h-10 rounded-xl bg-[#0033a0] text-white flex items-center justify-center font-black text-lg">{c.name[0]}</div>
                         <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 border-b-4 border-[#0033a0] pb-1 inline-block text-left">{c.name}</h3>
                      </div>
                      <div className="grid grid-cols-6 gap-2 mb-8">
                          <StatBox label="Porte/Pres" value={c.averages.rPortePres} threshold={3} isMax={true} isAverage={true} />
                          <StatBox label="Pres/Prosp" value={c.averages.rPresProsp} threshold={2} isMax={true} isAverage={true} />
                          <StatBox label="Prosp/Cl" value={c.averages.rProspClose} threshold={2} isMax={true} isAverage={true} />
                          <StatBox label="Close/BC" value={c.averages.rClosingBC} threshold={2} isMax={true} isAverage={true} />
                          <StatBox label="BC/J" value={c.averages.valBC} threshold={12} isMax={false} isAverage={true} />
                          <StatBox label="Présence" value={c.averages.attendance} threshold={100} isMax={false} isAverage={false} suffix="%" />
                      </div>
                      <div className="space-y-6 flex-1 text-left">
                        <div className="p-6 bg-slate-50/50 rounded-[1.5rem] border border-blue-50 text-left text-left">
                          <div className="text-[8px] font-black text-[#0033a0] uppercase mb-4 tracking-widest text-left">Diagnostic Individuel</div>
                          <div className="space-y-4">
                             {detailedAudit.map((item, i) => (
                               <div key={`pdf-diag-${c.name}-${i}`} className="flex items-start gap-4">
                                 <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                 <div className="flex flex-col text-left">
                                   <span className="text-[8px] font-black uppercase opacity-40 leading-none text-left">{item.label}</span>
                                   <p className="text-[11px] font-black text-slate-800 leading-tight mt-0.5 text-left">{item.summary}</p>
                                   <p className="text-[8px] font-bold text-slate-500 mt-0.5 italic text-left">{item.numericalDetail}</p>
                                 </div>
                               </div>
                             ))}
                          </div>
                        </div>
                        <div className="p-6 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
                          <div className="text-[8px] font-black text-emerald-600 uppercase mb-3 tracking-widest text-left">Commentaires Manager</div>
                          <p className="text-xs font-bold text-emerald-950 italic leading-relaxed whitespace-pre-wrap text-left">
                            {managerComments[c.name] || "Maintenez la rigueur sur l'ensemble de vos indicateurs."}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 20px; }
        .print-page { width: 210mm; height: 296mm; padding: 15mm; display: flex; flex-direction: column; box-sizing: border-box; page-break-after: always !important; }
        .print-page:last-child { page-break-after: auto !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; }
          aside, header, button, .print-hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
