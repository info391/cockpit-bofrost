import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { 
  ClipboardPaste, TrendingUp, AlertCircle, Loader2, User, ListTodo, ShieldCheck, 
  ArrowUpRight, AlertTriangle, LayoutDashboard, X, Eye, FileDown, ThumbsUp, Medal, Activity, Database, Settings, ExternalLink, Globe, CheckCircle2
} from 'lucide-react';

// --- STYLES ET CLASSES ---
const cardClass = "bg-white rounded-3xl p-6 shadow-sm border border-slate-100 transition-all";
const btnClass = "flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase text-[10px] transition-all active:scale-95 disabled:opacity-50";

// --- MOTEUR D'AUDIT LOCAL (SANS IA) ---
const runLocalAudit = (collab) => {
  const lastWeek = collab.weeks[collab.weeks.length - 1];
  if (!lastWeek) return "Données insuffisantes.";

  let advice = [];
  if (lastWeek.rClosingBC > 2) advice.push("⚠️ Ratio Close/BC trop élevé : vérifiez la qualité de l'argumentation finale.");
  if (lastWeek.rProspClose > 2) advice.push("⚠️ Ratio Prosp/Close hors cible : travaillez sur la transformation du prospect en client.");
  if (lastWeek.valBC < 12) advice.push(`🚀 Volume de BC (${lastWeek.valBC}/j) insuffisant. L'objectif est de 12.`);
  if (lastWeek.rPortePres > 3) advice.push("⚠️ Trop de portes pour un présent : revoyez l'accroche initiale.");
  
  if (advice.length === 0) return "✅ Excellente performance. Tous les indicateurs sont au vert. Maintenez cette dynamique.";
  return advice.join(' ');
};

// --- COMPOSANTS UI ---

