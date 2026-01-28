import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  ClipboardPaste, Loader2, User, ListTodo, ShieldCheck, 
  LayoutDashboard, X, Eye, FileDown, ThumbsUp, Activity, Database, 
  Scale, Calendar, Printer, Users, Check, ChevronDown, Trash2, 
  Building2, UserCog, DoorOpen, UserSearch, Handshake, FileCheck, Zap, CalendarCheck, ExternalLink, Filter
} from 'lucide-react';

// --- CONSTANTES DE STYLE ---
const cardClass = "bg-white rounded-3xl p-6 shadow-sm border border-blue-50 transition-all hover:shadow-lg text-left";

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

const RuleItem = ({ label, target, icon: Icon }) => (
  <div className="flex items-center justify-between text-[9px] bg-white/10 p-2.5 rounded-lg border border-white/5 backdrop-blur-sm text-left">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={12} className="text-blue-300" />}
      <span className="font-bold text-blue-50 uppercase tracking-tighter">{label}</span>
    </div>
    <span className={`font-black ${target.includes('≥') || target.includes('100') ? 'text-emerald-300' : 'text-blue-200'}`}>{target}</span>
  </div>
);

const StatBox = ({ label, value, threshold, isMax = true, isAverage = false, suffix = "", icon: Icon }) => {
  const numValue = parseFloat(value);
  const isTargetMet = isMax ? numValue <= threshold : numValue >= threshold;
  const textColor = isTargetMet ? '#047857' : '#be123c'; 

  return (
    <div 
      className="p-3 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden shadow-sm text-left"
      style={{ 
        backgroundColor: isTargetMet ? '#ecfdf5' : '#fff1f2', 
        borderColor: isTargetMet ? '#d1fae5' : '#ffe4e6',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact'
      }}
    >
      <div className="absolute top-1 right-1 opacity-20">
        {Icon && <Icon size={18} style={{ color: textColor }} />}
      </div>
      <span className="text-[6px] font-black text-slate-400 uppercase mb-0.5 tracking-widest text-center leading-tight h-4 overflow-hidden z-10">{label}</span>
      <span className="text-base font-black z-10" style={{ color: textColor }}>{value}{suffix}</span>
      <span className="text-[5px] font-bold text-slate-300 uppercase tracking-tighter z-10">{isAverage ? "MOYENNE" : "ACTUEL"}</span>
    </div>
  );
};

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
    <div className="relative w-full text-left" ref={dropdownRef}>
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
        {Icon && <Icon size={14} />} {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-[#0033a0] transition-all text-left"
      >
        <span className="text-xs font-bold text-slate-700 truncate mr-2">
          {selected.length === 0 ? "Période complète" : `${selected.length} sélectionné(s)`}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((opt) => (
            <button
              key={opt}
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

const CoachingTextarea = ({ value, onChange, placeholder, label, maxLength = 500 }) => (
  <div className="space-y-2 w-full text-left">
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>}
    <div className="relative">
      <textarea 
        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl focus:border-[#0033a0] outline-none text-base font-bold text-slate-700 leading-relaxed italic shadow-inner resize-none text-left" 
        rows={4}
        maxLength={maxLength}
        placeholder={placeholder} 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="absolute bottom-4 right-6 text-[9px] font-black uppercase text-slate-300 tracking-tighter">
        {(value || '').length} / {maxLength}
      </div>
    </div>
  </div>
);

// --- MOTEUR D'AUDIT LOCAL DEVELOPPÉ (ARGUMENTAIRES 450-500 CHARS) ---
const runDetailedAudit = (averages) => {
  if (!averages) return [];

  const check = (val, threshold, label, successMsg, failMsg, passArg, failArg, icon, isMax = true, suffix = "") => {
    const num = parseFloat(val);
    const met = isMax ? num <= threshold : num >= threshold;
    const valueDisplay = `${num}${suffix}`;
    const targetDisplay = isMax ? `≤ ${threshold}${suffix}` : `≥ ${threshold}${suffix}`;
    
    return {
      label,
      met,
      icon,
      summary: met ? successMsg : failMsg,
      numericalDetail: `Diagnostic : ${met ? passArg : failArg} (Observé : ${valueDisplay} pour un objectif à ${targetDisplay}).`
    };
  };

  return [
    check(averages.rPortePres, 3, "Portes / Présents", "L'accroche est excellente.", "Taux de présence insuffisant.", "Votre maîtrise du ratio Portes/Présents démontre une excellente lecture de vos secteurs. Vous savez manifestement identifier les moments et les lieux où les prospects sont présents et disposés à vous écouter. Cette efficacité dans l'approche vous permet de maximiser votre temps de présentation sans gaspiller d'énergie sur des portes closes ou des refus catégoriques. C'est un atout majeur qui fluidifie tout le reste de votre entonnoir de vente actuel.", "Un ratio Portes/Présents trop élevé indique souvent que vous ne trouvez pas assez de personnes ou que vous n'arrivez pas à transformer l'ouverture de porte en temps d'écoute. Pour corriger cela, optimisez vos tournées en ciblant les horaires stratégiques (fin de journée ou mercredi). Travaillez aussi votre accroche de 'pas de porte' : l'objectif est de rassurer immédiatement pour que le client accepte votre présence. Soyez plus observateur sur les signes.", DoorOpen, true),
    check(averages.rPresProsp, 2, "Présents / Prospects", "Découverte client maîtrisée.", "Phase de découverte courte.", "Votre capacité à transformer un présent en prospect montre que vous savez identifier avec précision les besoins réels du foyer durant votre présentation. En posant les bonnes questions ouvertes, vous amenez le client à verbaliser ses attentes, ce qui facilite grandement la suite du processus. Vous ne faites pas qu'exposer des produits, vous apportez des solutions concrètes, ce qui crée une valeur perçue élevée. Continuez à soigner cette étape de qualification.", "Vous présentez nos services mais vous ne parvenez pas assez à convaincre de leur utilité. Il est crucial de passer plus de temps sur la phase de découverte pour isoler les habitudes de consommation du foyer. Actuellement, votre discours semble trop générique et ne crée pas assez d'impact émotionnel ou pratique chez le client. Travaillez sur l'écoute active : laissez le client s'exprimer davantage pour pouvoir rebondir sur ses points de douleur spécifiques terrain.", UserSearch, true),
    check(averages.rProspClose, 2, "Prospects / Closing", "Transformation fluide.", "Engagement client fragile.", "Votre sélection qualitative des prospects en amont garantit une transition naturelle vers la vente. Vous savez trier les profils dès le départ, ce qui vous évite de perdre du temps sur des négociations stériles. Votre force réside dans la validation progressive des étapes de vente : quand vous arrivez au closing, le client est déjà convaincu psychologiquement. Cette fluidité réduit votre fatigue mentale et renforce votre image de professionnel du conseil expert.", "L'engagement client s'affaiblit systématiquement en fin de parcours, ce qui indique un manque de verrouillage lors des étapes précédentes. Vous arrivez souvent au closing face à des objections qui auraient dû être levées bien plus tôt. Il est nécessaire de travailler la reformulation et la validation par 'petits oui' tout au long de votre présentation. Si le client hésite au moment final, c'est que la valeur ajoutée perçue n'est pas encore assez forte ici.", FileCheck, true),
    check(averages.rClosingBC, 2, "Closing / BC", "Clôture administrative parfaite.", "Vérifiez votre processus BC.", "Votre taux de transformation entre le closing moral et la saisie du bon de commande est exemplaire. Cela prouve que vous sécurisez parfaitement l'engagement du client et que vous maîtrisez l'aspect administratif sans créer de friction. Le client se sent accompagné jusqu'au bout, ce qui limite les rétractations précoces et les doutes post-achat. Cette rigueur dans la conclusion est le signe d'une grande confiance en soi et en la qualité de l'offre.", "Trop de ventes validées oralement s'évaporent avant la signature définitive du bon de commande. Ce décalage suggère une baisse de tension ou un manque de professionnalisme au moment de sortir le document officiel. Le client ressent peut-être votre propre hésitation, ce qui réactive ses peurs. Assurez-vous d'avoir levé tous les derniers doutes et restez ferme dans votre posture de conseil jusqu'à la validation technique. La vente n'est pas encore terminée.", Handshake, true),
    check(averages.valBC, 12, "BC / Jour", "Volume de production solide.", "Productivité à renforcer.", "Votre productivité quotidienne est en parfaite adéquation avec les standards de rentabilité de l'agence. Ce volume régulier assure non seulement vos revenus, mais il témoigne aussi d'une gestion exemplaire de votre secteur et de votre énergie sur le terrain. En maintenant cette cadence, vous vous donnez les moyens d'amortir les jours plus difficiles et de surperformer lors des périodes de forte activité. Votre assiduité au travail est votre moteur de succès.", "Votre volume moyen de commandes ne permet pas d'exploiter tout le potentiel de votre secteur géographique. Pour stabiliser vos résultats, vous devez impérativement augmenter votre nombre de passages ou optimiser radicalement vos ratios de transformation. Une productivité en retrait est souvent le signe d'une baisse d'intensité sur le terrain ou d'une mauvaise organisation de votre tournée. Fixez-vous des objectifs horaires stricts pour gagner en volume.", Zap, false),
    check(averages.attendance, 100, "Présence", "Assiduité totale.", "Irrégularité pénalisante.", "Votre engagement total sur le terrain est le fondement de votre réussite. Votre présence constante assure une couverture secteur optimale et renforce la crédibilité de l'agence auprès de vos clients qui apprécient la régularité du service. Cette fiabilité est indispensable pour construire un portefeuille client solide et fidèle sur le long terme. C'est votre sérieux qui fait la différence avec la concurrence et qui sécurise votre carrière au sein du groupe.", "Vos absences répétées ou irrégulières brisent la dynamique commerciale indispensable à la tenue de votre secteur. Chaque jour manqué est une opportunité perdue et un signal négatif envoyé à votre clientèle qui attend de la régularité. En vente directe, le manque de présence est le premier facteur de chute des résultats, car il empêche la création d'un cercle vertueux de prospection et de recommandation. La discipline de présence est le levier le plus puissant.", CalendarCheck, false, "%")
  ];
};

// --- COMPOSANT DE RENDU DU RAPPORT ---
const ReportLayout = ({ today, dataSummary, agencyAudit, analysisResults, agencyComment, managerComments }) => {
  return (
    <div id="print-target" className="bg-white text-left p-0 m-0">
      {/* PAGE AGENCE */}
      <div className="print-page text-left">
        <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-blue-50">
          <div className="flex items-center gap-5">
            <ShieldCheck size={48} className="text-[#0033a0]"/>
            <div className="text-left">
              <h1 className="text-3xl font-black uppercase text-[#0033a0] tracking-tighter italic leading-none">Bilan Stratégique Agence</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Rapport du {today}</p>
              <p className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mt-0.5 italic">{dataSummary.range}</p>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <div className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mb-4 flex items-center gap-2 text-left"><Users size={14}/> Moyennes Équipe</div>
          <div className="grid grid-cols-6 gap-2">
            <StatBox label="Porte/Pres" value={dataSummary.agencyAvg.rPortePres} threshold={3} isAverage={true} icon={DoorOpen} />
            <StatBox label="Pres/Prosp" value={dataSummary.agencyAvg.rPresProsp} threshold={2} isAverage={true} icon={UserSearch} />
            <StatBox label="Prosp/Cl" value={dataSummary.agencyAvg.rProspClose} threshold={2} isAverage={true} icon={FileCheck} />
            <StatBox label="Close/BC" value={dataSummary.agencyAvg.rClosingBC} threshold={2} isAverage={true} icon={Handshake} />
            <StatBox label="BC/J" value={dataSummary.agencyAvg.valBC} threshold={12} isMax={false} isAverage={true} icon={Zap} />
            <StatBox label="Présence" value={dataSummary.agencyAvg.attendance} threshold={100} isMax={false} suffix="%" isAverage={true} icon={CalendarCheck} />
          </div>
        </div>
        <div className="space-y-6 flex-1 text-left">
          <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2rem]">
            <div className="text-[9px] font-black text-[#0033a0] uppercase mb-4">Diagnostic Stratégique Collectif</div>
            <div className="space-y-4">
              {agencyAudit.map((item, i) => {
                const IconComponent = item.icon;
                return (
                  <div key={`p-ag-${i}`} className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-lg shrink-0 ${item.met ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {IconComponent && <IconComponent size={24} />}
                    </div>
                    <div className="text-left text-left">
                      <span className="text-[9px] font-black uppercase opacity-40 block leading-none">{item.label}</span>
                      <p className="text-xs font-black text-slate-800 leading-tight">{item.summary}</p>
                      <p className="text-[9px] font-bold text-slate-500 mt-0.5 italic">{item.numericalDetail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2rem]">
            <div className="text-[9px] font-black text-emerald-600 uppercase mb-4 text-left">Directives Stratégiques Agence</div>
            <p className="text-sm font-bold text-emerald-950 italic leading-relaxed whitespace-pre-wrap text-left">{agencyComment || "Poursuivez les efforts."}</p>
          </div>
        </div>
      </div>

      {/* PAGES COLLABORATEURS */}
      {dataSummary.collabs.map((c) => {
        const audit = analysisResults[c.name] || [];
        return (
          <div key={`p-collab-${c.name}`} className="print-page text-left">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-[#0033a0] text-white flex items-center justify-center font-black text-lg">{c.name[0]}</div>
                <div className="text-left">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">{c.name}</h3>
                  <p className="text-[8px] font-bold text-[#0033a0] uppercase tracking-widest mt-1">Dossier Individuel de Performance</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Analyse du {today}</p>
                <p className="text-[8px] font-bold text-slate-300 uppercase mt-1 italic text-right">{dataSummary.range}</p>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-8 text-left">
              <StatBox label="Porte/Pres" value={c.averages.rPortePres} threshold={3} isMax={true} isAverage={true} icon={DoorOpen} />
              <StatBox label="Pres/Prosp" value={c.averages.rPresProsp} threshold={2} isMax={true} isAverage={true} icon={UserSearch} />
              <StatBox label="Prosp/Cl" value={c.averages.rProspClose} threshold={2} isMax={true} isAverage={true} icon={FileCheck} />
              <StatBox label="Close/BC" value={c.averages.rClosingBC} threshold={2} isMax={true} isAverage={true} icon={Handshake} />
              <StatBox label="BC/J" value={c.averages.valBC} threshold={12} isMax={false} isAverage={true} icon={Zap} />
              <StatBox label="Présence" value={c.averages.attendance} threshold={100} isMax={false} isAverage={false} suffix="%" icon={CalendarCheck} />
            </div>
            <div className="space-y-6 flex-1 text-left">
              <div className="p-6 bg-slate-50/50 rounded-[1.5rem] border border-blue-50">
                <div className="text-[8px] font-black text-[#0033a0] uppercase mb-4 tracking-widest text-left">Diagnostic Individuel Expert</div>
                <div className="space-y-4 text-left">
                  {audit.map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={`p-diag-${c.name}-${i}`} className="flex items-start gap-5 text-left">
                        <div className={`mt-1.5 p-2 rounded-lg shrink-0 ${item.met ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {IconComponent && <IconComponent size={24} />}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-black uppercase opacity-40 leading-none text-left">{item.label}</span>
                          <p className="text-[10px] font-black text-slate-800 leading-tight mt-0.5 text-left">{item.summary}</p>
                          <p className="text-[8px] font-bold text-slate-500 mt-1 italic leading-relaxed text-left">{item.numericalDetail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 text-left">
                <div className="text-[8px] font-black text-emerald-600 uppercase mb-3 tracking-widest text-left">Commentaires Manager</div>
                <p className="text-xs font-bold text-emerald-950 italic leading-relaxed whitespace-pre-wrap text-left">{managerComments[c.name] || "Maintenez la rigueur."}</p>
              </div>
            </div>
          </div>
        );
      })}
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

  const dataSummary = useMemo(() => {
    if (!pastedData || pastedData.trim().length < 10) return { count: 0, collabs: [], agencyAvg: {}, range: "..." };
    const lines = pastedData.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(/[|\t]/).map(h => h.trim().toLowerCase());
    
    // DÉTECTION PRÉCISE COLONNE "Nom du collaborateur"
    const nameIdx = headers.findIndex(h => h.includes("nom du collaborateur") || h === "nom");
    const weekIdx = headers.findIndex(h => h.includes("semaine"));
    const monthIdx = headers.findIndex(h => h.includes("mois"));
    const poIdx = headers.findIndex(h => h.includes("portes"));
    const prIdx = headers.findIndex(h => h.includes("présent"));
    const psIdx = headers.findIndex(h => h.includes("prospect"));
    const clIdx = headers.findIndex(h => h.includes("closings"));
    const bcIdx = headers.findIndex(h => h.includes("bc"));
    const attIdx = headers.findIndex(h => h.includes("présence"));

    if (nameIdx === -1) return { count: 0, collabs: [], agencyAvg: {}, range: "Erreur de colonne" };

    const entries = lines.slice(1).map(line => {
      const p = line.split(/[|\t]/).map(v => v.trim());
      if (!p[nameIdx] || p[nameIdx].toLowerCase().includes("nom")) return null;
      return {
        name: p[nameIdx], week: p[weekIdx] || "0", month: monthIdx !== -1 ? p[monthIdx] : "Inconnu",
        po: parseInt(p[poIdx]) || 0, pr: parseInt(p[prIdx]) || 0,
        ps: parseInt(p[psIdx]) || 0, cl: parseInt(p[clIdx]) || 0,
        bc: parseInt(p[bcIdx]) || 0,
        isPresent: (attIdx !== -1 && p[attIdx]) ? (p[attIdx].toUpperCase().startsWith('P')) : true
      };
    }).filter(e => e !== null);

    const filtered = entries.filter(e => {
      const mMatch = selectedMonths.length === 0 || selectedMonths.includes(e.month);
      const wMatch = selectedWeeks.length === 0 || selectedWeeks.includes(`S${e.week}`);
      return mMatch && wMatch;
    });

    const map = {}; let agS = { po: 0, pr: 0, ps: 0, cl: 0, bc: 0, attD: 0, totD: 0 };
    filtered.forEach(e => {
      const k = e.name.toLowerCase().replace(/\s/g, '');
      if (!map[k]) map[k] = { name: e.name, entries: [] };
      if (e.isPresent) { agS.po += e.po; agS.pr += e.pr; agS.ps += e.ps; agS.cl += e.cl; agS.bc += e.bc; agS.attD += 1; }
      agS.totD += 1;
      map[k].entries.push(e);
    });

    const collabs = Object.values(map).map(c => {
      const worked = c.entries.filter(w => w.isPresent);
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
          attendance: Math.round((worked.length / c.entries.length) * 100) 
        } 
      };
    });

    const agencyAvg = { rPortePres: agS.pr > 0 ? (agS.po / agS.pr).toFixed(2) : 0, rPresProsp: agS.ps > 0 ? (agS.pr / agS.ps).toFixed(2) : 0, rProspClose: agS.cl > 0 ? (agS.ps / agS.cl).toFixed(2) : 0, rClosingBC: agS.bc > 0 ? (agS.cl / agS.bc).toFixed(2) : 0, valBC: agS.attD > 0 ? (agS.bc / agS.attD).toFixed(1) : 0, attendance: agS.totD > 0 ? Math.round((agS.attD / agS.totD) * 100) : 0 };
    return { count: collabs.length, collabs, agencyAvg, range: `${selectedMonths.length > 0 ? selectedMonths.join(', ') : 'Période complète'} | ${selectedWeeks.length > 0 ? selectedWeeks.join(', ') : 'Toutes semaines'}` };
  }, [pastedData, selectedMonths, selectedWeeks]);

  const availableFilters = useMemo(() => {
    if (!pastedData) return { months: [], weeks: [] };
    const lines = pastedData.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(/[|\t]/).map(h => h.trim().toLowerCase());
    const mIdx = headers.findIndex(h => h.includes("mois"));
    const wIdx = headers.findIndex(h => h.includes("semaine"));
    const mSet = new Set(); const wSet = new Set();
    lines.slice(1).forEach(line => {
      const p = line.split(/[|\t]/).map(v => v.trim());
      if (mIdx !== -1 && p[mIdx]) mSet.add(p[mIdx]);
      if (wIdx !== -1 && p[wIdx]) wSet.add(`S${p[wIdx]}`);
    });
    return { months: [...mSet].sort(), weeks: [...wSet].sort() };
  }, [pastedData]);

  const handleAnalyse = () => {
    setLoading(true);
    const agRes = runDetailedAudit(dataSummary.agencyAvg);
    setAgencyAudit(agRes);
    const results = {};
    dataSummary.collabs.forEach(c => { results[c.name] = runDetailedAudit(c.averages); });
    setAnalysisResults(results);
    setTab('analyse');
    setLoading(false);
  };

  const handlePrintAction = () => {
    const target = document.getElementById('print-target');
    if (!target) return;
    const win = window.open('', '_blank');
    if (!win) { alert("Autorisez les pop-ups."); return; }
    win.document.write(`<html><head>${document.head.innerHTML}<style>
      body { background: white; margin: 0; padding: 0; }
      .print-page { width: 210mm; height: 296mm; padding: 15mm; display: flex; flex-direction: column; box-sizing: border-box; page-break-after: always !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; text-align: left; }
    </style></head><body>${target.innerHTML}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const exportToPDF = () => {
    if (!window.html2pdf) return;
    setIsExporting(true);
    const el = document.getElementById('print-target');
    window.html2pdf().from(el).set({
      margin: 0, filename: `Audit_Executive.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    }).save().then(() => setIsExporting(false));
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans text-left text-sm">
      <aside className="w-64 bg-[#0033a0] text-white p-6 flex flex-col gap-8 print:hidden shrink-0 relative z-20 shadow-2xl">
        <div className="flex items-center gap-3 text-left">
          <div className="p-2 bg-white rounded-xl shadow-lg"><ShieldCheck className="text-[#0033a0]" size={20} /></div>
          <div><span className="font-black tracking-tighter uppercase text-sm block leading-none text-left text-left">EM Executive</span><span className="text-[7px] text-blue-200 font-bold tracking-[0.2em] uppercase text-left">v60.0 Stable</span></div>
        </div>
        <nav className="flex flex-col gap-1.5 text-left">
          <SidebarLink active={tab==='import'} onClick={() => setTab('import')} icon={<Database size={16}/>} label="Données Source" />
          <SidebarLink active={tab==='analyse'} onClick={() => setTab('analyse')} icon={<LayoutDashboard size={16}/>} label="Audit Stratégique" disabled={dataSummary.count === 0}/>
          <SidebarLink active={tab==='config'} onClick={() => setTab('config')} icon={<ListTodo size={16}/>} label="Directives Coaching" />
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10 text-left">
          <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-4 flex items-center gap-2"><Scale size={12}/> Seuils Cibles</h3>
          <div className="space-y-1.5">
            <RuleItem label="Porte / Pres" target="≤ 3" icon={DoorOpen} /><RuleItem label="Pres / Prosp" target="≤ 2" icon={UserSearch} /><RuleItem label="Prosp / Close" target="≤ 2" icon={Handshake} /><RuleItem label="Close / BC" target="≤ 2" icon={FileCheck} /><RuleItem label="Volume BC / J" target="≥ 12" icon={Zap} /><RuleItem label="Présence" target="100%" icon={CalendarCheck} />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F4F7FF] print:bg-white text-left">
        <header className="h-16 bg-white border-b border-blue-100 px-8 flex items-center justify-between shrink-0 print:hidden z-10 text-left">
          <div className="flex items-center gap-4 text-left">
            <h2 className="font-black uppercase tracking-tight italic text-sm text-[#0033a0]">Dashboard du {today}</h2>
            <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase italic tracking-widest leading-none text-left">v60.0 Stable</span>
          </div>
          <div className="flex gap-2">
            {pastedData && <button onClick={() => {setPastedData(''); setAnalysisResults({});}} className="p-2 text-slate-400 hover:text-rose-500 transition-all"><Trash2 size={18}/></button>}
            <button onClick={handlePrintAction} disabled={dataSummary.count === 0} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold uppercase text-[10px] shadow hover:bg-slate-200 transition-all text-left"><Printer size={14}/> Imprimer</button>
            <button onClick={()=>setShowPdf(true)} disabled={dataSummary.count === 0} className="flex items-center gap-2 px-5 py-2.5 bg-[#0033a0] text-white rounded-xl font-bold uppercase text-[10px] shadow-xl hover:bg-blue-800 transition-all uppercase text-left text-left text-left"><Eye size={14}/> Aperçu & PDF</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 print:p-0">
          {tab === 'import' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 text-left">
              <div className={cardClass}>
                <div className="flex items-center gap-3 mb-6 text-left"><div className="p-3 bg-blue-50 text-[#0033a0] rounded-2xl text-left text-left"><ClipboardPaste size={24}/></div><h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 text-left text-left">Import des données</h3></div>
                <textarea className="w-full h-40 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:border-[#0033a0] font-mono text-[11px] mb-8 text-left" value={pastedData} onChange={(e)=>setPastedData(e.target.value)} placeholder="Collez votre tableau Google Sheet ici..."/>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-left text-left">
                    <MultiSelectDropdown label="Filtrer par Mois" options={availableFilters.months} selected={selectedMonths} onToggle={(v)=>setSelectedMonths(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])} icon={Filter}/>
                    <MultiSelectDropdown label="Filtrer par Semaine" options={availableFilters.weeks} selected={selectedWeeks} onToggle={(v)=>setSelectedWeeks(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])} icon={Calendar}/>
                </div>
                <div className="mt-8 flex justify-end text-left"><button onClick={handleAnalyse} disabled={loading || dataSummary.count === 0} className="px-12 py-5 bg-[#0033a0] text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all uppercase text-left">Lancer l'Audit</button></div>
              </div>
            </div>
          )}

          {tab === 'analyse' && (
            <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700 text-left text-left text-left">
              {/* BILAN AGENCE ÉCRAN */}
              <div className="bg-[#0033a0] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden text-left">
                <div className="flex items-center gap-4 mb-8 text-left text-left text-left">
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-left text-left text-left"><Building2 size={28}/></div>
                  <div className="text-left text-left text-left text-left text-left text-left text-left"><h3 className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white text-left text-left text-left">Bilan Agence Global</h3><p className="text-[9px] font-bold text-blue-200 uppercase tracking-[0.2em] mt-2 text-left">Performance consolidée ({dataSummary.range})</p></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8 text-left">
                  <StatBox label="Moy. Porte/Pres" value={dataSummary.agencyAvg.rPortePres} threshold={3} isAverage={true} icon={DoorOpen} />
                  <StatBox label="Moy. Pres/Prosp" value={dataSummary.agencyAvg.rPresProsp} threshold={2} isAverage={true} icon={UserSearch} />
                  <StatBox label="Moy. Prosp/Cl" value={dataSummary.agencyAvg.rProspClose} threshold={2} isAverage={true} icon={Handshake} />
                  <StatBox label="Moy. Close/BC" value={dataSummary.agencyAvg.rClosingBC} threshold={2} isAverage={true} icon={FileCheck} />
                  <StatBox label="Moy. BC / J" value={dataSummary.agencyAvg.valBC} threshold={12} isMax={false} isAverage={true} icon={Zap} />
                  <StatBox label="Moy. Présence" value={dataSummary.agencyAvg.attendance} threshold={100} isMax={false} suffix="%" isAverage={true} icon={CalendarCheck} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left">
                    <div className="flex items-center gap-2 mb-4 text-blue-100 font-black text-[10px] uppercase tracking-widest text-left text-left text-left text-left"><Activity size={14}/> Diagnostic Automatique</div>
                    <div className="space-y-4">
                      {agencyAudit.map((item, i) => {
                        const IconComponent = item.icon;
                        return (
                          <div key={`agency-item-${i}`} className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${item.met ? 'bg-white/10 border-white/20' : 'bg-rose-500/20 border-rose-500/30'}`}>
                             <div className={`mt-1.5 p-2 rounded-lg shrink-0 ${item.met ? 'bg-emerald-400 text-emerald-900' : 'bg-rose-400 text-rose-900'}`}>
                                {IconComponent && <IconComponent size={28} />}
                             </div>
                             <div className="text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><span className="text-[8px] font-black uppercase opacity-60 block text-left text-left text-left text-left text-left">{item.label}</span><p className="text-xs font-bold leading-snug text-left text-left text-left text-left text-left">{item.summary}</p><p className="text-[10px] opacity-70 mt-1 italic text-left text-left text-left text-left text-left text-left text-left text-left">{item.numericalDetail}</p></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-left text-left text-left">
                     <div className="flex items-center gap-2 mb-4 text-emerald-200 font-black text-[10px] uppercase tracking-widest text-left text-left text-left text-left text-left"><ThumbsUp size={14}/> Directives Agence</div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10 min-h-[200px] text-left">
                        {agencyComment ? (
                           <p className="text-sm font-bold text-white italic leading-relaxed whitespace-pre-wrap text-left text-left text-left text-left text-left">{agencyComment}</p>
                        ) : (
                           <p className="text-blue-200/50 text-xs italic text-left text-left text-left text-left">Saisissez vos directives dans l'onglet coaching.</p>
                        )}
                     </div>
                  </div>
                </div>
              </div>

              {/* COLLABORATEURS ÉCRAN */}
              {dataSummary.collabs.map((c) => (
                <div key={`card-${c.name}`} className={cardClass}>
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-blue-50 text-left text-left text-left">
                    <div className="w-14 h-14 rounded-2xl bg-[#0033a0] text-white flex items-center justify-center font-black text-2xl shadow-xl text-left text-left text-left">{c.name[0]}</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#0033a0] text-left text-left text-left text-left">{c.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8 text-left">
                    <StatBox label="Porte / Pres" value={c.averages.rPortePres} threshold={3} icon={DoorOpen} />
                    <StatBox label="Pres / Prosp" value={c.averages.rPresProsp} threshold={2} icon={UserSearch} />
                    <StatBox label="Prosp / Cl" value={c.averages.rProspClose} threshold={2} icon={Handshake} />
                    <StatBox label="Close / BC" value={c.averages.rClosingBC} threshold={2} icon={FileCheck} />
                    <StatBox label="BC / J" value={c.averages.valBC} threshold={12} isMax={false} icon={Zap} />
                    <StatBox label="Présence" value={c.averages.attendance} threshold={100} isMax={false} suffix="%" icon={CalendarCheck} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="p-6 bg-blue-50/40 border border-blue-100 rounded-3xl shadow-inner text-left text-left text-left text-left text-left">
                      <div className="flex items-center gap-2 mb-4 text-[#0033a0] font-black text-[10px] uppercase tracking-widest text-left text-left text-left"><Activity size={14}/> Diagnostic Nominatif</div>
                      <div className="space-y-4">
                        {(analysisResults[c.name] || []).map((item, i) => {
                          const IconComp = item.icon;
                          return (
                            <div key={`diag-c-${c.name}-${i}`} className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${item.met ? 'bg-white border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                              <div className={`mt-1.5 p-2 rounded-lg shrink-0 ${item.met ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                 {IconComp && <IconComp size={28} />}
                              </div>
                              <div className="text-left text-left text-left text-left text-left text-left text-left text-left"><span className="text-[8px] font-black uppercase opacity-40 block text-left text-left text-left">{item.label}</span><p className="text-xs font-black leading-snug text-left text-left text-left text-left text-left text-left">{item.summary}</p><p className="text-[10px] font-bold text-slate-500 mt-1 italic leading-relaxed text-left text-left text-left text-left text-left text-left text-left text-left">{item.numericalDetail}</p></div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="p-6 bg-emerald-50/40 border border-emerald-100 rounded-3xl shadow-inner text-left text-left">
                      <div className="flex items-center gap-2 mb-3 text-emerald-700 font-black text-[10px] uppercase tracking-widest text-left text-left text-left text-left text-left text-left text-left"><ThumbsUp size={14}/> Directives Manager</div>
                      <CoachingTextarea value={managerComments[c.name]} onChange={(val) => setManagerComments(prev => ({...prev, [c.name]: val}))} placeholder="Conseils personnalisés (500 chars max)..." maxLength={500}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'config' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 text-left text-left text-left text-left text-left">
              <div className={cardClass}>
                 <div className="flex items-center gap-4 mb-8 text-left text-left text-left text-left">
                    <div className="p-3 bg-indigo-50 text-[#0033a0] rounded-2xl text-left text-left text-left text-left text-left text-left"><Building2 size={24}/></div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-[#0033a0] text-left text-left text-left text-left text-left text-left text-left">Directives Agence Globales</h3>
                 </div>
                 <CoachingTextarea label="Message global (Page 1 du rapport)" value={agencyComment} onChange={setAgencyComment} placeholder="Saisissez ici les objectifs globaux (500 chars max)..." maxLength={500}/>
              </div>
              <div className="space-y-4 text-left text-left text-left text-left text-left text-left">
                 <div className="flex items-center gap-4 mb-6 text-left text-left text-left text-left text-left text-left text-left">
                    <div className="p-3 bg-blue-50 text-[#0033a0] rounded-2xl text-left text-left text-left text-left text-left text-left text-left text-left"><UserCog size={24}/></div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 text-left text-left text-left text-left text-left text-left text-left text-left text-left">Commentaires par Collaborateur</h3>
                 </div>
                 {dataSummary.collabs.map(c => (
                    <div key={`central-${c.name}`} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start text-left text-left text-left text-left text-left text-left text-left">
                       <div className="flex items-center gap-4 min-w-[200px] text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-left text-left text-left text-left text-left text-left text-left text-left">{c.name[0]}</div>
                          <span className="font-black uppercase text-slate-900 tracking-tight text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">{c.name}</span>
                       </div>
                       <CoachingTextarea value={managerComments[c.name]} onChange={(val) => setManagerComments(prev => ({...prev, [c.name]: val}))} placeholder={`Conseils pour ${c.name}...`} maxLength={500}/>
                    </div>
                 ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL APERÇU PDF (GARANTIT innerHTML != null) */}
      {showPdf && (
        <div className="fixed inset-0 z-[100] bg-blue-900/95 backdrop-blur-xl flex flex-col p-4 animate-in fade-in duration-300 overflow-hidden text-left print:hidden text-left text-left text-left text-left text-left text-left text-left">
          <div className="flex justify-between text-white mb-4 px-4 max-w-7xl mx-auto w-full text-left text-left text-left text-left text-left text-left text-left text-left text-left">
            <div className="flex items-center gap-3 text-left text-left text-left text-left">
              <div className="p-2 bg-white rounded-lg text-[#0033a0] shadow-lg text-left text-left text-left text-left text-left text-left text-left text-left text-left"><Printer size={20}/></div>
              <span className="font-black uppercase tracking-widest italic text-xs text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Aperçu du Dossier Executive</span>
            </div>
            <div className="flex items-center gap-4 text-left text-left text-left text-left text-left">
               <button onClick={handlePrintAction} className="px-6 py-3 bg-white text-[#0033a0] font-black rounded-xl flex items-center gap-2 shadow-2xl text-[10px] uppercase hover:bg-blue-50 transition-all text-left text-left text-left text-left text-left text-left text-left">Impression Système</button>
               <div className="flex flex-col gap-1 text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                  <button onClick={exportToPDF} disabled={isExporting} className="px-6 py-3 bg-emerald-500 text-white font-black rounded-xl flex items-center gap-2 shadow-2xl text-[10px] uppercase hover:bg-emerald-600 transition-all disabled:opacity-50 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">{isExporting ? <Loader2 className="animate-spin" size={16}/> : <FileDown size={16}/>} Générer PDF</button>
                  {downloadUrl && <a href={downloadUrl} download={`Audit_${today}.pdf`} className="text-[9px] text-emerald-300 font-bold underline flex items-center gap-1 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><ExternalLink size={10}/> Télécharger le PDF</a>}
               </div>
               <button onClick={()=>setShowPdf(false)} className="p-2 bg-white/10 rounded-full hover:bg-rose-50 text-white transition-all text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><X size={24}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-200/20 p-4 flex flex-col items-center text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
            <div className="bg-white shadow-2xl w-[210mm] p-0 shadow-2xl text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
               <ReportLayout today={today} dataSummary={dataSummary} agencyAudit={agencyAudit} analysisResults={analysisResults} agencyComment={agencyComment} managerComments={managerComments} />
            </div>
          </div>
        </div>
      )}

      {/* CONTENEUR CACHÉ POUR L'IMPRESSION (GARANTIT innerHTML != null) */}
      <div className="hidden">
         <ReportLayout today={today} dataSummary={dataSummary} agencyAudit={agencyAudit} analysisResults={analysisResults} agencyComment={agencyComment} managerComments={managerComments} />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 20px; }
        .print-page { width: 210mm; height: 296mm; padding: 15mm; display: flex; flex-direction: column; box-sizing: border-box; page-break-after: always !important; text-align: left; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .print-page:last-child { page-break-after: auto !important; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: white !important; }
          .print-page { display: flex !important; visibility: visible !important; }
        }
      `}} />
    </div>
  );
}
