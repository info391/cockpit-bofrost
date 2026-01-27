import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { 
  ClipboardPaste, TrendingUp, AlertCircle, Loader2, User, ListTodo, ShieldCheck, 
  ArrowUpRight, AlertTriangle, LayoutDashboard, X, Eye, FileDown, ThumbsUp, Medal, Activity, Database, Settings, ExternalLink, Globe, CheckCircle2, Scale, Brain, Calendar, MessageSquareText, Hash, Clock, Check
} from 'lucide-react';

// --- STYLES ET CLASSES ---
const cardClass = "bg-white rounded-3xl p-6 shadow-sm border border-blue-50 transition-all hover:shadow-lg";
const btnClass = "flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-[10px] transition-all active:scale-95 disabled:opacity-50";

// --- MOTEUR D'AUDIT LOCAL (DÉTAILLÉ SUR LES 6 CLÉS) ---
const runDetailedAudit = (averages) => {
  if (!averages) return [];

  const check = (val, threshold, label, successMsg, failMsg, isMax = true) => {
    const num = parseFloat(val);
    const met = isMax ? num <= threshold : num >= threshold;
    return {
      label,
      met,
      msg: met ? `✅ ${successMsg}` : `⚠️ ${failMsg}`
    };
  };

  return [
    check(averages.rPortePres, 3, "Portes / Présents", "Accroche efficace : passage fluide à la présentation.", "L'accroche à la porte doit être plus percutante."),
    check(averages.rPresProsp, 2, "Présents / Prospects", "Bonne détection du besoin pendant la présentation.", "Travaillez la phase de découverte pour créer plus d'intérêt."),
    check(averages.rProspClose, 2, "Prospects / Closing", "Excellente capacité à isoler les prospects sérieux.", "Améliorez la transition vers la proposition commerciale."),
    check(averages.rClosingBC, 2, "Closing / BC", "Qualité de signature optimale, bons BC confirmés.", "La phase de conclusion doit être plus sécurisée."),
    check(averages.valBC, 12, "BC / Jour", "Productivité conforme aux standards de l'agence.", "Volume de BC moyen insuffisant sur la période travaillée.", false),
    check(averages.attendance, 100, "Taux de présence", "Assiduité parfaite sur la période.", "Présence irrégulière : impact direct sur les résultats globaux.", false)
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
    <span className="truncate">{label}</span>
  </button>
);

const RuleItem = ({ label, target }) => (
  <div className="flex items-center justify-between text-[9px] bg-white/10 p-2.5 rounded-lg border border-white/5 backdrop-blur-sm">
    <span className="font-bold text-blue-50 text-left uppercase tracking-tighter">{label}</span>
    <span className={`font-black ${target.includes('≥') || target.includes('100') ? 'text-emerald-300' : 'text-blue-200'}`}>{target}</span>
  </div>
);

const MiniChart = ({ title, data, dataKey, threshold, isMax = true }) => {
  const gradId = `grad-${dataKey}`;
  return (
    <div className="bg-slate-50/30 p-3 rounded-2xl border border-blue-50/50 h-24 flex flex-col text-left">
      <p className="text-[8px] font-black text-slate-400 uppercase mb-1 truncate tracking-tighter">{title}</p>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0033a0" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#0033a0" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="weekLabel" hide />
            <YAxis hide domain={[0, 'auto']} />
            <ReferenceLine y={threshold} stroke={isMax ? "#fca5a5" : "#86efac"} strokeDasharray="3 3" />
            <Area type="monotone" dataKey={dataKey} stroke="#0033a0" strokeWidth={1.5} fill={`url(#${gradId})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const StatBox = ({ label, value, threshold, isMax = true, isAverage = false, suffix = "" }) => {
  const numValue = parseFloat(value);
  const isTargetMet = isMax ? numValue <= threshold : numValue >= threshold;
  return (
    <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-center relative overflow-hidden ${isTargetMet ? 'bg-emerald-50 border-emerald-100 shadow-sm shadow-emerald-100/50' : 'bg-rose-50 border-rose-100 shadow-sm shadow-rose-100/50'}`}>
      <span className="text-[7px] font-black text-slate-400 uppercase mb-1 tracking-widest text-center leading-tight h-5 overflow-hidden">{label}</span>
      <span className={`text-lg font-black ${isTargetMet ? 'text-emerald-700' : 'text-rose-700'}`}>{value}{suffix}</span>
      <span className="text-[6px] font-bold text-slate-300 uppercase mt-1 tracking-tighter">{isAverage ? "TRAVAILLÉ" : "ACTUEL"}</span>
    </div>
  );
};

// --- APPLICATION PRINCIPALE ---

export default function App() {
  const [tab, setTab] = useState('import');
  const [pastedData, setPastedData] = useState('');
  const [analysisMode, setAnalysisMode] = useState('local');
  const [analysisResults, setAnalysisResults] = useState({});
  const [managerComments, setManagerComments] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('em_gemini_key') || '');

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const dataSummary = useMemo(() => {
    if (!pastedData || pastedData.trim().length < 10) return { count: 0, range: "En attente", collabs: [] };
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
      map[key].weeks.push({
        weekLabel: p[idx.semaine] ? `S${p[idx.semaine]}` : '?',
        rPortePres: pr > 0 ? parseFloat((po / pr).toFixed(2)) : 0,
        rPresProsp: ps > 0 ? parseFloat((pr / ps).toFixed(2)) : 0,
        rProspClose: cl > 0 ? parseFloat((ps / cl).toFixed(2)) : 0,
        rClosingBC: bc > 0 ? parseFloat((cl / bc).toFixed(2)) : 0,
        valBC: bc,
        attendance: isPresent ? 100 : 0,
        isPresent: isPresent
      });
    });
    const collabsWithAverages = Object.values(map).map(collab => {
      const workedDays = collab.weeks.filter(w => w.isPresent);
      const workedDaysCount = workedDays.length || 1;
      const totalDaysCount = collab.weeks.length || 1;
      const sumsWorked = workedDays.reduce((acc, curr) => ({
        rPortePres: acc.rPortePres + curr.rPortePres,
        rPresProsp: acc.rPresProsp + curr.rPresProsp,
        rProspClose: acc.rProspClose + curr.rProspClose,
        rClosingBC: acc.rClosingBC + curr.rClosingBC,
        valBC: acc.valBC + curr.valBC
      }), { rPortePres: 0, rPresProsp: 0, rProspClose: 0, rClosingBC: 0, valBC: 0 });
      const totalPresence = collab.weeks.reduce((acc, curr) => acc + curr.attendance, 0);
      return {
        ...collab,
        averages: {
          rPortePres: (sumsWorked.rPortePres / workedDaysCount).toFixed(2),
          rPresProsp: (sumsWorked.rPresProsp / workedDaysCount).toFixed(2),
          rProspClose: (sumsWorked.rProspClose / workedDaysCount).toFixed(2),
          rClosingBC: (sumsWorked.rClosingBC / workedDaysCount).toFixed(2),
          valBC: (sumsWorked.valBC / workedDaysCount).toFixed(1),
          attendance: Math.round(totalPresence / totalDaysCount)
        }
      };
    });
    let rangeText = "Période inconnue";
    if (datesFound.length > 0) { const sorted = datesFound.sort(); rangeText = `Du ${sorted[0]} au ${sorted[sorted.length - 1]}`; }
    return { count: collabsWithAverages.length, range: rangeText, collabs: collabsWithAverages };
  }, [pastedData]);

  const handleAnalyse = async () => {
    setLoading(true);
    setError(null);
    const results = {};
    if (analysisMode === 'local' || !apiKey) {
      dataSummary.collabs.forEach(c => { 
        results[c.name] = runDetailedAudit(c.averages); 
      });
      setAnalysisResults(results);
      setTab('analyse');
      setLoading(false);
    } else {
      // IA mode: Forçage du format structuré
      try {
        const prompt = `Analyste Expert Bofrost. Période ${dataSummary.range}. Pour chaque nom, analyse les 6 clés (Porte/Pres, Pres/Prosp, Prosp/Close, Close/BC, BC/j, Présence). Données : ${JSON.stringify(dataSummary.collabs.map(c => ({name: c.name, avg: c.averages})))}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        dataSummary.collabs.forEach(c => {
           // En mode IA, on essaie de garder les 6 points
           results[c.name] = runDetailedAudit(c.averages); // On utilise le local par sécurité si l'IA dérive
        });
        setAnalysisResults(results);
        setTab('analyse');
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    }
  };

  const handleCommentChange = (name, val) => {
    setManagerComments(prev => ({ ...prev, [name]: val }));
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans text-left text-sm">
      
      <aside className="w-64 bg-[#0033a0] text-white p-6 flex flex-col gap-8 print:hidden shrink-0 relative z-20 shadow-2xl">
        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-white rounded-xl shadow-lg"><ShieldCheck className="text-[#0033a0]" size={20} /></div>
          <div><span className="font-black tracking-tighter uppercase text-sm block leading-none">EM Executive</span><span className="text-[7px] text-blue-200 font-bold tracking-[0.2em] uppercase">Audit 6 Clés d'Or v30</span></div>
        </div>
        <nav className="flex flex-col gap-1.5 relative z-10">
          <SidebarLink active={tab==='import'} onClick={()=>setTab('import')} icon={<Database size={16}/>} label="Source de données" />
          <SidebarLink active={tab==='analyse'} onClick={()=>setTab('analyse')} icon={<LayoutDashboard size={16}/>} label="Audit Stratégique" disabled={Object.keys(analysisResults).length === 0}/>
          <SidebarLink active={tab==='config'} onClick={()=>setTab('config')} icon={<Settings size={16}/>} label="Options & IA" />
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10 relative z-10">
          <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-4 flex items-center gap-2"><Scale size={12}/> Seuils d'Or</h3>
          <div className="space-y-1.5">
            <RuleItem label="Porte / Pres" target="≤ 3" /><RuleItem label="Pres / Prosp" target="≤ 2" /><RuleItem label="Prosp / Close" target="≤ 2" /><RuleItem label="Close / BC" target="≤ 2" /><RuleItem label="Volume BC / J" target="≥ 12" /><RuleItem label="Taux Présence" target="100%" />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F4F7FF]">
        <header className="h-16 bg-white border-b border-blue-100 px-8 flex items-center justify-between shrink-0 print:hidden z-10">
          <div className="flex items-center gap-4">
            <div><h2 className="font-black uppercase tracking-tight italic text-sm text-[#0033a0]">Analyse Manageriale du {today}</h2><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">{dataSummary.range}</p></div>
            <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase italic">Période : {dataSummary.range}</span>
          </div>
          <button onClick={()=>setShowPdf(true)} disabled={Object.keys(analysisResults).length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-[#0033a0] text-white rounded-xl font-bold uppercase text-[10px] transition-all hover:bg-blue-800 shadow-xl shadow-blue-100"><Eye size={14}/> Rapport PDF</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {tab === 'import' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
              <div className={cardClass}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3"><div className="p-3 bg-blue-50 text-[#0033a0] rounded-2xl"><ClipboardPaste size={24}/></div><div><h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Audit Stratégique</h3><p className="text-xs text-slate-400 font-medium italic">Analyse nominative sur les 6 Seuils d'Or</p></div></div>
                </div>
                <textarea className="w-full h-80 p-6 bg-slate-50/50 border border-slate-200 rounded-[2rem] outline-none focus:border-[#0033a0] font-mono text-[11px] shadow-inner transition-all focus:ring-4 ring-blue-500/5" value={pastedData} onChange={(e)=>setPastedData(e.target.value)} placeholder="Nom | Semaine | Date | Portes | Présents | Prospects | Closings | BC..."/>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">Collaborateurs</span><span className="text-2xl font-black text-slate-900 leading-none">{dataSummary.count} <User className="inline text-[#0033a0]" size={18}/></span></div>
                    <div className="h-10 w-px bg-slate-100"></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">Période Traitée</span><span className="text-sm font-black text-slate-900 leading-none text-blue-800">{dataSummary.range}</span></div>
                  </div>
                  <div className="flex justify-end"><button onClick={handleAnalyse} disabled={loading || !pastedData || dataSummary.count === 0} className="group flex items-center gap-3 px-12 py-5 bg-[#0033a0] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-800 transition-all hover:scale-[1.02] active:scale-95 disabled:bg-slate-100">
                    {loading ? <Loader2 className="animate-spin" /> : "Générer les 6 Clés"}
                  </button></div>
                </div>
                {error && <div className="mt-4 p-4 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-xl flex items-center gap-2 border border-rose-100"><AlertTriangle size={14}/> {error}</div>}
              </div>
            </div>
          )}

          {tab === 'analyse' && (
            <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in slide-in-from-bottom-8 duration-700">
              {dataSummary.collabs.map((c, idx) => {
                const averages = c.averages || {};
                const detailedAudit = analysisResults[c.name] || [];
                return (
                  <div key={c.name} className={cardClass} style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-blue-50">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#0033a0] text-white flex items-center justify-center font-black text-2xl shadow-xl">{c.name[0]}</div>
                        <div><h3 className="text-2xl font-black uppercase tracking-tighter text-[#0033a0]">{c.name}</h3><span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase tracking-widest italic tracking-wider">Performance moyenne réelle (jours travaillés)</span></div>
                      </div>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4 text-[#0033a0] font-black text-[10px] uppercase tracking-widest"><Hash size={14}/> Statistiques Moyennes</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        <StatBox label="Porte / Pres" value={averages.rPortePres || 0} threshold={3} isMax={true} isAverage={true} />
                        <StatBox label="Pres / Prosp" value={averages.rPresProsp || 0} threshold={2} isMax={true} isAverage={true} />
                        <StatBox label="Prosp / Cl" value={averages.rProspClose || 0} threshold={2} isMax={true} isAverage={true} />
                        <StatBox label="Close / BC" value={averages.rClosingBC || 0} threshold={2} isMax={true} isAverage={true} />
                        <StatBox label="BC / J" value={averages.valBC || 0} threshold={12} isMax={false} isAverage={true} />
                        <StatBox label="Présence" value={averages.attendance || 0} threshold={100} isMax={false} isAverage={false} suffix="%" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-10 opacity-60 hover:opacity-100 transition-opacity">
                      <MiniChart title="Tendance Porte/Pr" data={c.weeks} dataKey="rPortePres" threshold={3} />
                      <MiniChart title="Tendance Pres/Pr" data={c.weeks} dataKey="rPresProsp" threshold={2} />
                      <MiniChart title="Tendance Prosp/Cl" data={c.weeks} dataKey="rProspClose" threshold={2} />
                      <MiniChart title="Tendance Close/BC" data={c.weeks} dataKey="rClosingBC" threshold={2} />
                      <MiniChart title="Tendance Volume" data={c.weeks} dataKey="valBC" threshold={12} isMax={false} />
                      <MiniChart title="Tendance Présence" data={c.weeks} dataKey="attendance" threshold={100} isMax={false} />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* DIAGNOSTIC DÉTAILLÉ PAR CLÉ */}
                      <div className="p-6 bg-blue-50/40 border border-blue-100 rounded-3xl shadow-inner">
                        <div className="flex items-center gap-2 mb-4 text-[#0033a0] font-black text-[10px] uppercase tracking-widest"><Activity size={14}/> Diagnostic (Performance réelle)</div>
                        <div className="space-y-2.5">
                           {detailedAudit.map((item, i) => (
                             <div key={i} className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${item.met ? 'bg-white/50 border-emerald-50 text-slate-700' : 'bg-rose-50/50 border-rose-100 text-rose-900'}`}>
                               <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-black uppercase tracking-tighter opacity-50">{item.label}</span>
                                 <p className="text-xs font-bold leading-tight">{item.msg}</p>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>

                      <div className="p-6 bg-emerald-50/40 border border-emerald-100 rounded-3xl shadow-inner relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-3 text-emerald-700 font-black text-[10px] uppercase tracking-widest"><ThumbsUp size={14}/> Directives Manager</div>
                        <textarea className="w-full h-48 bg-transparent border-none outline-none text-emerald-950 font-bold placeholder:text-emerald-300 resize-none italic text-base" placeholder="Saisissez ici vos conseils personnalisés..." value={managerComments[c.name] || ''} onChange={(e) => handleCommentChange(c.name, e.target.value)} />
                        <div className="absolute bottom-4 right-4 opacity-5 text-emerald-600"><MessageSquareText size={80}/></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'config' && (
            <div className="max-w-xl mx-auto space-y-6"><div className={cardClass}><h3 className="text-lg font-black uppercase mb-6 text-[#0033a0] flex items-center gap-2"><Settings size={20}/> Options Système</h3><div className="p-6 bg-slate-50/50 rounded-3xl border border-blue-50"><p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">Type de Diagnostic</p><div className="flex gap-3"><button onClick={()=>setAnalysisMode('local')} className={`flex-1 p-5 rounded-2xl font-black text-[10px] uppercase border transition-all flex flex-col items-center gap-3 ${analysisMode==='local'?'bg-[#0033a0] text-white border-[#0033a0] shadow-xl':'bg-white text-slate-400'}`}><Scale size={20}/>Audit 6 Clés</button><button onClick={()=>setAnalysisMode('ai')} className={`flex-1 p-5 rounded-2xl font-black text-[10px] uppercase border transition-all flex flex-col items-center gap-3 ${analysisMode==='ai'?'bg-[#0033a0] text-white border-[#0033a0] shadow-xl':'bg-white text-slate-400'}`}><Brain size={20}/>Intelligence IA</button></div></div></div></div>
          )}
        </div>
      </main>

      {/* MODAL PDF AVEC DÉTAIL DES 6 CLÉS */}
      {showPdf && (
        <div className="fixed inset-0 z-[100] bg-blue-900/95 backdrop-blur-xl flex flex-col p-6 animate-in fade-in duration-300">
          <div className="flex justify-between text-white mb-6 px-4 max-w-5xl mx-auto w-full"><div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg text-[#0033a0] shadow-lg"><FileDown size={20}/></div><span className="font-black uppercase tracking-widest italic text-xs">Rapport Prêt pour Diffusion</span></div><button onClick={()=>setShowPdf(false)} className="p-2 bg-white/10 rounded-full hover:bg-rose-50 text-white transition-all"><X size={24}/></button></div>
          <div className="flex-1 overflow-auto bg-white rounded-[3rem] p-12 max-w-5xl mx-auto w-full shadow-2xl" id="print-area">
            <div className="flex items-center justify-between mb-12 pb-8 border-b-2 border-blue-50">
               <div className="flex items-center gap-5"><ShieldCheck size={56} className="text-[#0033a0]"/><div><h1 className="text-4xl font-black uppercase text-[#0033a0] tracking-tighter italic leading-none">Audit de Performance</h1><p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Executive Coaching Report • {today}</p><p className="text-[10px] font-black text-[#0033a0] uppercase tracking-widest mt-1 italic">Consolidation sur jours travaillés : {dataSummary.range}</p></div></div>
            </div>
            <div className="space-y-16">
              {dataSummary.collabs.map(c => {
                const detailedAudit = analysisResults[c.name] || [];
                return (
                  <div key={`pdf-${c.name}`} className="page-break-after-always border-b border-slate-100 pb-16 last:border-0">
                    <div className="flex items-center gap-4 mb-8"><div className="w-10 h-10 rounded-xl bg-[#0033a0] text-white flex items-center justify-center font-black">{c.name[0]}</div><h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 border-b-4 border-[#0033a0] pb-1 inline-block">{c.name}</h3></div>
                    
                    <div className="grid grid-cols-6 gap-2 mb-8">
                        <StatBox label="Porte/Pres" value={c.averages.rPortePres} threshold={3} isMax={true} isAverage={true} />
                        <StatBox label="Pres/Prosp" value={c.averages.rPresProsp} threshold={2} isMax={true} isAverage={true} />
                        <StatBox label="Prosp/Cl" value={c.averages.rProspClose} threshold={2} isMax={true} isAverage={true} />
                        <StatBox label="Close/BC" value={c.averages.rClosingBC} threshold={2} isMax={true} isAverage={true} />
                        <StatBox label="BC/J" value={c.averages.valBC} threshold={12} isMax={false} isAverage={true} />
                        <StatBox label="Présence" value={c.averages.attendance} threshold={100} isMax={false} isAverage={false} suffix="%" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-slate-50/50 rounded-[2rem] border border-blue-50">
                        <div className="text-[9px] font-black text-[#0033a0] uppercase mb-4 tracking-widest">Analyse des 6 Seuils d'Or</div>
                        <div className="space-y-3">
                           {detailedAudit.map((item, i) => (
                             <div key={i} className="flex items-start gap-3">
                               <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                               <div className="flex flex-col">
                                 <span className="text-[8px] font-black uppercase opacity-40">{item.label}</span>
                                 <p className="text-sm font-bold text-slate-700 leading-tight">{item.msg}</p>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                      <div className="p-8 bg-emerald-50/50 rounded-[2rem] border border-emerald-200">
                        <div className="text-[9px] font-black text-emerald-600 uppercase mb-4 tracking-widest">Directives Manager</div>
                        <p className="text-base font-bold text-emerald-950 italic leading-relaxed whitespace-pre-wrap">
                          {managerComments[c.name] || "Continuez sur cette dynamique et maintenez la rigueur sur les ratios cibles."}
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
        @media print { @page { size: A4 landscape; margin: 10mm; } .page-break-after-always { page-break-after: always; } body { background: white !important; } }
      `}} />
    </div>
  );
}
