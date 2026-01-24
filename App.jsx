import React, { useState, useEffect, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine
} from 'recharts';
import { 
  ClipboardPaste, TrendingUp, AlertCircle,
  Loader2, User, ListTodo, Scale, ChevronRight, ShieldCheck, 
  ArrowUpRight, AlertTriangle, LayoutDashboard, X, Eye, FileDown, ThumbsUp, Medal, Globe, Settings, Database, ExternalLink, Activity
} from 'lucide-react';

// --- COMPOSANTS UI ---

const TrendBadge = ({ type, small = false }) => {
  const baseClasses = `inline-flex items-center gap-1.5 ${small ? 'px-1 py-0.5 text-[7px]' : 'px-2 py-0.5 text-[8px]'} font-black rounded uppercase tracking-wider animate-in fade-in zoom-in duration-500`;
  if (type === 'up') return <span className={`${baseClasses} bg-emerald-100 text-emerald-700`}><TrendingUp size={small ? 10 : 12} /> Progression</span>;
  if (type === 'down') return <span className={`${baseClasses} bg-rose-100 text-rose-700`}><TrendingUp size={small ? 10 : 12} className="rotate-180" /> Régression</span>;
  return <span className={`${baseClasses} bg-slate-100 text-slate-600`}> Stable</span>;
};

const SidebarLink = ({ active, onClick, icon, label, disabled }) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-xs font-black transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-indigo-50/70 hover:text-indigo-700'} ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50' : 'text-slate-400'}`}
  >
    <span className={`${active ? 'text-indigo-700' : 'text-slate-400'}`}>{icon}</span>
    <span>{label}</span>
  </button>
);

const RuleItem = ({ label, target }) => (
  <div className="flex items-center justify-between text-[9px] bg-white/5 p-2 rounded-lg border border-white/5">
    <span className="font-bold text-slate-400">{label}</span>
    <span className={`font-black ${target.includes('≥') || target.includes('100') ? 'text-emerald-400' : 'text-indigo-300'}`}>{target}</span>
  </div>
);

const RuleMiniChart = ({ title, data, dataKey, threshold, isMax = true }) => (
  <div className="bg-slate-50/20 p-2.5 rounded-lg border border-slate-100 h-28 flex flex-col print:h-24 print:bg-white print:border-slate-200 text-left">
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 leading-tight h-5 overflow-hidden print:text-[8px]">{title}</p>
    <div className="flex-1 w-full text-left">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${dataKey}-${title.length}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="weekLabel" hide />
          <YAxis hide domain={[0, (dataMax) => Math.max(dataMax * 1.2, threshold * 1.2)]} />
          <ReferenceLine y={threshold} stroke={isMax ? "#f43f5e" : "#10b981"} strokeDasharray="3 3" strokeWidth={1} />
          <Area type="monotone" dataKey={dataKey} stroke="#6366f1" strokeWidth={1.5} fill={`url(#grad-${dataKey}-${title.length})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="mt-1 flex justify-between items-center text-[8px] font-black uppercase opacity-70 print:text-[7px]">
      <span>Hebdo</span>
      <span className={isMax ? "text-rose-500" : "text-emerald-500"}>Cible: {threshold}</span>
    </div>
  </div>
);

