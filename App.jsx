import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { 
  ClipboardPaste, TrendingUp, AlertCircle, Loader2, User, ListTodo, ShieldCheck, 
  ArrowUpRight, AlertTriangle, LayoutDashboard, X, Eye, FileDown, ThumbsUp, Activity, Database, Settings, Scale, Brain, Calendar, MessageSquareText, Hash, Printer, Users, CheckCircle2, ExternalLink, Filter, Check, ChevronDown, Download, Trash2, TrendingDown, Minus, Building2
} from 'lucide-react';

// --- CONSTANTES DE STYLE ---
const cardClass = "bg-white rounded-3xl p-6 shadow-sm border border-blue-50 transition-all hover:shadow-lg";

// --- COMPOSANTS UI DE BASE ---

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

const StatBox = ({ label, value, threshold, isMax = true, isAverage = false, suffix = "" }) => {
  const numValue = parseFloat(value);
  const isTargetMet = isMax ? numValue <= threshold : numValue >= threshold;
  
  const bgColor = isTargetMet ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100';
  const textColor = isTargetMet ? 'text-emerald-700' : 'text-rose-700';

  return (
    <div className={`p-3 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden ${bgColor} shadow-sm print:p-1`}>
      <span className="text-[6px] font-black text-slate-400 uppercase mb-0.5 tracking-widest text-center leading-tight h-4 overflow-hidden print:text-[5px]">{label}</span>
      <span className={`text-base font-black ${textColor} print:text-[11px]`}>{value}{suffix}</span>
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full text-left" ref={dropdownRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
        <Icon size={14} /> {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-[#0033a0] transition-all focus:ring-2 ring-blue-500/10"
      >
        <span className="text-xs font-bold text-slate-700 truncate mr-2">
          {selected.length === 0 ? "Tous sélectionnés" : `${selected.length} sélectionné(s)`}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
          {options.map((opt) => (
            <button
              key={`dropdown-opt-${opt}`}
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

// --- MOTEUR D'AUDIT LOCAL DEVELOPPÉ (6 CLÉS - ARGUMENTATION RICHE 500-600 CHARS) ---
const runDetailedAudit = (averages) => {
  if (!averages) return [];

  const check = (val, threshold, label, successMsg, failMsg, passArg, failArg, isMax = true, suffix = "") => {
    const num = parseFloat(val);
    const met = isMax ? num <= threshold : num >= threshold;
    const valueDisplay = `${num}${suffix}`;
    const targetDisplay = isMax ? `≤ ${threshold}${suffix}` : `≥ ${threshold}${suffix}`;
    
    return {
      label,
      met,
      summary: met ? successMsg : failMsg,
      numericalDetail: `Diagnostic : ${met ? passArg : failArg} (Moyenne observée : ${valueDisplay} pour un objectif fixé à ${targetDisplay}).`
    };
  };

  return [
    check(
      averages.rPortePres, 3, "Portes / Présents", 
      "L'accroche et le ciblage sont excellents.", "Le taux de présence à l'écoute est insuffisant.",
      "Votre maîtrise du ratio Portes/Présents démontre une excellente lecture de vos secteurs. Vous savez manifestement identifier les moments et les lieux où les prospects sont présents et disposés à vous écouter. Cette efficacité dans l'approche vous permet de maximiser votre temps de présentation sans gaspiller d'énergie sur des portes closes ou des refus catégoriques. C'est un atout majeur qui fluidifie tout le reste de votre entonnoir de vente. Continuez à appliquer cette rigueur dans le choix de vos horaires de passage et dans la qualité de votre contact initial.",
      "Un ratio Portes/Présents trop élevé indique souvent que vous ne trouvez pas assez de personnes à la maison ou que vous n'arrivez pas à transformer l'ouverture de porte en temps d'écoute. Pour corriger cela, optimisez vos tournées en ciblant les horaires stratégiques (fin de journée ou mercredi). Travaillez aussi votre accroche de 'pas de porte' : l'objectif est de rassurer immédiatement pour que le client accepte votre présence. Soyez plus observateur sur les signes de vie dans les habitations pour ne pas frapper inutilement et préserver votre énergie pour les vrais potentiels.",
      true
    ),
    check(
      averages.rPresProsp, 2, "Présents / Prospects", 
      "Découverte client maîtrisée.", "Phase de découverte insuffisante.",
      "Votre capacité à transformer un présent en prospect montre que vous savez identifier avec précision les besoins réels du foyer durant votre présentation. En posant les bonnes questions ouvertes, vous amenez le client à verbaliser ses attentes, ce qui facilite grandement la suite du processus. Vous ne faites pas qu'exposer des produits, vous apportez des solutions concrètes, ce qui crée une valeur perçue élevée. Continuez à soigner cette étape de qualification qui est le socle de votre réussite actuelle.",
      "Vous présentez nos services mais vous ne parvenez pas assez à convaincre de leur utilité. Il est crucial de passer plus de temps sur la phase de découverte pour isoler les habitudes de consommation du foyer. Actuellement, votre discours semble trop générique et ne crée pas assez d'impact émotionnel ou pratique chez le client. Travaillez sur l'écoute active : laissez le client s'exprimer davantage pour pouvoir rebondir sur ses points de douleur spécifiques. Sans un prospect qualifié, le closing restera une étape laborieuse.",
      true
    ),
    check(
      averages.rProspClose, 2, "Prospects / Closing", 
      "Transformation fluide.", "Engagement client fragile.",
      "Votre sélection qualitative des prospects en amont garantit une transition naturelle vers la vente. Vous savez trier les profils dès le départ, ce qui vous évite de perdre du temps sur des négociations stériles. Votre force réside dans la validation progressive des étapes de vente : quand vous arrivez au closing, le client est déjà convaincu psychologiquement. Cette fluidité réduit votre fatigue mentale et renforce votre image de professionnel du conseil plutôt que de simple vendeur. Maintenez cette rigueur de tri.",
      "L'engagement client s'affaiblit systématiquement en fin de parcours, ce qui indique un manque de verrouillage lors des étapes précédentes. Vous arrivez souvent au closing face à des objections qui auraient dû être levées bien plus tôt. Il est nécessaire de travailler la reformulation et la validation par 'petits oui' tout au long de votre présentation. Si le client hésite au moment final, c'est que la valeur ajoutée perçue n'est pas encore assez forte ou que des freins n'ont pas été exprimés. Soyez plus direct dans votre recherche de validation.",
      true
    ),
    check(
      averages.rClosingBC, 2, "Closing / BC", 
      "Clôture administrative parfaite.", "Vérifiez votre processus de saisie.",
      "Votre taux de transformation entre le closing moral et la saisie du bon de commande est exemplaire. Cela prouve que vous sécurisez parfaitement l'engagement du client et que vous maîtrisez l'aspect administratif sans créer de friction. Le client se sent accompagné jusqu'au bout, ce qui limite les rétractations précoces et les doutes post-achat. Cette rigueur dans la conclusion est le signe d'une grande confiance en soi et en la qualité de l'offre proposée. C'est un atout majeur pour la stabilité de vos résultats.",
      "Trop de ventes validées oralement s'évaporent avant la signature définitive du bon de commande. Ce décalage suggère une baisse de tension ou un manque de professionnalisme au moment de sortir le document officiel. Le client ressent peut-être votre propre hésitation, ce qui réactive ses peurs. Assurez-vous d'avoir levé tous les derniers doutes et restez ferme dans votre posture de conseil jusqu'à la validation technique. La vente n'est terminée que lorsque le document est signé et les modalités de livraison clairement acceptées.",
      true
    ),
    check(
      averages.valBC, 12, "BC / Jour", 
      "Volume de production solide.", "Productivité quotidienne à renforcer.",
      "Votre productivité quotidienne est en parfaite adéquation avec les standards de rentabilité de l'agence. Ce volume régulier assure non seulement vos revenus, mais il témoigne aussi d'une gestion exemplaire de votre secteur et de votre énergie sur le terrain. En maintenant cette cadence, vous vous donnez les moyens d'amortir les jours plus difficiles et de surperformer lors des périodes de forte activité. Votre assiduité au travail est votre meilleur moteur de croissance, restez sur cette dynamique de succès.",
      "Votre volume moyen de commandes ne permet pas d'exploiter tout le potentiel de votre secteur géographique. Pour stabiliser vos résultats, vous devez impérativement augmenter votre nombre de passages ou optimiser radicalement vos ratios de transformation. Une productivité en retrait est souvent le signe d'une baisse d'intensité sur le terrain ou d'une mauvaise organisation de votre tournée. Fixez-vous des objectifs horaires stricts pour ne pas laisser le temps de doute s'installer. Le succès en vente directe est avant tout une question de rythme.",
      false
    ),
    check(
      averages.attendance, 100, "Disponibilité totale.", "Irrégularité pénalisante.",
      "Votre engagement total sur le terrain est le fondement de votre réussite. Votre présence constante assure une couverture secteur optimale et renforce la crédibilité de l'agence auprès de vos clients qui apprécient la régularité du service. Cette fiabilité est indispensable pour construire un portefeuille client solide et fidèle sur le long terme. C'est votre sérieux qui fait la différence avec la concurrence et qui sécurise votre carrière au sein de la structure. Continuez à faire preuve de cette discipline.",
      "Vos absences répétées ou irrégulières brisent la dynamique commerciale indispensable à la tenue de votre secteur. Chaque jour manqué est une opportunité perdue et un signal négatif envoyé à votre clientèle qui attend de la régularité. En vente directe, le manque de présence est le premier facteur de chute des résultats, car il empêche la création d'un cercle vertueux de prospection et de recommandation. La discipline de présence est le levier le plus simple mais le plus puissant pour redresser durablement vos indicateurs.",
      false, "%"
    )
  ];
};

// --- APPLICATION PRINCIPALE ---

export default function App() {
  const [tab, setTab] = useState('import');
  const [pastedData, setPastedData] = useState('');
  const [analysisResults, setAnalysisResults] = useState({});
  const [agencyAudit, setAgencyAudit] = useState([]);
  const [managerComments, setManagerComments] = useState({});
  const [agencyComment, setAgencyComment] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedWeeks, setSelectedWeeks] = useState([]);

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.html2pdf) {
      const s = document.createElement('script');
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  const rawDataEntries = useMemo(() => {
    if (!pastedData || pastedData.trim().length < 10) return [];
    const lines = pastedData.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(/[|\t]/).map(h => h.trim().toLowerCase());
    const f = (k) => headers.findIndex(h => k.some(x => h.includes(x)));
    const idx = { 
      name: f(["nom"]), semaine: f(["semaine"]), mois: f(["mois"]), 
      date: f(["date"]), po: f(["portes"]), pr: f(["présent"]), 
      ps: f(["prospect"]), cl: f(["closings"]), bc: f(["bc"]), att: f(["présence"]) 
    };

    return lines.slice(1).map(line => {
      const p = line.split(/[|\t]/).map(v => v.trim());
      if (!p[idx.name] || p[idx.name].toLowerCase().includes("nom")) return null;
      const monthFromCol = idx.mois !== -1 ? p[idx.mois] : "Inconnu";
      const weekVal = p[idx.semaine] || "0";
      return {
        name: p[idx.name], week: weekVal, month: monthFromCol,
        po: parseInt(p[idx.po]) || 0, pr: parseInt(p[idx.pr]) || 0,
        ps: parseInt(p[idx.ps]) || 0, cl: parseInt(p[idx.cl]) || 0,
        bc: parseInt(p[idx.bc]) || 0,
        isPresent: (idx.att !== -1 && p[idx.att]) ? (p[idx.att].toUpperCase().startsWith('P')) : true
      };
    }).filter(e => e !== null);
  }, [pastedData]);

  const availableFilters = useMemo(() => {
    const m = [...new Set(rawDataEntries.map(e => e.month))].filter(v => v && v !== "Inconnu").sort();
    const w = [...new Set(rawDataEntries.map(e => e.week))].sort((a, b) => parseInt(a) - parseInt(b));
    return { months: m, weeks: w.map(v => `S${v}`) };
  }, [rawDataEntries]);

  useEffect(() => {
    setSelectedMonths([]);
    setSelectedWeeks([]);
  }, [pastedData]);

  const dataSummary = useMemo(() => {
    if (rawDataEntries.length === 0) return { count: 0, collabs: [], agencyAvg: {}, range: "Aucune donnée" };
    const filtered = rawDataEntries.filter(e => {
      const mMatch = selectedMonths.length === 0 || selectedMonths.includes(e.month);
      const wMatch = selectedWeeks.length === 0 || selectedWeeks.includes(`S${e.week}`);
      return mMatch && wMatch;
    });
    if (filtered.length === 0) return { count: 0, collabs: [], agencyAvg: {}, range: "Sélection vide" };

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
      map[k].weeks.push({ isPresent: e.isPresent, po: e.po, pr: e.pr, ps: e.ps, cl: e.cl, bc: e.bc });
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
          rPortePres: (sums.po / wL).toFixed(2), rPresProsp: (sums.pr / wL).toFixed(2),
          rProspClose: (sums.ps / wL).toFixed(2), rClosingBC: (sums.cl / wL).toFixed(2),
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

    const range = `${selectedMonths.length > 0 ? selectedMonths.join(', ') : 'Toute la période'} | ${selectedWeeks.length > 0 ? selectedWeeks.join(', ') : 'Toutes semaines'}`;
    return { count: collabs.length, collabs, agencyAvg, range };
  }, [rawDataEntries, selectedMonths, selectedWeeks]);

  const handleAnalyse = () => {
    setLoading(true);
    const agencyRes = runDetailedAudit(dataSummary.agencyAvg);
    setAgencyAudit(agencyRes);
    const results = {};
    dataSummary.collabs.forEach(c => { results[c.name] = runDetailedAudit(c.averages); });
    setAnalysisResults(results);
    setTab('analyse');
    setLoading(false);
  };

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (!win) { alert("Autorisez les pop-ups pour imprimer."); return; }
    const html = document.getElementById('print-area').innerHTML;
    const styles = document.head.innerHTML;
    win.document.write(`<html><head>${styles}<style>
      body { font-family: sans-serif; margin: 0; padding: 0; background: white; text-align: left; }
      .print-page { width: 210mm; height: 296mm; padding: 15mm; box-sizing: border-box; page-break-after: always !important; display: flex; flex-direction: column; text-align: left; }
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
      margin: 0, filename: `Audit_Executive_${today.replace(/\s/g, '_')}.pdf`,
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).toPdf().get('pdf').then(pdf => {
      setDownloadUrl(URL.createObjectURL(pdf.output('blob')));
      setIsExporting(false);
    });
  };

  const toggle = (v, list, set) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans text-left text-sm">
      <aside className="w-64 bg-[#0033a0] text-white p-6 flex flex-col gap-8 print:hidden shrink-0 relative z-20 shadow-2xl text-left">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-lg"><ShieldCheck className="text-[#0033a0]" size={20} /></div>
          <div><span className="font-black tracking-tighter uppercase text-sm block leading-none">EM Executive</span><span className="text-[7px] text-blue-200 font-bold tracking-[0.2em] uppercase">v51.1 Stable</span></div>
        </div>
        <nav className="flex flex-col gap-1.5">
          <SidebarLink active={tab==='import'} onClick={()=>setTab('import')} icon={<Database size={16}/>} label="Source de données" />
          <SidebarLink active={tab==='analyse'} onClick={()=>setTab('analyse')} icon={<LayoutDashboard size={16}/>} label="Audit Stratégique" disabled={Object.keys(analysisResults).length === 0}/>
          <SidebarLink active={tab==='config'} onClick={()=>setTab('config')} icon={<Settings size={16}/>} label="Directives Coaching" />
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10 text-left text-left">
          <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-4 flex items-center gap-2"><Scale size={12}/> Seuils Cibles</h3>
          <div className="space-y-1.5 text-left">
            <RuleItem label="Porte / Pres" target="≤ 3" /><RuleItem label="Pres / Prosp" target="≤ 2" /><RuleItem label="Prosp / Close" target="≤ 2" /><RuleItem label="Close / BC" target="≤ 2" /><RuleItem label="Volume BC / J" target="≥ 12" /><RuleItem label="Taux Présence" target="100%" />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F4F7FF] print:bg-white text-left text-left text-left text-left text-left">
        <header className="h-16 bg-white border-b border-blue-100 px-8 flex items-center justify-between shrink-0 print:hidden z-10 text-left">
          <div className="flex items-center gap-4 text-left">
            <h2 className="font-black uppercase tracking-tight italic text-sm text-[#0033a0]">Dashboard du {today}</h2>
            <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase italic tracking-widest leading-none">v51.1 - Fix</span>
          </div>
          <div className="flex gap-2">
            {pastedData && <button onClick={() => {setPastedData(''); setAnalysisResults({});}} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={18}/></button>}
            <button onClick={()=>setShowPdf(true)} disabled={Object.keys(analysisResults).length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-[#0033a0] text-white rounded-xl font-bold uppercase text-[10px] shadow-xl hover:bg-blue-800 transition-all uppercase text-left"><Eye size={14}/> Aperçu & Impression</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 print:p-0 text-left">
          {tab === 'import' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 text-left">
              <div className={cardClass}>
                <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-blue-50 text-[#0033a0] rounded-2xl text-left"><ClipboardPaste size={24}/></div><h3 className="text-xl font-black uppercase tracking-tighter text-slate-900">Import des données</h3></div>
                <textarea className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:border-[#0033a0] font-mono text-[11px] mb-8" value={pastedData} onChange={(e)=>setPastedData(e.target.value)} placeholder="Collez votre tableau Google Sheet ici..."/>
                {rawDataEntries.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 animate-in slide-in-from-top-4 text-left">
                    <MultiSelectDropdown label="Filtrer par Mois" options={availableFilters.months} selected={selectedMonths} onToggle={(v)=>toggle(v, selectedMonths, setSelectedMonths)} icon={Filter}/>
                    <MultiSelectDropdown label="Filtrer par Semaine" options={availableFilters.weeks} selected={selectedWeeks} onToggle={(v)=>toggle(v, selectedWeeks, setSelectedWeeks)} icon={Calendar}/>
                  </div>
                )}
                <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100 text-left text-left">
                  <div className="flex gap-10">
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Agents détectés</span><span className="text-2xl font-black text-slate-900 leading-none">{dataSummary.count} <User className="inline text-[#0033a0]" size={18}/></span></div>
                    <div className="h-10 w-px bg-slate-100 text-left"></div>
                    <div className="flex flex-col"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 text-left text-left">Statut</span><span className="text-sm font-black text-[#0033a0] leading-none uppercase italic">Prêt</span></div>
                  </div>
                  <button onClick={handleAnalyse} disabled={loading || dataSummary.count === 0} className="px-12 py-5 bg-[#0033a0] text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all uppercase">Générer l'Audit</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'analyse' && (
            <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700 text-left text-left text-left text-left">
              {/* BILAN AGENCE */}
              <div className="bg-[#0033a0] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden text-left">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-left"><Building2 size={28}/></div>
                  <div><h3 className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white text-left">Bilan Agence Global</h3><p className="text-[9px] font-bold text-blue-200 uppercase tracking-[0.2em] mt-2 text-left">Données consolidées ({dataSummary.range})</p></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
                  <StatBox label="Moy. Porte/Pres" value={dataSummary.agencyAvg.rPortePres} threshold={3} isAverage={true} />
                  <StatBox label="Moy. Pres/Prosp" value={dataSummary.agencyAvg.rPresProsp} threshold={2} isAverage={true} />
                  <StatBox label="Moy. Prosp/Cl" value={dataSummary.agencyAvg.rProspClose} threshold={2} isAverage={true} />
                  <StatBox label="Moy. Close/BC" value={dataSummary.agencyAvg.rClosingBC} threshold={2} isAverage={true} />
                  <StatBox label="Moy. BC / J" value={dataSummary.agencyAvg.valBC} threshold={12} isMax={false} isAverage={true} />
                  <StatBox label="Moy. Présence" value={dataSummary.agencyAvg.attendance} threshold={100} isMax={false} suffix="%" isAverage={true} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left">
                    <div className="flex items-center gap-2 mb-4 text-blue-100 font-black text-[10px] uppercase tracking-widest text-left"><Activity size={14}/> Diagnostic Stratégique Collectif</div>
                    <div className="space-y-4">
                      {agencyAudit.map((item, i) => (
                        <div key={`agency-item-${i}`} className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${item.met ? 'bg-white/10 border-white/20' : 'bg-rose-500/20 border-rose-500/30'}`}>
                           <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.met ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                           <div className="text-left"><span className="text-[8px] font-black uppercase opacity-60 block text-left">{item.label}</span><p className="text-xs font-bold leading-snug text-left">{item.summary}</p><p className="text-[10px] opacity-70 mt-1 italic text-left">{item.numericalDetail}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6">
                     <div className="flex items-center gap-2 mb-4 text-emerald-200 font-black text-[10px] uppercase tracking-widest text-left"><ThumbsUp size={14}/> Directives Agence</div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10 min-h-[200px]">
                        {agencyComment ? (
                           <p className="text-sm font-bold text-white italic leading-relaxed whitespace-pre-wrap text-left">{agencyComment}</p>
                        ) : (
                           <p className="text-blue-200/50 text-xs italic text-left">Rédigez vos directives globales dans l'onglet réglages.</p>
                        )}
                     </div>
                  </div>
                </div>
              </div>

              {/* COLLABORATEURS */}
              {dataSummary.collabs.map((c) => (
                <div key={`collab-card-${c.name}`} className={cardClass}>
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-blue-50 text-left">
                    <div className="w-14 h-14 rounded-2xl bg-[#0033a0] text-white flex items-center justify-center font-black text-2xl shadow-xl">{c.name[0]}</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#0033a0] text-left">{c.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
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
                      <div className="space-y-4">
                        {(analysisResults[c.name] || []).map((item, i) => (
                          <div key={`diag-collab-${c.name}-${i}`} className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${item.met ? 'bg-white border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <div><span className="text-[8px] font-black uppercase opacity-40 block text-left">{item.label}</span><p className="text-xs font-black leading-snug text-left">{item.summary}</p><p className="text-[10px] font-bold text-slate-500 mt-1 italic text-left leading-relaxed">{item.numericalDetail}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-6 bg-emerald-50/40 border border-emerald-100 rounded-3xl shadow-inner text-left">
                      <div className="flex items-center gap-2 mb-3 text-emerald-700 font-black text-[10px] uppercase tracking-widest text-left"><ThumbsUp size={14}/> Directives Manager</div>
                      <textarea className="w-full h-full min-h-[300px] bg-transparent border-none outline-none text-emerald-950 font-bold placeholder:text-emerald-300 resize-none italic text-base text-left" value={managerComments[c.name] || ''} onChange={(e) => setManagerComments({...managerComments, [c.name]: e.target.value})} placeholder="Saisissez ici vos conseils personnalisés..."/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'config' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
              <div className={cardClass}>
                 <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-indigo-50 text-[#0033a0] rounded-2xl text-left"><Building2 size={24}/></div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-[#0033a0]">Commentaires Agence</h3>
                 </div>
                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">Message global (Page 1 du rapport)</label>
                    <textarea 
                      className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:border-[#0033a0] outline-none text-base font-bold text-slate-700 leading-relaxed italic shadow-inner" 
                      placeholder="Saisissez ici les objectifs globaux..." 
                      value={agencyComment}
                      onChange={(e) => setAgencyComment(e.target.value)}
                    />
                 </div>
              </div>
              <div className="p-6 bg-slate-50/50 rounded-3xl border border-blue-50 text-center text-slate-400 font-black uppercase text-[10px] text-left text-left">
                 Les directives et la période seront affichées sur CHAQUE page du dossier final.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL APERÇU PDF */}
      {showPdf && (
        <div className="fixed inset-0 z-[100] bg-blue-900/95 backdrop-blur-xl flex flex-col p-4 animate-in fade-in duration-300 overflow-hidden text-left print:hidden">
          <div className="flex justify-between text-white mb-4 px-4 max-w-7xl mx-auto w-full text-left text-left">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 bg-white rounded-lg text-[#0033a0] shadow-lg"><Printer size={20}/></div>
              <span className="font-black uppercase tracking-widest italic text-xs text-left">Dossier de Performance v51.1</span>
            </div>
            <div className="flex items-center gap-4 text-left">
               <button onClick={handlePrint} className="px-6 py-3 bg-white text-[#0033a0] font-black rounded-xl flex items-center gap-2 shadow-2xl text-[10px] uppercase hover:bg-blue-50 transition-all">Impression Onglet</button>
               <div className="flex flex-col gap-1 text-left text-left">
                  <button onClick={exportToPDF} disabled={isExporting} className="px-6 py-3 bg-emerald-500 text-white font-black rounded-xl flex items-center gap-2 shadow-2xl text-[10px] uppercase hover:bg-emerald-600 transition-all disabled:opacity-50 text-left">{isExporting ? <Loader2 className="animate-spin" size={16}/> : <FileDown size={16}/>} Préparer PDF</button>
                  {downloadUrl && <a href={downloadUrl} target="_blank" rel="noreferrer" className="text-[9px] text-emerald-300 font-bold underline flex items-center gap-1 text-left"><ExternalLink size={10}/> Télécharger le PDF</a>}
               </div>
               <button onClick={()=>setShowPdf(false)} className="p-2 bg-white/10 rounded-full hover:bg-rose-50 text-white transition-all text-left"><X size={24}/></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-200/20 p-4 flex flex-col items-center">
            <div className="bg-white shadow-2xl w-[210mm] p-0 text-left text-left" id="print-area">
                
                {/* PAGE 1 : BILAN AGENCE */}
                <div className="print-page text-left text-left">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-blue-50 text-left">
                       <div className="flex items-center gap-5">
                          <ShieldCheck size={48} className="text-[#0033a0]"/>
                          <div className="text-left text-left">
                            <h1 className="text-3xl font-black uppercase text-[#0033a0] tracking-tighter italic leading-none">Bilan Stratégique Agence</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 leading-none text-left">Rapport d'analyse du {today}</p>
                            <p className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mt-0.5 italic text-left">{dataSummary.range}</p>
                          </div>
                       </div>
                    </div>
                    <div className="mb-8 text-left text-left text-left">
                      <div className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mb-4 flex items-center gap-2 text-left"><Users size={14}/> Moyennes de l'Équipe</div>
                      <div className="grid grid-cols-6 gap-2">
                          <StatBox label="Porte/Pres" value={dataSummary.agencyAvg.rPortePres} threshold={3} isAverage={true} />
                          <StatBox label="Pres/Prosp" value={dataSummary.agencyAvg.rPresProsp} threshold={2} isAverage={true} />
                          <StatBox label="Prosp/Cl" value={dataSummary.agencyAvg.rProspClose} threshold={2} isAverage={true} />
                          <StatBox label="Close/BC" value={dataSummary.agencyAvg.rClosingBC} threshold={2} isAverage={true} />
                          <StatBox label="BC/J" value={dataSummary.agencyAvg.valBC} threshold={12} isMax={false} isAverage={true} />
                          <StatBox label="Présence" value={dataSummary.agencyAvg.attendance} threshold={100} isMax={false} suffix="%" isAverage={true} />
                      </div>
                    </div>
                    <div className="space-y-6 flex-1 text-left text-left">
                      <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2rem] text-left">
                        <div className="text-[9px] font-black text-[#0033a0] uppercase mb-4 text-left">Diagnostic Stratégique Collectif</div>
                        <div className="space-y-4">
                          {agencyAudit.map((item, i) => (
                            <div key={`pdf-ag-${i}`} className="flex items-start gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                              <div className="text-left text-left">
                                <span className="text-[9px] font-black uppercase opacity-40 block leading-none text-left">{item.label}</span>
                                <p className="text-xs font-black text-slate-800 leading-tight text-left">{item.summary}</p>
                                <p className="text-[9px] font-bold text-slate-500 mt-0.5 italic text-left">{item.numericalDetail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2rem] text-left text-left">
                        <div className="text-[9px] font-black text-emerald-600 uppercase mb-4 text-left">Directives Stratégiques Agence</div>
                        <p className="text-sm font-bold text-emerald-950 italic leading-relaxed whitespace-pre-wrap text-left">
                          {agencyComment || "Poursuivez les efforts sur la prospection et maintenez la rigueur sur le terrain."}
                        </p>
                      </div>
                    </div>
                </div>

                {/* PAGES COLLABORATEURS */}
                {dataSummary.collabs.map((c) => {
                  const detailedAudit = analysisResults[c.name] || [];
                  return (
                    <div key={`pdf-collab-${c.name}`} className="print-page text-left text-left text-left text-left text-left">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 text-left">
                         <div className="flex items-center gap-4 text-left">
                            <div className="w-10 h-10 rounded-xl bg-[#0033a0] text-white flex items-center justify-center font-black text-lg text-left">{c.name[0]}</div>
                            <div className="text-left">
                               <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none text-left">{c.name}</h3>
                               <p className="text-[8px] font-bold text-[#0033a0] uppercase tracking-widest mt-1 text-left">Dossier de Performance Individuel</p>
                            </div>
                         </div>
                         <div className="text-right text-left text-left text-left">
                            <p className="text-[9px] font-black text-slate-400 uppercase text-left leading-none">Analyse du {today}</p>
                            <p className="text-[8px] font-bold text-slate-300 uppercase mt-1 text-left italic">{dataSummary.range}</p>
                         </div>
                      </div>
                      <div className="grid grid-cols-6 gap-2 mb-8 text-left text-left">
                          <StatBox label="Porte/Pres" value={c.averages.rPortePres} threshold={3} isMax={true} isAverage={true} />
                          <StatBox label="Pres/Prosp" value={c.averages.rPresProsp} threshold={2} isMax={true} isAverage={true} />
                          <StatBox label="Prosp/Cl" value={c.averages.rProspClose} threshold={2} isMax={true} isAverage={true} />
                          <StatBox label="Close/BC" value={c.averages.rClosingBC} threshold={2} isMax={true} isAverage={true} />
                          <StatBox label="BC/J" value={c.averages.valBC} threshold={12} isMax={false} isAverage={true} />
                          <StatBox label="Présence" value={c.averages.attendance} threshold={100} isMax={false} isAverage={false} suffix="%" />
                      </div>
                      <div className="space-y-6 flex-1 text-left text-left text-left text-left">
                        <div className="p-6 bg-slate-50/50 rounded-[1.5rem] border border-blue-50 text-left text-left text-left text-left text-left">
                          <div className="text-[8px] font-black text-[#0033a0] uppercase mb-4 tracking-widest text-left text-left text-left text-left">Diagnostic Individuel Expert</div>
                          <div className="space-y-4 text-left">
                             {detailedAudit.map((item, i) => (
                               <div key={`pdf-diag-item-${c.name}-${i}`} className="flex items-start gap-4 text-left text-left">
                                 <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${item.met ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                 <div className="flex flex-col text-left text-left text-left">
                                   <span className="text-[8px] font-black uppercase opacity-40 leading-none text-left text-left">{item.label}</span>
                                   <p className="text-[10px] font-black text-slate-800 leading-tight mt-0.5 text-left">{item.summary}</p>
                                   <p className="text-[8px] font-bold text-slate-500 mt-1 italic leading-relaxed text-left">{item.numericalDetail}</p>
                                 </div>
                               </div>
                             ))}
                          </div>
                        </div>
                        <div className="p-6 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 text-left text-left">
                          <div className="text-[8px] font-black text-emerald-600 uppercase mb-3 tracking-widest text-left">Commentaires Manager</div>
                          <p className="text-xs font-bold text-emerald-950 italic leading-relaxed whitespace-pre-wrap text-left">
                            {managerComments[c.name] || "Maintenez la rigueur sur l'ensemble de vos indicateurs pour garantir la stabilité de vos résultats."}
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
        .print-page { width: 210mm; height: 296mm; padding: 15mm; display: flex; flex-direction: column; box-sizing: border-box; page-break-after: always !important; text-align: left; }
        .print-page:last-child { page-break-after: auto !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; text-align: left; }
          aside, header, button, .print-hidden { display: none !important; }
        }
      `}} />
    </div>
  );
}