const SidebarLink = ({ active, onClick, icon, label, disabled }) => (
  <button 
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-black transition-all ${
      disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-indigo-50/70 hover:text-indigo-700'
    } ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' : 'text-slate-400'}`}
  >
    <span className="shrink-0">{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

const MiniChart = ({ title, data, dataKey, threshold, isMax = true }) => {
  const gradId = `grad-${dataKey}`;
  return (
    <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 h-28 flex flex-col text-left">
      <p className="text-[9px] font-black text-slate-400 uppercase mb-1 truncate">{title}</p>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis dataKey="weekLabel" hide />
            <YAxis hide domain={[0, 'auto']} />
            <ReferenceLine y={threshold} stroke={isMax ? "#f43f5e" : "#10b981"} strokeDasharray="3 3" />
            <Area type="monotone" dataKey={dataKey} stroke="#6366f1" strokeWidth={2} fill={`url(#${gradId})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-between text-[7px] font-bold text-slate-400">
        <span>HEBDO</span>
        <span className={isMax ? "text-rose-500" : "text-emerald-500"}>CIBLE: {threshold}</span>
      </div>
    </div>
  );
};

// --- APPLICATION PRINCIPALE ---

export default function App() {
  const [tab, setTab] = useState('import');
  const [pastedData, setPastedData] = useState('');
  const [analysisMode, setAnalysisMode] = useState('local'); // 'local' ou 'ai'
  const [analysisResults, setAnalysisResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('em_gemini_key') || '');

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Traitement des données
  const collaborators = useMemo(() => {
    if (!pastedData || pastedData.trim().length < 10) return [];
    const lines = pastedData.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(/[|\t]/).map(h => h.trim().toLowerCase());
    const f = (k) => headers.findIndex(h => k.some(x => h.includes(x)));
    const idx = { n: f(["nom"]), s: f(["semaine"]), po: f(["portes"]), pr: f(["présent"]), ps: f(["prospect"]), cl: f(["closings"]), bc: f(["bc"]) };
    
    const map = {};
    lines.slice(1).forEach(line => {
      const p = line.split(/[|\t]/).map(v => v.trim());
      if (!p[idx.n] || p[idx.n].toLowerCase().includes("nom")) return;
      const name = p[idx.n];
      const key = name.toLowerCase().replace(/\s/g, '');
      if (!map[key]) map[key] = { name, weeks: [] };
      const bc = parseInt(p[idx.bc]) || 0;
      map[key].weeks.push({
        weekLabel: `S${p[idx.s] || '?'}`,
        rClosingBC: bc > 0 ? parseFloat((parseInt(p[idx.cl]) / bc).toFixed(2)) : 0,
        rProspClose: parseInt(p[idx.cl]) > 0 ? parseFloat((parseInt(p[idx.ps]) / parseInt(p[idx.cl])).toFixed(2)) : 0,
        rPresProsp: parseInt(p[idx.ps]) > 0 ? parseFloat((parseInt(p[idx.pr]) / parseInt(p[idx.ps])).toFixed(2)) : 0,
        rPortePres: parseInt(p[idx.pr]) > 0 ? parseFloat((parseInt(p[idx.po]) / parseInt(p[idx.pr])).toFixed(2)) : 0,
        valBC: bc
      });
    });
    return Object.values(map);
  }, [pastedData]);

  const handleAnalyse = async () => {
    setLoading(true);
    setError(null);
    const results = {};

    if (analysisMode === 'local' || !apiKey) {
      // MODE LOCAL : Pas besoin de clé, pas de quota
      collaborators.forEach(c => {
        results[c.name] = runLocalAudit(c);
      });
      setAnalysisResults(results);
      setTab('analyse');
      setLoading(false);
    } else {
      // MODE IA : Utilise la clé Google
      try {
        const prompt = `Analyser nominativement : ${pastedData.substring(0, 2000)}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (response.status === 429) throw new Error("QUOTA ÉPUISÉ. Basculez en mode 'Audit Local' dans Paramètres.");
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        collaborators.forEach(c => {
           results[c.name] = text.includes(c.name) ? text.split(c.name)[1].split('\n')[0] : runLocalAudit(c);
        });
        setAnalysisResults(results);
        setTab('analyse');
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#F9FAFB] text-slate-900 overflow-hidden font-sans text-left">
      <aside className="w-64 bg-slate-900 text-white p-6 flex flex-col gap-8 print:hidden shrink-0">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-indigo-400" size={24} />
          <span className="font-black tracking-tighter uppercase text-sm">EM Executive</span>
        </div>
        <nav className="flex flex-col gap-2">
          <SidebarLink active={tab==='import'} onClick={()=>setTab('import')} icon={<Database size={16}/>} label="Source" />
          <SidebarLink active={tab==='analyse'} onClick={()=>setTab('analyse')} icon={<LayoutDashboard size={16}/>} label="Audit" disabled={Object.keys(analysisResults).length === 0}/>
          <SidebarLink active={tab==='config'} onClick={()=>setTab('config')} icon={<Settings size={16}/>} label="Options" />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <h2 className="font-black uppercase tracking-tight italic text-sm">Audit du {today}</h2>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${analysisMode === 'local' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
              Mode: {analysisMode === 'local' ? 'Local (Sans quota)' : 'IA Gemini'}
            </span>
          </div>
          <button onClick={()=>setShowPdf(true)} disabled={Object.keys(analysisResults).length === 0} className={`${btnClass} bg-indigo-600 text-white`}><Eye size={14}/> PDF</button>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {tab === 'import' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className={cardClass}>
                <h3 className="text-lg font-black uppercase mb-4 text-indigo-600 flex items-center gap-2"><ClipboardPaste size={20}/> Données Looker</h3>
                <textarea className="w-full h-72 p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-mono text-[11px]" placeholder="Collez votre tableau ici..." value={pastedData} onChange={(e)=>setPastedData(e.target.value)}/>
                <div className="mt-6 flex justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{collaborators.length} Collaborateurs détectés</span>
                  <button onClick={handleAnalyse} disabled={loading || !pastedData} className={`${btnClass} bg-indigo-600 text-white px-10 py-4`}>
                    {loading ? <Loader2 className="animate-spin" /> : "Générer l'Audit"}
                  </button>
                </div>
                {error && <div className="mt-4 p-4 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-xl flex items-center gap-2"><AlertTriangle size={14}/> {error}</div>}
              </div>
            </div>
          )}

          {tab === 'analyse' && (
            <div className="max-w-5xl mx-auto space-y-6 pb-20">
              {collaborators.map(c => (
                <div key={c.name} className={cardClass}>
                  <div className="flex items-center gap-4 mb-6"><div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">{c.name[0]}</div><h3 className="text-lg font-black uppercase tracking-tighter">{c.name}</h3></div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <MiniChart title="Close/BC" data={c.weeks} dataKey="rClosingBC" threshold={2} />
                    <MiniChart title="Prosp/Close" data={c.weeks} dataKey="rProspClose" threshold={2} />
                    <MiniChart title="Pres/Prosp" data={c.weeks} dataKey="rPresProsp" threshold={2} />
                    <MiniChart title="Porte/Pres" data={c.weeks} dataKey="rPortePres" threshold={3} />
                    <MiniChart title="Volume BC" data={c.weeks} dataKey="valBC" threshold={12} isMax={false} />
                  </div>
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm italic font-medium text-indigo-900 leading-relaxed">
                    {analysisResults[c.name]}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'config' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className={cardClass}>
                <h3 className="text-lg font-black uppercase mb-6 text-indigo-600">Paramètres</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Type d'analyse</p>
                    <div className="flex gap-2">
                      <button onClick={()=>setAnalysisMode('local')} className={`flex-1 p-3 rounded-xl font-bold text-[10px] uppercase border transition-all ${analysisMode==='local'?'bg-indigo-600 text-white border-indigo-600':'bg-white text-slate-600 border-slate-200'}`}>Audit Local (Sans IA)</button>
                      <button onClick={()=>setAnalysisMode('ai')} className={`flex-1 p-3 rounded-xl font-bold text-[10px] uppercase border transition-all ${analysisMode==='ai'?'bg-indigo-600 text-white border-indigo-600':'bg-white text-slate-600 border-slate-200'}`}>IA Gemini (Clé requise)</button>
                    </div>
                  </div>
                  {analysisMode === 'ai' && (
                    <div className="animate-in fade-in duration-300">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Clé API Google</label>
                      <input type="password" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={apiKey} onChange={(e)=>{setApiKey(e.target.value); localStorage.setItem('em_gemini_key', e.target.value);}} placeholder="AIza..."/>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showPdf && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex flex-col p-4">
          <div className="flex justify-between text-white mb-4 px-4 max-w-5xl mx-auto w-full">
            <span className="font-black uppercase tracking-widest italic text-xs">Rapport Prêt pour Diffusion</span>
            <button onClick={()=>setShowPdf(false)}><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-auto bg-white rounded-3xl p-10 max-w-5xl mx-auto w-full" id="print-area">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b-2">
               <ShieldCheck size={40} className="text-indigo-600"/>
               <h1 className="text-2xl font-black uppercase text-slate-900">Audit de Performance - {today}</h1>
            </div>
            <div className="space-y-8">
              {collaborators.map(c => (
                <div key={`pdf-${c.name}`} className="border-b pb-8">
                  <h3 className="text-xl font-black mb-4 uppercase">{c.name}</h3>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {c.weeks.slice(-1).map(w => (
                      <React.Fragment key="stats">
                        <div className="p-2 bg-slate-50 rounded text-center"><p className="text-[8px] font-bold text-slate-400">Close/BC</p><p className="font-black">{w.rClosingBC}</p></div>
                        <div className="p-2 bg-slate-50 rounded text-center"><p className="text-[8px] font-bold text-slate-400">Prosp/Cl</p><p className="font-black">{w.rProspClose}</p></div>
                        <div className="p-2 bg-slate-50 rounded text-center"><p className="text-[8px] font-bold text-slate-400">Pres/Pr</p><p className="font-black">{w.rPresProsp}</p></div>
                        <div className="p-2 bg-slate-50 rounded text-center"><p className="text-[8px] font-bold text-slate-400">Porte/Pr</p><p className="font-black">{w.rPortePres}</p></div>
                        <div className="p-2 bg-indigo-50 rounded text-center"><p className="text-[8px] font-bold text-indigo-400">BC/j</p><p className="font-black text-indigo-600">{w.valBC}</p></div>
                      </React.Fragment>
                    ))}
                  </div>
                  <p className="text-sm italic text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{analysisResults[c.name]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
