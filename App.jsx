import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { 
  ClipboardPaste, TrendingUp, AlertCircle, Loader2, User, ListTodo, ShieldCheck, 
  ArrowUpRight, AlertTriangle, LayoutDashboard, X, Eye, FileDown, ThumbsUp, Activity, Database, Settings, Scale, Brain, Calendar, MessageSquareText, Hash, Printer, Users
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
    check(averages.attendance, 100, "Taux de présence", "Assiduité exemplaire sur la période.", "Présence irrégulière : impact direct sur les résultats.", false, "%")
  ];
};

// --- COMPOSANTS UI ---

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
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden ${colors[colorTheme]} shadow-sm print:p-1.5`}>
      <span className="text-[6px] font-black text-slate-400 uppercase mb-0.5 tracking-widest text-center leading-tight h-4 overflow-hidden print:text-[5px]">{label}</span>
      <span className={`text-base font-black ${textColors[colorTheme]} print:text-xs`}>{value}{suffix}</span>
      <span className="text-[5px] font-bold text-slate-300 uppercase tracking-tighter">{isAverage ? "MOYENNE" : "ACTUEL"}</span>
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
  const [apiKey, setApiKey] = useState(localStorage.getItem('em_gemini_key') || '');
  const [isExporting, setIsExporting] = useState(false);

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const s = document.createElement('script');
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const dataSummary = useMemo(() => {
    if (!pastedData || pastedData.trim().length < 10) return { count: 0, range: "En attente", collabs: [], agencyAvg: {} };
    const lines = pastedData.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(/[|\t]/).map(h => h.trim().toLowerCase());
    const f = (k) => headers.findIndex(h => k.some(x => h.includes(x)));
    const idx = { 
      name: f(["nom"]), semaine: f(["semaine"]), date: f(["date"]), 
      po: f(["portes"]), pr: f(["présent"]), ps: f(["prospect"]), 
      cl: f(["closings"]), bc: f(["bc"]), att: f(["présence"]) 
    };
    
    const map = {};
    const datesFound = [];
    let agencySums = { po: 0, pr: 0, ps: 0, cl: 0, bc: 0, attDays: 0, totalDays: 0 };

    lines.slice(1).forEach(line => {
      const p = line.split(/[|\t]/).map(v => v.trim());
      if (!p[idx.name] || p[idx.name].toLowerCase().includes("nom")) return;
      const name = p[idx.name];
      const key = name.toLowerCase().replace(/\s/g, '');
      if (idx.date !== -1 && p[idx.date]) datesFound.push(p[idx.date].split(' ')[0].split('T')[0]);
      
      if (!map[key]) map[key] = { name, weeks: [] };
      const bc = parseInt(p[idx.bc]) || 0;
      const cl = parseInt(p[idx.cl]) || 0;
      const ps = parseInt(p[idx.ps]) || 0;
      const pr = parseInt(p[idx.pr]) || 0;
      const po = parseInt(p[idx.po]) || 0;
      const isPresent = (idx.att !== -1 && p[idx.att]) ? (p[idx.att].toUpperCase().startsWith('P')) : true;

      if (isPresent) {
          agencySums.po += po; agencySums.pr += pr; agencySums.ps += ps; 
          agencySums.cl += cl; agencySums.bc += bc; agencySums.attDays += 1;
      }
      agencySums.totalDays += 1;

      map[key].weeks.push({
        weekLabel: p[idx.semaine] ? `S${p[idx.semaine]}` : '?',
        rPortePres: pr > 0 ? parseFloat((po / pr).toFixed(2)) : 0,
        rPresProsp: ps > 0 ? parseFloat((pr / ps).toFixed(2)) : 0,
        rProspClose: cl > 0 ? parseFloat((ps / cl).toFixed(2)) : 0,
        rClosingBC: bc > 0 ? parseFloat((cl / bc).toFixed(2)) : 0,
        valBC: bc, isPresent, attendance: isPresent ? 100 : 0
      });
    });

    const collabsWithAverages = Object.values(map).map(collab => {
      const worked = collab.weeks.filter(w => w.isPresent);
      const wCount = worked.length || 1;
      const tCount = collab.weeks.length || 1;
      const sums = worked.reduce((a, c) => ({
        po: a.po + c.rPortePres, pr: a.pr + c.rPresProsp, ps: a.ps + c.rProspClose,
        cl: a.cl + c.rClosingBC, bc: a.bc + c.valBC
      }), { po: 0, pr: 0, ps: 0, cl: 0, bc: 0 });

      return {
        ...collab,
        averages: {
          rPortePres: (sums.po / wCount).toFixed(2), rPresProsp: (sums.pr / wCount).toFixed(2),
          rProspClose: (sums.ps / wCount).toFixed(2), rClosingBC: (sums.cl / wCount).toFixed(2),
          valBC: (sums.bc / wCount).toFixed(1),
          attendance: Math.round((worked.length / tCount) * 100)
        }
      };
    });

    const agencyAvg = {
      rPortePres: agencySums.pr > 0 ? (agencySums.po / agencySums.pr).toFixed(2) : 0,
      rPresProsp: agencySums.ps > 0 ? (agencySums.pr / agencySums.ps).toFixed(2) : 0,
      rProspClose: agencySums.cl > 0 ? (agencySums.ps / agencySums.cl).toFixed(2) : 0,
      rClosingBC: agencySums.bc > 0 ? (agencySums.cl / agencySums.bc).toFixed(2) : 0,
      valBC: agencySums.attDays > 0 ? (agencySums.bc / agencySums.attDays).toFixed(1) : 0,
      attendance: agencySums.totalDays > 0 ? Math.round((agencySums.attDays / agencySums.totalDays) * 100) : 0
    };

    let rangeText = "Période inconnue";
    if (datesFound.length > 0) { const sorted = datesFound.sort(); rangeText = `Du ${sorted[0]} au ${sorted[sorted.length - 1]}`; }
    return { count: collabsWithAverages.length, range: rangeText, collabs: collabsWithAverages, agencyAvg };
  }, [pastedData]);

  const handleAnalyse = async () => {
    setLoading(true);
    const agencyRes = runDetailedAudit(dataSummary.agencyAvg, true);
    setAgencyAudit(agencyRes);
    const results = {};
    dataSummary.collabs.forEach(c => { results[c.name] = runDetailedAudit(c.averages); });
    setAnalysisResults(results);
    setTab('analyse');
    setLoading(false);
  };

  const handleCommentChange = (name, val) => {
    setManagerComments(prev => ({ ...prev, [name]: val }));
  };

  const handlePrint = () => { window.focus(); window.print(); };

  const exportToPDF = () => {
    if (!window.html2pdf) return;
    setIsExporting(true);
    const element = document.getElementById('print-area');
    window.html2pdf().from(element).set({
      margin: 0, filename: `Audit_Executive_${today.replace(/\s/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: '.print-page' }
    }).save().then(() => setIsExporting(false));
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans text-left text-sm">
      <aside className="w-64 bg-[#0033a0] text-white p-6 flex flex-col gap-8 print:hidden shrink-0 relative z-20 shadow-2xl text-left">
        <div className="flex items-center gap-3 relative z-10 text-left">
          <div className="p-2 bg-white rounded-xl shadow-lg"><ShieldCheck className="text-[#0033a0]" size={20} /></div>
          <div className="text-left"><span className="font-black tracking-tighter uppercase text-sm block leading-none">EM Executive</span><span className="text-[7px] text-blue-200 font-bold tracking-[0.2em] uppercase">Portrait v39.0</span></div>
        </div>
        <nav className="flex flex-col gap-1.5 relative z-10 text-left">
          <SidebarLink active={tab==='import'} onClick={()=>setTab('import')} icon={<Database size={16}/>} label="Source de données" />
          <SidebarLink active={tab==='analyse'} onClick={()=>setTab('analyse')} icon={<LayoutDashboard size={16}/>} label="Audit Stratégique" disabled={Object.keys(analysisResults).length === 0}/>
          <SidebarLink active={tab==='config'} onClick={()=>setTab('config')} icon={<Settings size={16}/>} label="Configuration" />
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10 text-left">
          <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-4 flex items-center gap-2"><Scale size={12}/> Seuils d'Or</h3>
          <div className="space-y-1.5">
            <RuleItem label="Porte / Pres" target="≤ 3" /><RuleItem label="Pres / Prosp" target="≤ 2" /><RuleItem label="Prosp / Close" target="≤ 2" /><RuleItem label="Close / BC" target="≤ 2" /><RuleItem label="Volume BC / J" target="≥ 12" /><RuleItem label="Taux Présence" target="100%" />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F4F7FF] print:bg-white text-left">
        <header className="h-16 bg-white border-b border-blue-100 px-8 flex items-center justify-between shrink-0 print:hidden z-10 text-left">
          <div className="flex items-center gap-4 text-left">
            <div><h2 className="font-black uppercase tracking-tight italic text-sm text-[#0033a0]">Analyse Manageriale du {today}</h2><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">{dataSummary.range}</p></div>
            <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase italic">Format A4 Portrait</span>
          </div>
          <button onClick={()=>setShowPdf(true)} disabled={Object.keys(analysisResults).length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-[#0033a0] text-white rounded-xl font-bold uppercase text-[10px] shadow-xl hover:bg-blue-800 transition-all uppercase"><Eye size={14}/> Aperçu & Impression</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 print:p-0">
          {tab === 'import' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className={cardClass}>
                <div className="flex items-center gap-3 mb-6 text-left"><div className="p-3 bg-blue-50 text-[#0033a0] rounded-2xl text-left"><ClipboardPaste size={24}/></div><h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 text-left">Audit Stratégique</h3></div>
                <textarea className="w-full h-80 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:border-[#0033a0] font-mono text-[11px]" value={pastedData} onChange={(e)=>setPastedData(e.target.value)} placeholder="Collez ici les lignes de données..."/>
                <div className="mt-8 flex items-center justify-between">
                  <div className="flex gap-6 text-left"><div className="flex flex-col text-left"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Collaborateurs</span><span className="text-2xl font-black text-slate-900 leading-none">{dataSummary.count} <User className="inline text-[#0033a0]" size={18}/></span></div><div className="h-10 w-px bg-slate-100 text-left"></div><div className="flex flex-col text-left"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none text-left text-left">Période</span><span className="text-sm font-black text-slate-900 leading-none">{dataSummary.range}</span></div></div>
                  <button onClick={handleAnalyse} disabled={loading || !pastedData || dataSummary.count === 0} className="px-12 py-5 bg-[#0033a0] text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all uppercase">Lancer l'Analyse</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'analyse' && (
            <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700 text-left">
              {/* BILAN AGENCE SUR ÉCRAN */}
              <div className="bg-[#0033a0] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl text-left"></div>
                <div className="flex items-center gap-4 mb-8 text-left">
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20"><Users size={28}/></div>
                  <div className="text-left"><h3 className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white text-left">Bilan Agence Global</h3><p className="text-[9px] font-bold text-blue-200 uppercase tracking-[0.2em] mt-2 text-left">Moyennes consolidées de l'équipe</p></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8 text-left">
                  <StatBox label="Moy. Porte/Pres" value={dataSummary.agencyAvg.rPortePres} threshold={3} colorTheme="agency" isAverage={true} />
                  <StatBox label="Moy. Pres/Prosp" value={dataSummary.agencyAvg.rPresProsp} threshold={2} colorTheme="agency" isAverage={true} />
                  <StatBox label="Moy. Prosp/Cl" value={dataSummary.agencyAvg.rProspClose} threshold={2} colorTheme="agency" isAverage={true} />
                  <StatBox label="Moy. Close/BC" value={dataSummary.agencyAvg.rClosingBC} threshold={2} colorTheme="agency" isAverage={true} />
                  <StatBox label="Moy. BC / J" value={dataSummary.agencyAvg.valBC} threshold={12} isMax={false} colorTheme="agency" isAverage={true} />
                  <StatBox label="Moy. Présence" value={dataSummary.agencyAvg.attendance} threshold={100} isMax={false} suffix="%" colorTheme="agency" isAverage={true} />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm text-left">
                  <div className="flex items-center gap-2 mb-4 text-blue-100 font-black text-[10px] uppercase tracking-widest text-left"><Activity size={14}/> Diagnostic Consolidé</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    {agencyAudit.map((item, i) => (
                      <div key={i} className={`p-4 rounded-2xl border flex items-start gap-3 transition-all text-left ${item.met ? 'bg-white/10 border-white/20' : 'bg-rose-500/20 border-rose-500/30'}`}>
                         <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.met ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                         <div className="text-left"><span className="text-[8px] font-black uppercase opacity-60 block text-left">{item.label}</span><p className="text-xs font-bold leading-snug text-left">{item.summary}</p><p className="text-[9px] opacity-70 mt-1 italic text-left">{item.numericalDetail}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {dataSummary.collabs.map((c) => (
                <div key={c.name} className={cardClass}>
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-blue-50 text-left">
                    <div className="w-14 h-14 rounded-2xl bg-[#0033a0] text-white flex items-center justify-center font-black text-2xl shadow-xl text-left">{c.name[0]}</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#0033a0] text-left">{c.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8 text-left">
                    <StatBox label="Porte / Pres" value={c.averages.rPortePres} threshold={3} isAverage={true} />
                    <StatBox label="Pres / Prosp" value={c.averages.rPresProsp} threshold={2} isAverage={true} />
                    <StatBox label="Prosp / Cl" value={c.averages.rProspClose} threshold={2} isAverage={true} />
                    <StatBox label="Close / BC" value={c.averages.rClosingBC} threshold={2} isAverage={true} />
                    <StatBox label="BC / J" value={c.averages.valBC} threshold={12} isMax={false} isAverage={true} />
                    <StatBox label="Présence" value={c.averages.attendance} threshold={100} isMax={false} suffix="%" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="p-6 bg-blue-50/40 border border-blue-100 rounded-3xl shadow-inner text-left">
                      <div className="flex items-center gap-2 mb-4 text-[#0033a0] font-black text-[10px] uppercase tracking-widest text-left"><Activity size={14}/> Diagnostic Nominatif</div>
                      <div className="space-y-4 text-left">
                        {(analysisResults[c.name] || []).map((item, i) => (
                          <div key={i} className={`p-4 rounded-2xl border flex items-start gap-3 transition-all text-left ${item.met ? 'bg-white border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <div className="text-left"><span className="text-[8px] font-black uppercase opacity-40 block text-left">{item.label}</span><p className="text-xs font-black leading-snug text-left">{item.summary}</p><p className="text-[9px] font-bold text-slate-500 mt-1 italic text-left">{item.numericalDetail}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 bg-emerald-50/40 border border-emerald-100 rounded-3xl shadow-inner text-left">
                      <div className="flex items-center gap-2 mb-3 text-emerald-700 font-black text-[10px] uppercase tracking-widest text-left"><ThumbsUp size={14}/> Directives Manager</div>
                      <textarea className="w-full h-full min-h-[300px] bg-transparent border-none outline-none text-emerald-950 font-bold placeholder:text-emerald-300 resize-none italic text-base text-left" value={managerComments[c.name] || ''} onChange={(e) => handleCommentChange(c.name, e.target.value)} placeholder="Saisissez ici vos conseils..."/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL D'APERÇU PDF --- */}
      {showPdf && (
        <div className="fixed inset-0 z-[100] bg-blue-900/95 backdrop-blur-xl flex flex-col p-4 animate-in fade-in duration-300 print:hidden overflow-hidden text-left">
          <div className="flex justify-between text-white mb-4 px-4 max-w-7xl mx-auto w-full text-left">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-white rounded-lg text-[#0033a0] shadow-lg text-left"><Printer size={20}/></div>
              <span className="font-black uppercase tracking-widest italic text-xs text-left">Aperçu Portrait A4</span>
            </div>
            <div className="flex items-center gap-4 text-left">
               <button onClick={handlePrint} className="px-6 py-3 bg-white text-[#0033a0] font-black rounded-xl flex items-center gap-2 shadow-2xl text-[10px] uppercase hover:bg-blue-50 transition-all text-left"><Printer size={16}/> Imprimer système</button>
               <button onClick={exportToPDF} disabled={isExporting} className="px-6 py-3 bg-emerald-500 text-white font-black rounded-xl flex items-center gap-2 shadow-2xl text-[10px] uppercase hover:bg-emerald-600 transition-all disabled:opacity-50 text-left">{isExporting ? <Loader2 className="animate-spin" size={16}/> : <FileDown size={16}/>} Télécharger PDF</button>
               <button onClick={()=>setShowPdf(false)} className="p-2 bg-white/10 rounded-full hover:bg-rose-50 text-white transition-all text-left"><X size={24}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-200/20 p-4 flex flex-col items-center">
            <div className="bg-white shadow-2xl w-[210mm] p-0 text-left" id="print-area">
                
                {/* PAGE 1 : BILAN AGENCE (FORCÉE) */}
                <div className="print-page w-[210mm] h-[296mm] p-10 flex flex-col text-left">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-blue-50 text-left">
                       <div className="flex items-center gap-5 text-left">
                          <ShieldCheck size={48} className="text-[#0033a0]"/>
                          <div className="text-left">
                            <h1 className="text-3xl font-black uppercase text-[#0033a0] tracking-tighter italic leading-none text-left">Bilan Stratégique Agence</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-left text-left leading-none">Executive Management Report • {today}</p>
                            <p className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mt-0.5 italic text-left">{dataSummary.range}</p>
                          </div>
                       </div>
                    </div>
                    
                    <div className="mb-8 text-left text-left">
                      <div className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mb-4 flex items-center gap-2 text-left"><Users size={14}/> Moyennes de l'Équipe</div>
                      <div className="grid grid-cols-6 gap-2 text-left">
                          <StatBox label="Porte/Pres" value={dataSummary.agencyAvg.rPortePres} threshold={3} colorTheme="agency" isAverage={true} />
                          <StatBox label="Pres/Prosp" value={dataSummary.agencyAvg.rPresProsp} threshold={2} colorTheme="agency" isAverage={true} />
                          <StatBox label="Prosp/Cl" value={dataSummary.agencyAvg.rProspClose} threshold={2} colorTheme="agency" isAverage={true} />
                          <StatBox label="Close/BC" value={dataSummary.agencyAvg.rClosingBC} threshold={2} colorTheme="agency" isAverage={true} />
                          <StatBox label="BC/J" value={dataSummary.agencyAvg.valBC} threshold={12} isMax={false} colorTheme="agency" isAverage={true} />
                          <StatBox label="Présence" value={dataSummary.agencyAvg.attendance} threshold={100} isMax={false} suffix="%" colorTheme="agency" isAverage={true} />
                      </div>
                    </div>

                    <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2rem] flex-1 text-left">
                      <div className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mb-4 text-left">Diagnostic Global Agence</div>
                      <div className="space-y-4 text-left">
                        {agencyAudit.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 text-left">
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <div className="text-left text-left">
                              <span className="text-[9px] font-black uppercase opacity-40 block text-left leading-none">{item.label}</span>
                              <p className="text-xs font-black text-slate-800 leading-tight text-left">{item.summary}</p>
                              <p className="text-[9px] font-bold text-slate-500 mt-0.5 italic text-left">{item.numericalDetail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>

                {/* PAGES COLLABORATEURS (Une page par profil) */}
                {dataSummary.collabs.map((c) => {
                  const detailedAudit = analysisResults[c.name] || [];
                  return (
                    <div key={`pdf-${c.name}`} className="print-page w-[210mm] h-[296mm] p-10 flex flex-col text-left">
                      <div className="flex items-center gap-4 mb-6 text-left text-left">
                         <div className="w-10 h-10 rounded-xl bg-[#0033a0] text-white flex items-center justify-center font-black text-lg text-left">{c.name[0]}</div>
                         <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 border-b-4 border-[#0033a0] pb-1 inline-block text-left">{c.name}</h3>
                      </div>
                      <div className="grid grid-cols-6 gap-2 mb-8 text-left text-left text-left">
                          <StatBox label="Porte/Pres" value={c.averages.rPortePres} threshold={3} isMax={true} isAverage={true} />
                          <StatBox label="Pres/Prosp" value={c.averages.rPresProsp} threshold={2} isMax={true} isAverage={true} />
                          <StatBox label="Prosp/Cl" value={c.averages.rProspClose} threshold={2} isMax={true} isAverage={true} />
                          <StatBox label="Close/BC" value={c.averages.rClosingBC} threshold={2} isMax={true} isAverage={true} />
                          <StatBox label="BC/J" value={c.averages.valBC} threshold={12} isMax={false} isAverage={true} />
                          <StatBox label="Présence" value={c.averages.attendance} threshold={100} isMax={false} isAverage={false} suffix="%" />
                      </div>
                      <div className="space-y-6 flex-1 text-left text-left text-left text-left">
                        <div className="p-6 bg-slate-50/50 rounded-[1.5rem] border border-blue-50 text-left text-left">
                          <div className="text-[8px] font-black text-[#0033a0] uppercase mb-4 tracking-widest text-left">Diagnostic Individuel</div>
                          <div className="space-y-4 text-left text-left text-left">
                             {detailedAudit.map((item, i) => (
                               <div key={i} className="flex items-start gap-4 text-left text-left">
                                 <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                 <div className="flex flex-col text-left">
                                   <span className="text-[8px] font-black uppercase opacity-40 text-left leading-none">{item.label}</span>
                                   <p className="text-[11px] font-black text-slate-800 leading-tight mt-0.5 text-left text-left text-left">{item.summary}</p>
                                   <p className="text-[8px] font-bold text-slate-500 mt-0.5 italic text-left text-left text-left">{item.numericalDetail}</p>
                                 </div>
                               </div>
                             ))}
                          </div>
                        </div>
                        <div className="p-6 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 text-left text-left">
                          <div className="text-[8px] font-black text-emerald-600 uppercase mb-3 tracking-widest text-left">Commentaires Manager</div>
                          <p className="text-xs font-bold text-emerald-950 italic leading-relaxed whitespace-pre-wrap text-left text-left text-left text-left">
                            {managerComments[c.name] || "Continuez sur cette lancée et maintenez la rigueur sur vos indicateurs."}
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
        
        .print-page { 
           page-break-after: always !important; 
           break-after: page !important; 
           display: flex !important; 
           flex-direction: column !important;
           position: relative;
           box-sizing: border-box !important;
        }
        
        .print-page:last-child { 
           page-break-after: auto !important; 
           break-after: auto !important; 
        }

        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; 
          }
          body { 
            background: white !important; 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          aside, header, button, .print-hidden { display: none !important; }
          #print-area { 
            width: 210mm !important; 
            border: none !important; 
            box-shadow: none !important; 
            padding: 0 !important; 
            margin: 0 !important;
          }
          .print-page { 
            width: 210mm !important; 
            height: 297mm !important; 
            padding: 10mm !important; 
            page-break-after: always !important;
            border: none !important;
            overflow: hidden !important;
          }
        }
      `}} />
    </div>
  );
}