const CollaboratorAuditSection = ({ name, data, analysisItems, badges, actionPlan }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="mb-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md overflow-hidden relative page-collaborator print:mb-0 print:border-none print:shadow-none print:p-0 text-left text-left text-left">
      <div className="bg-slate-50/30 -mx-6 -mt-6 p-4 border-b border-slate-100 mb-4 print:bg-white print:p-1 print:mb-2 text-left">
        <div className="flex items-center justify-between text-left">
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black italic text-lg shadow-lg">
              {name.charAt(0)}
            </div>
            <div className="text-left">
              <h4 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-1 print:text-base text-left">{name}</h4>
              <div className="flex gap-2 text-left">
                {badges.up && <TrendBadge type="up" small />}
                {badges.down && <TrendBadge type="down" small />}
                {badges.stable && <TrendBadge type="stable" small />}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 mb-4 print:grid-cols-5 print:gap-1.5 print:mb-2 text-left">
        <RuleMiniChart title="Ratio Closings / BC" data={data} dataKey="rClosingBC" threshold={2} isMax={true} />
        <RuleMiniChart title="Ratio Prospects / Closings" data={data} dataKey="rProspClose" threshold={2} isMax={true} />
        <RuleMiniChart title="Ratio Présents / Prospects" data={data} dataKey="rPresProsp" threshold={2} isMax={true} />
        <RuleMiniChart title="Ratio Portes / Présents" data={data} dataKey="rPortePres" threshold={3} isMax={true} />
        <RuleMiniChart title="Moyenne BC / Jour" data={data} dataKey="valBC" threshold={12} isMax={false} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div className="bg-indigo-50/20 rounded-xl p-4 border border-indigo-100/30 relative text-left print:p-2 print:border-none print:bg-white text-left">
          <h5 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-2 italic print:text-[7px] text-left">Diagnostic IA EMconsulting</h5>
          <div className="space-y-2.5 text-left">
            {analysisItems.map((line, lIdx) => (
              line.type === 'alert' ? (
                <div key={lIdx} className="p-2 bg-rose-50 rounded-lg text-rose-800 text-[11px] font-bold flex items-center gap-2 border border-rose-100 text-left">
                  <AlertTriangle size={14} className="shrink-0"/> {line.content}
                </div>
              ) : (
                <p key={lIdx} className="text-slate-700 text-sm font-medium leading-relaxed print:text-[11px] text-left">
                  {line.content}
                </p>
              )
            ))}
          </div>
        </div>
        <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100/40 relative text-left print:p-2 print:border-none print:bg-white text-left text-left">
          <h5 className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-2 italic print:text-[7px] text-left">Directives Manager & Coaching</h5>
          <div className="p-4 bg-white/5 rounded-lg border border-emerald-100 min-h-[100px] print:p-1 print:border-none text-left">
            {actionPlan ? (
              <p className="text-emerald-950 text-sm font-bold leading-relaxed italic print:text-[11px] text-left">{actionPlan}</p>
            ) : (
              <p className="text-slate-300 text-xs italic text-left">Saisissez des objectifs pour cette période.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('import');
  const [pastedData, setPastedData] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showApercu, setShowApercu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [actionPlans, setActionPlans] = useState({});
  const [errorMsg, setErrorMsg] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [diagInfo, setDiagInfo] = useState(null);
  
  const [userApiKey, setUserApiKey] = useState(localStorage.getItem('em_gemini_key') || '');

  const todayDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => { if (document.body && document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const periodText = useMemo(() => {
    if (!pastedData) return "Période à définir";
    const lines = pastedData.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) return "Période à définir";
    const headers = lines[0].split(/[|\t]/).map(h => h.trim().toLowerCase());
    const weekIdx = headers.findIndex(h => h.includes("semaine"));
    if (weekIdx === -1) return "Semaine non détectée";
    const allWeeks = new Set();
    lines.slice(1).forEach(l => {
      const p = l.split(/[|\t]/);
      if (p[weekIdx]) {
        const val = p[weekIdx].replace(/[^0-9]/g, '');
        if (val) allWeeks.add(parseInt(val));
      }
    });
    const sorted = Array.from(allWeeks).sort((a,b) => a - b);
    return sorted.length === 0 ? "..." : (sorted.length === 1 ? `Semaine ${sorted[0]}` : `Semaines ${sorted[0]} à ${sorted[sorted.length-1]}`);
  }, [pastedData]);

  const processedDataMap = useMemo(() => {
    if (!pastedData) return {};
    const lines = pastedData.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) return {};
    const headers = lines[0].split(/[|\t]/).map(h => h.trim().toLowerCase());
    const find = (keys) => headers.findIndex(h => keys.some(k => h.includes(k)));
    const idx = {
      name: find(["nom"]), semaine: find(["semaine"]), portes: find(["portes"]),
      presents: find(["présents", "presents"]), prospects: find(["prospects"]),
      closings: find(["closings"]), bc: find(["bc annoncés", "bc"])
    };
    
    const map = {};
    lines.slice(1).forEach(line => {
      const p = line.split(/[|\t]/).map(v => v.trim());
      const rawName = idx.name !== -1 ? p[idx.name] : null;
      if (!rawName || rawName === "Nom du collaborateur") return;
      
      const normName = rawName.toLowerCase().replace(/\s/g, '');
      const weekNum = idx.semaine !== -1 && p[idx.semaine] ? p[idx.semaine].replace(/[^0-9]/g, '') : "0";
      const weekKey = `${normName}_W${weekNum}`;
      
      if (!map[weekKey]) {
        map[weekKey] = {
          name: rawName, normName: normName, weekLabel: `S${weekNum}`,
          daysCount: 0, portes: 0, presents: 0, prospects: 0, closings: 0, bc: 0
        };
      }
      map[weekKey].daysCount += 1;
      map[weekKey].portes += parseInt(p[idx.portes]) || 0;
      map[weekKey].presents += parseInt(p[idx.presents]) || 0;
      map[weekKey].prospects += parseInt(p[idx.prospects]) || 0;
      map[weekKey].closings += parseInt(p[idx.closings]) || 0;
      map[weekKey].bc += parseInt(p[idx.bc]) || 0;
    });

    const collabFinalMap = {};
    Object.values(map).forEach(w => {
      const d = {
        weekLabel: w.weekLabel,
        rClosingBC: w.bc > 0 ? parseFloat((w.closings / w.bc).toFixed(2)) : 0,
        rProspClose: w.closings > 0 ? parseFloat((w.prospects / w.closings).toFixed(2)) : 0,
        rPresProsp: w.prospects > 0 ? parseFloat((w.presents / w.prospects).toFixed(2)) : 0,
        rPortePres: w.presents > 0 ? parseFloat((w.portes / w.presents).toFixed(2)) : 0,
        valBC: w.daysCount > 0 ? parseFloat((w.bc / w.daysCount).toFixed(1)) : 0
      };
      if (!collabFinalMap[w.normName]) collabFinalMap[w.normName] = { name: w.name, weeks: [] };
      collabFinalMap[w.normName].weeks.push(d);
    });
    return collabFinalMap;
  }, [pastedData]);

  const teamRanking = useMemo(() => {
    return Object.values(processedDataMap).map(c => {
      const lastWeek = c.weeks[c.weeks.length - 1];
      return { name: c.name, bc: lastWeek?.valBC || 0 };
    }).sort((a, b) => b.bc - a.bc);
  }, [processedDataMap]);

  useEffect(() => {
    const values = Object.values(processedDataMap);
    if (values.length > 0) setCollaborators(values.map(c => c.name));
  }, [processedDataMap]);

  const saveApiKey = (key) => {
    const cleanKey = key.trim();
    setUserApiKey(cleanKey);
    localStorage.setItem('em_gemini_key', cleanKey);
  };

  const runDiagnostic = async () => {
    if (!userApiKey) return;
    setDiagInfo("Lancement du test d'accès Google...");
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${userApiKey}`);
      const res = await response.json();
      if (res.error) {
        setDiagInfo(`ERREUR API : ${res.error.message}\nStatut : ${res.error.status}`);
      } else {
        const names = res.models.map(m => m.name.replace('models/', ''));
        setDiagInfo(`SUCCÈS ! Modèles actifs : ${names.slice(0,5).join(', ')}...`);
      }
    } catch (e) {
      setDiagInfo(`ÉCHEC RÉSEAU : ${e.message}`);
    }
  };

  const fetchWithRetry = async (url, options, maxRetries = 3) => {
    let lastError = new Error("Erreur inconnue");
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        let resText = await response.text();
        let res = null;
        
        try {
          res = JSON.parse(resText);
        } catch (e) {
          throw new Error(`Réponse non-JSON de Google (${response.status}) : ${resText.substring(0, 100)}`);
        }
        
        if (response.status === 429) { 
          const delay = Math.pow(2, i) * 2000;
          setRetryCount(i + 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (!response.ok) {
          throw new Error(res?.error?.message || `Erreur serveur ${response.status}`);
        }

        if (!res?.candidates || res.candidates.length === 0) {
           const reason = res?.promptFeedback?.blockReason || "Aucune réponse (Filtres de sécurité)";
           throw new Error(reason);
        }

        return res;
      } catch (err) {
        lastError = err;
        if (i === maxRetries - 1) throw lastError;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw lastError;
  };

  const handleAnalyse = async () => {
    if (!userApiKey) {
      setErrorMsg("Saisissez votre clé API dans l'onglet Configuration.");
      setActiveTab('config');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setRetryCount(0);
    
    const fullMessage = `Tu es l'Expert Coach EMconsulting Bofrost. 
    STRUTURE OBLIGATOIRE DU RAPPORT :
    1. Commence par la balise exacte : [SECTION_START]Bilan d'Agence[SECTION_END]
    2. Liste ensuite 3 points positifs [POS] et 3 d'amélioration [AMEL]
    3. Pour chaque collaborateur, utilise : [COLLAB_START]Nom Complet[COLLAB_END]
    
    CIBLE PERFORMANCE : 12 BC/jour.
    DONNÉES À ANALYSER POUR LA PÉRIODE ${periodText} :
    ${pastedData}`;

    // STRATÉGIE DE MODÈLES : Utilisation des identifiants les plus robustes
    const attempts = [
      { ver: 'v1beta', model: 'gemini-2.0-flash-exp' },
      { ver: 'v1beta', model: 'gemini-1.5-flash' },
      { ver: 'v1beta', model: 'gemini-1.5-flash-8b' }
    ];

    let success = false;
    let errors = [];

    for (const config of attempts) {
      if (success) break;
      try {
        const url = `https://generativelanguage.googleapis.com/${config.ver}/models/${config.model}:generateContent?key=${userApiKey}`;
        const body = { contents: [{ parts: [{ text: fullMessage }] }] };

        const res = await fetchWithRetry(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const text = res?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          setAnalysis(text);
          setActiveTab('analyse');
          success = true;
          setErrorMsg(null);
        }
      } catch (err) {
        errors.push(`${config.model} : ${err.message}`);
      }
    }

    if (!success) {
      setErrorMsg(`Échec de l'Analyse. Détails des tentatives :\n${errors.join('\n')}`);
    }
    
    setLoading(false);
  };

  const auditContent = useMemo(() => {
    if (!analysis) return null;
    const items = [];
    const lines = analysis.split('\n');
    let currentBlock = null;
    let agencySummary = { pos: [], amel: [] };
    
    if (!analysis.includes('[SECTION_START]') && !analysis.includes('[COLLAB_START]')) {
      return (
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-[2rem] shadow-xl text-left whitespace-pre-wrap text-slate-700 leading-relaxed font-medium">
          <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-800 text-xs font-bold uppercase tracking-widest text-left">Analyse brute (Structure non détectée)</div>
          {analysis}
        </div>
      );
    }

    lines.forEach(line => {
      const cleanLine = line.replace(/\[UP\]|\[DOWN\]|\[STABLE\]/g, '').trim();
      if (line.toUpperCase().includes('[POS]')) agencySummary.pos.push(cleanLine.replace(/\[POS\]/gi, '').trim());
      if (line.toUpperCase().includes('[AMEL]')) agencySummary.amel.push(cleanLine.replace(/\[AMEL\]/gi, '').trim());
    });

    lines.forEach((line) => {
      const clean = line.replace(/\[UP\]|\[DOWN\]|\[STABLE\]/g, '').trim();
      if (line.includes('[SECTION_START]')) items.push({ type: 'title', content: clean.replace(/\[SECTION_START\]|\[SECTION_END\]/g, ''), summary: { ...agencySummary } });
      else if (line.includes('[COLLAB_START]')) {
        const name = clean.replace(/\[COLLAB_START\]|\[COLLAB_END\]/g, '').trim();
        currentBlock = { type: 'collaborator', name, normName: name.toLowerCase().replace(/\s/g, ''), analysis: [], badges: { up: line.includes('[UP]'), down: line.includes('[DOWN]') } };
        items.push(currentBlock);
      } 
      else if (line.includes('[ALERT]')) {
        if (currentBlock) currentBlock.analysis.push({ type: 'alert', content: clean.replace(/\[ALERT\]|\[ALERT_END\]/g, '') });
      } 
      else if (clean.length > 0 && !line.includes('[POS]') && !line.includes('[AMEL]')) {
        if (currentBlock) currentBlock.analysis.push({ type: 'text', content: clean });
        else if (!line.includes('[SECTION_START]')) items.push({ type: 'text', content: clean });
      }
    });

    return items.map((item, idx) => {
      if (item.type === 'title') {
        return (
          <div key={idx} className="px-4 agency-summary-section text-left">
             <div className="flex items-center gap-4 mb-6 mt-2"><h3 className="text-lg font-black text-indigo-950 uppercase border-l-[4px] border-indigo-600 pl-4">{item.content}</h3><div className="h-px bg-slate-200 flex-1"></div></div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-left text-left">
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 print:p-3 print:bg-white text-left"><div className="flex items-center gap-2 mb-4 text-emerald-700 font-black text-xs uppercase tracking-widest"><ThumbsUp size={16}/> Points Positifs</div><ul className="space-y-3">{item.summary.pos.slice(0,3).map((p, i) => <li key={i} className="text-[14px] font-extrabold text-emerald-900 leading-tight flex gap-3 print:text-[12px]"><span className="text-emerald-400">•</span> {p}</li>)}</ul></div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 print:p-3 print:bg-white text-left"><div className="flex items-center gap-2 mb-4 text-amber-700 font-black text-xs uppercase tracking-widest"><AlertCircle size={16}/> Axes d'Amélioration</div><ul className="space-y-3">{item.summary.amel.slice(0,3).map((p, i) => <li key={i} className="text-[14px] font-extrabold text-amber-900 leading-tight flex gap-3 print:text-[12px]"><span className="text-amber-400">•</span> {p}</li>)}</ul></div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 print:p-3 print:bg-white text-left text-left text-left"><div className="flex items-center gap-2 mb-4 text-indigo-700 font-black text-xs uppercase tracking-widest"><Medal size={16}/> Podium BC</div><div className="space-y-2">{teamRanking.slice(0, 5).map((player, i) => <div key={i} className="flex justify-between text-[11px] font-black uppercase text-left"><span className="text-slate-500 text-left text-left">{i+1}. {player.name}</span><span className={player.bc >= 12 ? 'text-emerald-600' : 'text-rose-600'}>{player.bc}/j</span></div>)}</div></div>
             </div>
          </div>
        );
      }
      if (item.type === 'collaborator') return <CollaboratorAuditSection key={idx} {...item} data={processedDataMap[item.normName]?.weeks || []} actionPlan={actionPlans[item.normName]} />;
      return null;
    });
  }, [analysis, processedDataMap, teamRanking, actionPlans]);

  const exportToPDF = () => {
    if (!window.html2pdf) return;
    setIsExporting(true);
    const element = document.getElementById('print-area');
    window.html2pdf().from(element).set({
      margin: 5, filename: `Audit_Executive_Bofrost_${todayDate.replace(/\s/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 1.5, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css', 'legacy'], after: '.agency-summary-section', avoid: '.page-collaborator' }
    }).save().then(() => setIsExporting(false));
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden text-sm">
      <aside className="w-64 bg-indigo-950 text-white flex flex-col shadow-2xl z-20 print:hidden text-left text-left text-left">
        <div className="p-5 border-b border-white/10 bg-indigo-900/40">
          <div className="flex items-center gap-3 mb-2"><div className="p-1.5 bg-indigo-500 rounded-lg shadow-lg"><ShieldCheck size={18} className="text-white" /></div><span className="font-black text-base tracking-tighter uppercase leading-none text-left">EM EXECUTIVE</span></div>
          <p className="text-indigo-300 text-[7px] font-black uppercase tracking-[0.2em] opacity-60 italic text-left">Stable Release v19.2</p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[8px] font-black uppercase tracking-widest"><Globe size={10}/> Production</div>
        </div>
        <div className="flex-1 p-3 space-y-6 overflow-y-auto">
          <nav className="space-y-1 text-left">
            <SidebarLink active={activeTab === 'import'} onClick={() => setActiveTab('import')} icon={<ClipboardPaste size={16}/>} label="Source de Données" />
            <SidebarLink active={activeTab === 'analyse'} onClick={() => setActiveTab('analyse')} icon={<LayoutDashboard size={16}/>} label="Audit Performance" disabled={!analysis} />
            <SidebarLink active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} icon={<ListTodo size={16}/>} label="Directives Coaching" disabled={collaborators.length === 0} />
            <SidebarLink active={activeTab === 'config'} onClick={() => setActiveTab('config')} icon={<Settings size={16}/>} label="Configuration" />
          </nav>
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-left">
             <h3 className="font-black text-indigo-400 uppercase tracking-[0.2em] text-[8px] mb-4 text-left">Les 6 Seuils d'Or</h3>
             <div className="space-y-2 text-left">
                <RuleItem label="Ratio Close / BC" target="≤ 2" /><RuleItem label="Ratio Prosp / Close" target="≤ 2" /><RuleItem label="Ratio Pres / Prosp" target="≤ 2" /><RuleItem label="Ratio Porte / Pres" target="≤ 3" /><RuleItem label="Volume BC / Jour" target="≥ 12" /><RuleItem label="Taux de Présence" target="100%" />
             </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden relative text-left text-left">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 print:hidden text-left text-left">
          <div className="flex flex-col text-left"><h2 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none italic text-left">Analyse du {todayDate}</h2><p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic tracking-widest text-left">{periodText}</p></div>
          <div className="flex items-center gap-4 text-left">
             <button onClick={() => setShowApercu(true)} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg font-black uppercase text-[9px] hover:bg-indigo-700 transition-all shadow-lg cursor-pointer active:scale-95 text-left" disabled={!analysis}><Eye size={14}/> Aperçu PDF</button>
             <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 shadow-inner text-left text-left text-left"><User size={18}/></div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar print:p-0 text-left text-left">
          {activeTab === 'import' && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 text-left text-left text-left">
              <div className="bg-white rounded-[2rem] p-10 shadow-xl border border-slate-100 relative overflow-hidden text-left text-left text-left">
                <div className="flex items-center gap-6 mb-8 text-left text-left text-left text-left text-left"><div className="bg-indigo-600 p-4 rounded-xl text-white shadow-2xl text-left text-left"><ClipboardPaste size={28}/></div><div><h3 className="text-2xl font-black tracking-tighter text-slate-950 uppercase leading-none text-left text-left text-left">Données Bofrost</h3><p className="text-xs font-bold text-slate-400 mt-2 italic uppercase tracking-wider text-left text-left text-left">Copier-coller le tableau Looker Studio ici</p></div></div>
                <textarea className="w-full h-64 p-6 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none text-[10px] font-mono shadow-inner text-left text-left" placeholder="Collez vos données ici..." value={pastedData} onChange={(e) => setPastedData(e.target.value)}/>
                
                <div className="mt-6 grid grid-cols-2 gap-4 text-left text-left text-left">
                   <div className={`p-4 rounded-xl border flex items-center gap-3 ${collaborators.length > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'} text-left text-left text-left`}>
                      <Database size={20}/>
                      <div><p className="text-[10px] font-black uppercase tracking-tighter text-left">Collaborateurs détectés</p><p className="text-lg font-bold text-left">{collaborators.length}</p></div>
                   </div>
                   <div className={`p-4 rounded-xl border flex items-center gap-3 ${userApiKey ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-rose-50 border-rose-100 text-rose-700'} text-left text-left text-left`}>
                      <Settings size={20}/>
                      <div><p className="text-[10px] font-black uppercase tracking-tighter text-left text-left">Clé IA Gemini</p><p className="text-lg font-bold text-left text-left">{userApiKey ? 'CONFIGURÉE' : 'MANQUANTE'}</p></div>
                   </div>
                </div>

                {errorMsg && <div className="mt-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-[10px] font-mono whitespace-pre-wrap flex items-start gap-3 shadow-sm text-left text-left text-left"><AlertCircle size={20} className="shrink-0"/> <span>{errorMsg}</span></div>}
                
                <div className="mt-8 flex justify-end text-left">
                  <button onClick={handleAnalyse} disabled={loading || !pastedData} className="group px-10 py-4 bg-indigo-600 text-white rounded-xl font-black text-base shadow-2xl hover:bg-indigo-700 transition-all uppercase flex items-center gap-3 active:scale-95 cursor-pointer text-left">
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" /> 
                        {retryCount > 0 ? `Retry (${retryCount})...` : "Calcul de l'Audit..."}
                      </>
                    ) : (
                      <>
                        <ArrowUpRight /> Lancer l'Analyse
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'analyse' && <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-right-12 duration-700 pb-24 text-left text-left text-left text-left text-left">{auditContent}</div>}
          {activeTab === 'plans' && (
            <div className="max-w-5xl mx-auto space-y-10 pb-24 text-left text-left text-left text-left text-left text-left">
               {collaborators.map(name => (
                  <div key={name} className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-200 text-left">
                     <div className="flex items-center gap-6 mb-8 text-left text-left text-left text-left text-left text-left text-left"><div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl font-black italic shadow-inner text-left text-left">{name.charAt(0)}</div><span className="text-3xl font-black text-slate-950 tracking-tighter uppercase text-left text-left">{name}</span></div>
                     <textarea className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none text-lg font-bold text-slate-700 leading-relaxed italic shadow-inner text-left text-left" placeholder={`Directives de coaching pour ${name}...`} value={actionPlans[name.toLowerCase().replace(/\s/g, '')] || ''} onChange={(e) => setActionPlans({...actionPlans, [name.toLowerCase().replace(/\s/g, '')]: e.target.value})}/>
                  </div>
               ))}
               <button onClick={() => setActiveTab('analyse')} className="w-full py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-indigo-700 uppercase tracking-tighter transform hover:-translate-y-1 transition-all text-center text-center text-center">Mettre à jour le rapport PDF</button>
            </div>
          )}
          {activeTab === 'config' && (
            <div className="max-w-2xl mx-auto text-left text-left text-left text-left text-left text-left text-left">
               <div className="bg-white rounded-[2rem] p-10 shadow-xl border border-slate-100 text-left text-left text-left text-left">
                  <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-3 text-indigo-600 italic tracking-tighter text-left text-left text-left"><Settings size={24}/> Paramètres IA</h3>
                  <div className="space-y-6 text-left text-left">
                     <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[12px] font-bold shadow-sm text-left text-left text-left text-left text-left text-left">
                        <p className="mb-2 uppercase tracking-wider italic text-left text-left text-left">Aide à la connexion :</p>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline text-left text-left text-left">
                           1. Créer une clé gratuite sur Google AI Studio <ExternalLink size={14}/>
                        </a>
                        <p className="mt-1 font-normal opacity-80 italic text-left text-left text-left text-left">Note : Utilisez bien une clé "Google AI Studio" (commençant par AIza).</p>
                     </div>
                     <div className="text-left text-left text-left text-left">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic tracking-widest text-left text-left">Clé API Google Gemini (Format AIza...)</label>
                        <input type="password" value={userApiKey} onChange={(e) => saveApiKey(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-600 outline-none font-mono text-sm shadow-inner text-left text-left" placeholder="Collez votre clé ici..."/>
                        <p className="mt-2 text-[10px] text-slate-400 italic text-left text-left">Cette clé est stockée uniquement dans votre navigateur.</p>
                     </div>
                     <div className="pt-4 border-t border-slate-100 text-left text-left text-left text-left">
                        <button onClick={runDiagnostic} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase transition-all shadow-sm text-left">
                           <Activity size={14}/> Lancer le Diagnostic Clé
                        </button>
                        {diagInfo && (
                           <div className="mt-3 p-3 bg-slate-900 text-emerald-400 font-mono text-[9px] rounded-lg border border-slate-800 break-words leading-relaxed whitespace-pre-wrap text-left text-left">
                              {diagInfo}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </main>
      {showApercu && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col items-center p-4 overflow-hidden text-left text-left text-left text-left text-left text-left text-left">
           <div className="w-full max-w-7xl flex items-center justify-between mb-3 text-white px-2 text-left text-left text-left text-left text-left">
              <div className="flex items-center gap-3 text-left text-left text-left text-left text-left text-left text-left text-left"><div className="p-2 bg-indigo-600 rounded-lg text-left text-left text-left text-left text-left text-left"><Eye size={18}/></div><div><h3 className="text-lg font-black uppercase tracking-widest leading-none italic tracking-tighter text-left text-left text-left text-left text-left text-left">Rapport Prêt pour Diffusion</h3></div></div>
              <div className="flex items-center gap-4 text-left text-left text-left text-left text-left text-left text-left"><button onClick={exportToPDF} disabled={isExporting} className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl flex items-center gap-3 shadow-2xl text-base uppercase disabled:opacity-50 tracking-tighter cursor-pointer text-left text-left text-left text-left">{isExporting ? <Loader2 className="animate-spin" size={18}/> : <FileDown size={22}/>} {isExporting ? "Calcul..." : "Télécharger PDF"}</button><button onClick={() => setShowApercu(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer text-left text-left text-left text-left text-left text-left"><X size={24}/></button></div>
           </div>
           <div className="flex-1 w-full bg-slate-800 rounded-2xl overflow-y-auto p-6 shadow-inner text-left text-left text-left text-left text-left text-left text-left text-left">
              <div className="bg-white mx-auto shadow-2xl print-wrapper text-left text-left text-left text-left text-left text-left text-left" style={{ width: '280mm' }} id="print-area"><div className="p-10 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-100 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><ShieldCheck size={32} className="text-indigo-600"/><div className="flex flex-col text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none italic text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Audit Stratégique Hebdomadaire - {todayDate}</h1><p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1 italic tracking-widest text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Dossiers de Performance EMconsulting ({periodText})</p></div></div>{auditContent}</div></div>
           </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .agency-summary-section { page-break-after: always; break-after: page; }
        .page-collaborator:not(:last-child) { page-break-after: always; break-after: page; }
        @media print { @page { size: A4 landscape; margin: 5mm; } }
      `}} />
    </div>
  );
}
