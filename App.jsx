import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClipboardPaste, Loader2, User, ListTodo, ShieldCheck, 
  LayoutDashboard, X, Eye, ThumbsUp, Activity, Database, 
  Scale, Calendar, Printer, Users, Check, ChevronDown, Trash2, 
  Building2, UserCog, DoorOpen, UserSearch, Handshake, FileCheck, PenTool, CalendarCheck, ExternalLink, Filter
} from 'lucide-react';

// --- CONFIGURATION ET CONSTANTES ---
const A4_WIDTH = "210mm";
const A4_HEIGHT = "297mm";
const CARD_CLASS = "bg-white rounded-3xl p-6 shadow-sm border border-blue-50 transition-all hover:shadow-lg text-left";

// --- COMPOSANTS UI ATOMIQUES ---

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
      className="p-3 rounded-xl border flex flex-col items-center justify-center relative overflow-hidden shadow-sm text-left h-full"
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
      <span className="text-[5px] font-bold text-slate-300 uppercase tracking-tighter z-10 leading-none">{isAverage ? "MOYENNE" : "ACTUEL"}</span>
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
          {selected.length === 0 ? "Toute la période" : `${selected.length} sélectionné(s)`}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((opt) => (
            <button
              key={`dropdown-opt-diag-${opt}`}
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
    {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-left">{label}</label>}
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

// --- MOTEUR DE DIAGNOSTIC ---
const getAuditResult = (averages, isAgency, topPerformers = []) => {
  const check = (val, threshold, label, successMsg, failMsg, passArg, failArg, icon, isMax = true, suffix = "") => {
    const num = parseFloat(val);
    const met = isMax ? num <= threshold : num >= threshold;
    const valDisp = `${num}${suffix}`;
    const targetDisp = isMax ? `≤ ${threshold}${suffix}` : `≥ ${threshold}${suffix}`;
    return {
      label, met, icon, summary: met ? successMsg : failMsg,
      numericalDetail: `Diagnostic Expert : ${met ? passArg : failArg} (Observé : ${valDisp} / Cible : ${targetDisp}).`
    };
  };

  const performersList = topPerformers.length > 0 
    ? topPerformers.map(p => `${p.name} (${p.count}x)`).join(', ') 
    : "Aucun collaborateur n'a atteint ce palier stratégique.";

  if (isAgency) {
    return [
      check(averages.rPortePres, 3, "Portes / Présents", "Maîtrise du ciblage horaire.", "Déficit de présence à l'écoute.", 
        "L'analyse globale de la performance de l'agence sur le ratio Portes/Présents met en lumière une compréhension stratégique exceptionnelle de la gestion des secteurs géographiques. Vos équipes démontrent une capacité remarquable à synchroniser leurs passages avec les pics de présence des prospects au domicile, ce qui constitue le premier levier de rentabilité de notre activité de vente directe. Cette efficacité chirurgicale dans l'approche initiale permet non seulement de réduire l'épuisement physique des collaborateurs sur le terrain, mais elle garantit également une fluidité maximale tout au long du cycle de vente. En identifiant avec une telle précision les créneaux horaires les plus porteurs, l'agence optimise ses ressources et maximise les opportunités de présentation qualitative. Il est impératif de maintenir ce niveau d'exigence dans le ciblage pour pérenniser ce succès collectif sur le long terme de l'agence Executive pour l'avenir durable de la structure commerciale complète.",
        "Le ratio Portes/Présents actuel de l'agence révèle un déficit critique dans l'organisation tactique des tournées sur le terrain. Un nombre trop important d'ouvertures de portes ne débouche pas sur un temps d'écoute, ce qui suggère une inadéquation flagrante entre les horaires de passage et les habitudes de vie des prospects ciblés par la structure. Pour redresser la situation, il est impératif d'opérer une refonte de la stratégie de passage en privilégiant les créneaux de fin de journée ou les mercredi après-midi, moments où la disponibilité mentale des clients est maximale. L'agence doit également renforcer la formation de ses équipes sur l'accroche de 'pas de porte' pour instaurer un climat de confiance immédiat dès les premières secondes de l'interaction. Sans une correction rapide de ce premier indicateur, l'ensemble de l'entonnoir de vente globale de l'agence Executive restera sous-performant pour le moment.", DoorOpen, true),
      check(averages.rPresProsp, 2, "Présents / Prospects", "Expertise en découverte client.", "Phase de découverte courte.", 
        "L'agence affiche une maîtrise technique impressionnante lors de la phase cruciale de découverte client, transformant les simples présences en prospects qualifiés avec une régularité exemplaire. Cette étape, qui est souvent le point de rupture dans le cycle de vente, est ici gérée avec une finesse psychologique qui honore le professionnalisme de vos équipes. En posant les bonnes questions ouvertes et en pratiquant une écoute active rigoureuse, vos collaborateurs parviennent à extraire les besoins latents des foyers pour les transformer en opportunités concrètes. Cette capacité à créer de la valeur perçue dès les premières minutes de l'entretien est le socle sur lequel repose votre croissance automatique. Il est fondamental de continuer à valoriser cette approche qualitative du métier, car elle réduit mécaniquement le taux de refus lors du closing final. Le niveau d'expertise est ici validé pour tout le groupe terrain actuel Executive pour le futur de la boîte.",
        "Le diagnostic sur la transformation des présents en prospects indique une fragilité dans la phase de découverte collective de l'agence. Actuellement, le discours semble trop orienté vers la présentation produit plutôt que vers l'exploration des besoins réels du client final. Pour optimiser ce ratio, il est nécessaire de réinjecter de l'empathie et de la curiosité dans l'échange. Un prospect qui ne se projette pas ne signera jamais de bon de commande. Le management doit impérativement organiser des ateliers de jeux de rôles focalisés sur la reformulation et l'identification des points de douleur des foyers. Si vos équipes ne parviennent pas à convaincre de l'utilité du service à ce stade, tout le processus de closing sera irrémédiablement compromis. Il s'agit ici d'un levier de conversion majeur à activer d'urgence pour stabiliser les résultats mensuels et garantir la progression du chiffre d'affaires global de la structure actuelle Executive.", UserSearch, true),
      check(averages.rProspClose, 2, "Prospects / Closing", "Cycle de closing optimisé.", "Perte d'efficacité au closing.", 
        "La fluidité observée entre la phase de qualification des prospects et la conclusion des ventes témoigne d'un haut niveau de maturité commerciale au sein de l'agence. Vos équipes ne se contentent pas de présenter des offres ; elles accompagnent les clients vers une décision naturelle en verrouillant chaque étape de l'argumentaire. Cette transition fluide est le résultat d'un travail méticuleux sur la levée des objections en amont, évitant ainsi les confrontations stériles en fin de parcours. Le client se sent écouté et compris, ce qui facilite grandement l'engagement psychologique nécessaire à la validation de la commande. Cette efficacité dans la transformation est un avantage concurrentiel majeur pour l'agence, permettant d'optimiser le temps passé sur le terrain et de maximiser le retour sur investissement de chaque tournée. Maintenez ce focus permanent sur la validation progressive des étapes clés pour réussir durablement cette année.",
        "L'agence rencontre des difficultés marquées lors de la phase de transformation des prospects en closings, ce qui suggère un manque de verrouillage lors des étapes précédentes. Trop de prospects qualifiés s'évaporent au moment de la décision finale, révélant des objections latentes qui n'ont pas été traitées à temps par les collaborateurs. Pour remédier à cette situation, il est crucial de travailler sur la technique des 'petits oui' tout au long de la présentation. Le closing ne doit pas être un événement soudain, mais l'aboutissement logique d'un accord mutuel construit étape par étape. Si le client hésite au moment crucial, c'est que la valeur ajoutée perçue n'est pas encore assez forte ou que des freins psychologiques n'ont pas été exprimés clairement. Un renforcement des compétences en conclusion de vente est indispensable pour ne plus laisser de opportunités s'échapper inutilement ici aujourd'hui pour l'agence.", Handshake, true),
      check(averages.rClosingBC, 2, "Closing / BC", "Rigueur administrative totale.", "Évaporation post-closing.", 
        "La rigueur administrative et le suivi du processus de clôture des bons de commande sont des points forts indéniables de votre structure. Transformer un closing moral en un engagement contractuel ferme demande une discipline que vos équipes ont parfaitement intégrée. Cette étape finale est gérée sans aucune friction, ce qui sécurise non seulement le chiffre d'affaires immédiat mais renforce également l'image de marque de l'entreprise auprès des nouveaux clients. En évitant les doutes post-closing grâce à une posture de conseil ferme et rassurante, l'agence limite drastiquement les risques de rétractation et optimise sa chaîne logistique. Cette maîtrise du dernier kilomètre administratif est la preuve d'une organisation interne saine et d'un management qui accorde de l'importance au détail. Continuez à appliquer ces protocoles de vérification systématique pour garantir la qualité totale de production globale ici même aujourd'hui.",
        "L'agence subit une perte d'efficacité alarmante entre la validation morale de la vente et la saisie effective du bon de commande. Ce décalage suggère une baisse de tension psychologique ou un manque de professionnalisme au moment de formaliser l'engagement sur papier. Le client ressent peut-être l'hésitation du collaborateur, ce qui réactive ses peurs et bloque la signature finale. Pour corriger ce tir, il est impératif que le management rappelle les fondamentaux de la prise de congé et de la sécurisation du contrat. Un closing n'est jamais terminé tant que le document n'est pas signé et les modalités de livraison clairement acceptées par les deux parties. Il est nécessaire de revoir les procédures de saisie immédiate sur le terrain pour éviter que l'enthousiasme du client ne retombe. La rigueur administrative doit devenir une priorité absolue pour sécuriser votre production de l'agence Executive dès maintenant aujourd'hui.", FileCheck, true),
      check(averages.valBC, 12, "BC / Jour", "Volume de production exemplaire.", "Productivité sous les seuils.", 
        `L'analyse de la productivité volumétrique de l'agence révèle une dynamique collective qu'il convient de décortiquer pour assurer la pérennité de notre modèle économique. Atteindre le seuil de 12 BC/jour n'est pas une mince affaire ; c'est le reflet d'une intensité de terrain et d'une organisation tactique maîtrisée. Sur cette période, nous tenons à féliciter les collaborateurs qui ont franchi ce palier stratégique : ${performersList}. Ces résultats prouvent que l'excellence est à portée de main quand la méthode est appliquée. Cette dynamique insuffle une énergie positive à toute l'équipe et crée une saine émulation entre les collaborateurs de terrain. Maintenir ce rythme permet de garantir les revenus de la structure tout en affirmant notre position de leader sur le secteur. Le management doit utiliser ces performances comme étalons pour la montée en puissance de l'ensemble du groupe.`,
        `La productivité moyenne de l'agence est actuellement insuffisante pour exploiter tout le potentiel des secteurs géographiques. Un volume inférieur à 12 BC/jour fragilise l'équilibre économique de la structure. Nous notons toutefois que certains éléments parviennent à tirer leur épingle du jeu : ${performersList}. Malgré ces réussites isolées, l'effort doit devenir collectif. Pour relancer la machine, il est nécessaire de fixer des objectifs horaires plus stricts et de redynamiser les départs terrain. Une productivité en retrait est souvent le signal d'un essoufflement moral ou d'une routine qui s'installe insidieusement. Le management doit réinsuffler de l'ambition et de la vitesse dans l'exécution des tâches quotidiennes. Augmenter le nombre de passages est le levier le plus simple pour faire remonter mécaniquement le volume de commandes et sécuriser la croissance de l'agence Executive totale.`, PenTool, false),
      check(averages.attendance, 100, "Présence", "Engagement collectif total.", "Déficit d'assiduité équipe.", 
        "L'assiduité totale et l'engagement sans faille de vos collaborateurs sur le terrain constituent le socle inébranlable de la réussite de l'agence. Une présence à 100% garantit une couverture optimale de vos secteurs et assure une réactivité maximale face aux opportunités du marché. Cette discipline collective est d'autant plus remarquable qu'elle témoigne d'une adhésion forte aux valeurs de l'entreprise et d'une motivation sans faille pour atteindre les objectifs communs. En vente directe, la présence est le seul facteur de succès que nous maîtrisons totalement, et l'agence en fait une démonstration exemplaire chaque jour. Cette fiabilité exemplaire permet d'instaurer une relation de confiance durable avec la clientèle locale qui apprécie la régularité et le sérieux du service proposé. Continuez à cultiver cet esprit de corps et cette rigueur professionnelle qui font la force de votre agence terrain de demain.",
        "L'agence souffre d'une irrégularité de présence qui fragilise l'ensemble de sa dynamique commerciale. Les absences répétées, qu'elles soient justifiées ou non, brisent la continuité du service et empêchent l'exploitation méthodique des secteurs. En vente directe, chaque jour manqué est une opportunité de vente perdue qui ne se rattrapera jamais. Ce manque d'assiduité envoie également un signal négatif au reste de l'équipe et peut dégrader le moral collectif si aucune mesure n'est prise. Le management doit impérativement rappeler que la discipline de présence est le premier pilier de la réussite professionnelle dans notre métier. Il est nécessaire de mettre en place un suivi plus rigoureux du planning et de valoriser l'assiduité comme un critère de performance majeur. Sans une présence constante sur le terrain, tous les efforts de formation et de technique de vente resteront stériles pour l'agence Executive actuelle.", 
        CalendarCheck, false, "%")
    ];
  } else {
    // TEXTES COLLABORATEURS : 450-500 caractères
    return [
      check(averages.rPortePres, 3, "Portes / Présents", "L'accroche est excellente.", "Taux de présence insuffisant.", "Votre maîtrise du ratio Portes/Présents démontre une excellente lecture de vos secteurs. Vous savez manifestement identifier les moments et les lieux où les prospects sont présents et disposés à vous écouter. Cette efficacité dans l'approche vous permet de maximiser votre temps de présentation sans gaspiller d'énergie sur des refus. C'est un atout majeur qui fluidifie tout le reste de votre entonnoir de vente actuel. Maintenez cette rigueur.", "Un ratio Portes/Présents trop élevé indique souvent que vous ne trouvez pas assez de personnes ou que vous n'arrivez pas à transformer l'ouverture de porte en temps d'écoute. Pour corriger cela, optimisez vos tournées en ciblant les horaires stratégiques. Travaillez aussi votre accroche de 'pas de porte' : l'objectif est de rassurer immédiatement pour que le client accepte votre présence. Soyez plus observateur sur les signes de vie au foyer.", DoorOpen, true),
      check(averages.rPresProsp, 2, "Présents / Prospects", "Découverte maîtrisée.", "Phase de découverte courte.", "Votre capacité à transformer un présent en prospect montre que vous savez identifier avec précision les besoins réels du foyer durant votre présentation. En posant les bonnes questions ouvertes, vous amenez le client à verbaliser ses attentes, ce qui facilite grandement la suite du processus. Vous ne faites pas qu'exposer des produits, vous apportez des solutions concrètes. Continuez à soigner cette étape cruciale de qualification.", "Vous présentez nos services mais vous ne parvenez pas assez à convaincre de leur utilité. Il est crucial de passer plus de temps sur la phase de découverte pour isoler les habitudes de consommation du foyer. Actuellement, votre discours semble trop générique et ne crée pas assez d'impact émotionnel ou pratique chez le client. Travaillez sur l'écoute active : laissez le client s'exprimer davantage pour pouvoir rebondir sur ses besoins.", UserSearch, true),
      check(averages.rProspClose, 2, "Prospects / Closing", "Transformation fluide.", "Engagement client fragile.", "Votre sélection qualitative des prospects en amont garantit une transition naturelle vers la vente. Vous savez trier les profils dès le départ, ce qui vous évite de perdre du temps sur des négociations stériles. Votre force réside dans la validation progressive des étapes de vente : quand vous arrivez au closing, le client est déjà convaincu psychologiquement. Cette fluidité réduit votre fatigue mentale et renforce votre image d'expert.", "L'engagement client s'affaiblit systématiquement en fin de parcours, ce qui indique un manque de verrouillage lors des étapes précédentes. Vous arrivez souvent au closing face à des objections que vous auriez dû traiter bien plus tôt. Il est nécessaire de travailler la reformulation et la validation par 'petits oui' tout au long de votre présentation. Si le client hésite au moment final, c'est que la valeur ajoutée perçue n'est pas assez forte.", Handshake, true),
      check(averages.rClosingBC, 2, "Closing / BC", "Clôture administrative parfaite.", "Vérifiez le processus BC.", "Votre taux de transformation entre le closing moral et la saisie du bon de commande est exemplaire. Cela prouve que vous sécurisez parfaitement l'engagement du client et que vous maîtrisez l'aspect administratif sans créer de friction. Le client se sent accompagné jusqu'au bout, ce qui limite les rétractations précoces et les doutes post-achat. Cette rigueur dans la conclusion est le signe d'une grande confiance en soi absolue.", "Trop de ventes validées oralement s'évaporent avant la signature définitive du bon de commande. Ce décalage suggère une baisse de tension ou un manque de professionnalisme au moment de sortir le document officiel. Le client ressent peut-être l'hésitation du collaborateur, ce qui réactive ses peurs. Assurez-vous d'avoir levé tous les derniers doutes et restez ferme dans votre posture de conseil jusqu'à la validation technique de la vente finale.", FileCheck, true),
      check(averages.valBC, 12, "BC / Jour", "Volume de production solide.", "Productivité à renforcer.", "Votre productivité quotidienne est en parfaite adéquation avec les standards de rentabilité de l'agence. Ce volume régulier assure non seulement vos revenus, mais il témoigne aussi d'une gestion exemplaire de votre secteur et de votre énergie sur le terrain. En maintenant cette cadence, vous vous donnez les moyens d'amortir les jours plus difficiles et de surperformer lors des périodes de forte activité. Votre assiduité est votre moteur.", "Votre volume moyen de commandes ne permet pas d'exploiter tout le potentiel de votre secteur géographique. Pour stabiliser vos résultats, vous devez impérativement augmenter votre nombre de passages ou optimiser radicalement vos ratios de transformation. Une productivité en retrait est souvent le signe d'une baisse d'intensité sur le terrain ou d'une mauvaise organisation de votre tournée.", PenTool, false),
      check(averages.attendance, 100, "Présence", "Assiduité totale.", "Irrégularité pénalisante.", "Votre engagement total sur le terrain est le fondement de votre réussite. Votre présence constante assure une couverture secteur optimale et renforce la crédibilité de l'agence auprès de vos clients qui apprécient la régularité du service. Cette fiabilité est indispensable pour construire un portefeuille client solide et fidèle sur le long terme. C'est votre sérieux qui fait la différence avec la concurrence terrain chaque jour.", "Vos absences répétées ou irrégulières brisent la dynamique commerciale indispensable à la tenue de votre secteur. Chaque jour manqué est une opportunité perdue et un signal négatif envoyé à votre clientèle qui attend de la régularité. En vente directe, le manque de présence est le premier facteur de chute des résultats, car il empêche la création d'un cercle vertueux de prospection. La discipline de présence est votre levier puissant.", CalendarCheck, false, "%")
    ];
  }
};

// --- COMPOSANT DE RENDU DU RAPPORT (SÉPARATION 2 PAGES AGENCE) ---
const ReportLayout = ({ dataSummary, agencyAudit, analysisResults, agencyComment, managerComments }) => {
  return (
    <div id="print-target" className="bg-white text-left p-0 m-0 font-sans" style={{ width: A4_WIDTH }}>
      
      {/* PAGE AGENCE 1 : GRILLE + 4 PREMIERS DIAGNOSTICS */}
      <div className="print-page border-b-8 border-blue-900 flex flex-col text-left" style={{ minHeight: A4_HEIGHT, width: A4_WIDTH, boxSizing: 'border-box', padding: '15mm' }}>
        <div className="flex items-center gap-5 mb-8 pb-4 border-b-2 border-blue-50 text-left">
          <ShieldCheck size={48} className="text-[#0033a0]"/>
          <div className="text-left">
            <h1 className="text-3xl font-black uppercase text-[#0033a0] tracking-tighter italic leading-none">Diagnostic Stratégique Agence</h1>
            <p className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mt-1 italic">{dataSummary.range} - Page 1/2</p>
          </div>
        </div>
        <div className="mb-8">
          <div className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mb-4 flex items-center gap-2"><Users size={14}/> Moyennes de l'Équipe</div>
          <div className="grid grid-cols-6 gap-2 text-left">
            <StatBox label="Porte/Pres" value={dataSummary.agencyAvg.rPortePres} threshold={3} isAverage={true} icon={DoorOpen} />
            <StatBox label="Pres/Prosp" value={dataSummary.agencyAvg.rPresProsp} threshold={2} isAverage={true} icon={UserSearch} />
            <StatBox label="Prosp/Cl" value={dataSummary.agencyAvg.rProspClose} threshold={2} isAverage={true} icon={Handshake} />
            <StatBox label="Close/BC" value={dataSummary.agencyAvg.rClosingBC} threshold={2} isAverage={true} icon={FileCheck} />
            <StatBox label="BC/J" value={dataSummary.agencyAvg.valBC} threshold={12} isMax={false} isAverage={true} icon={PenTool} />
            <StatBox label="Présence" value={dataSummary.agencyAvg.attendance} threshold={100} isMax={false} suffix="%" isAverage={true} icon={CalendarCheck} />
          </div>
        </div>
        <div className="space-y-6 flex-1 text-left">
          <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2rem]">
            <div className="text-[9px] font-black text-[#0033a0] uppercase mb-4 text-left">Diagnostic Stratégique Collectif (Partie 1)</div>
            <div className="space-y-4">
              {agencyAudit.slice(0, 4).map((item, i) => {
                const IconComp = item.icon;
                return (
                  <div key={`ag-diag-p1-${i}`} className="flex items-start gap-4">
                    <div className={`mt-1.5 p-2 rounded-lg shrink-0 ${item.met ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {IconComp && <IconComp size={24} />}
                    </div>
                    <div className="text-left text-left">
                      <span className="text-[9px] font-black uppercase opacity-40 block leading-none">{item.label}</span>
                      <p className="text-xs font-black text-slate-800 leading-tight mt-1">{item.summary}</p>
                      <p className="text-[9px] font-bold text-slate-500 mt-1 italic">{item.numericalDetail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="page-break" style={{ pageBreakAfter: 'always', clear: 'both' }}></div>

      {/* PAGE AGENCE 2 : 2 DERNIERS DIAGNOSTICS + DIRECTIVES */}
      <div className="print-page border-b-8 border-blue-900 flex flex-col text-left" style={{ minHeight: A4_HEIGHT, width: A4_WIDTH, boxSizing: 'border-box', padding: '15mm' }}>
        <div className="flex items-center gap-5 mb-8 pb-4 border-b-2 border-blue-50 text-left">
          <ShieldCheck size={48} className="text-[#0033a0]"/>
          <div className="text-left">
            <h1 className="text-3xl font-black uppercase text-[#0033a0] tracking-tighter italic leading-none">Diagnostic Stratégique Agence</h1>
            <p className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mt-1 italic">{dataSummary.range} - Page 2/2</p>
          </div>
        </div>
        <div className="space-y-6 flex-1 text-left">
          <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2rem]">
            <div className="text-[9px] font-black text-[#0033a0] uppercase mb-4 text-left">Diagnostic Stratégique Collectif (Partie 2)</div>
            <div className="space-y-4">
              {agencyAudit.slice(4).map((item, i) => {
                const IconComp = item.icon;
                return (
                  <div key={`ag-diag-p2-${i}`} className="flex items-start gap-4">
                    <div className={`mt-1.5 p-2 rounded-lg shrink-0 ${item.met ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {IconComp && <IconComp size={24} />}
                    </div>
                    <div className="text-left text-left">
                      <span className="text-[9px] font-black uppercase opacity-40 block leading-none">{item.label}</span>
                      <p className="text-xs font-black text-slate-800 leading-tight mt-1">{item.summary}</p>
                      <p className="text-[9px] font-bold text-slate-500 mt-1 italic">{item.numericalDetail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2rem] text-left flex-1">
            <div className="text-[9px] font-black text-emerald-600 uppercase mb-4">Directives Stratégiques de l'Agence</div>
            <p className="text-sm font-bold text-emerald-950 italic leading-relaxed whitespace-pre-wrap">{agencyComment || "Maintenez l'intensité terrain pour la structure Executive."}</p>
          </div>
        </div>
      </div>

      <div className="page-break" style={{ pageBreakAfter: 'always', clear: 'both' }}></div>

      {/* PAGES COLLABORATEURS */}
      {dataSummary.collabs.map((c) => {
        const audit = analysisResults[c.name] || [];
        const normKey = c.name.toLowerCase().replace(/\s/g, '');
        return (
          <div key={`p-col-diag-${normKey}`} className="print-page flex flex-col text-left mb-10 border-b border-slate-100 text-left" style={{ minHeight: A4_HEIGHT, width: A4_WIDTH, boxSizing: 'border-box', padding: '15mm' }}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-[#0033a0] text-white flex items-center justify-center font-black text-lg">{c.name[0]}</div>
                <div className="text-left">
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">{c.name}</h3>
                  <p className="text-[9px] font-black text-[#0033a0] uppercase tracking-widest mt-1 italic">{dataSummary.range}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-8 text-left text-left text-left">
              <StatBox label="Porte/Pres" value={c.averages.rPortePres} threshold={3} isMax={true} isAverage={true} icon={DoorOpen} />
              <StatBox label="Pres/Prosp" value={c.averages.rPresProsp} threshold={2} isMax={true} isAverage={true} icon={UserSearch} />
              <StatBox label="Prosp/Cl" value={c.averages.rProspClose} threshold={2} isMax={true} isAverage={true} icon={Handshake} />
              <StatBox label="Close/BC" value={c.averages.rClosingBC} threshold={2} isMax={true} isAverage={true} icon={FileCheck} />
              <StatBox label="BC/J" value={c.averages.valBC} threshold={12} isMax={false} isAverage={true} icon={PenTool} />
              <StatBox label="Présence" value={c.averages.attendance} threshold={100} isMax={false} isAverage={false} suffix="%" icon={CalendarCheck} />
            </div>
            <div className="space-y-6 flex-1 text-left text-left text-left">
              <div className="p-6 bg-slate-50/50 rounded-[1.5rem] border border-blue-50 text-left">
                <div className="text-[8px] font-black text-[#0033a0] uppercase mb-4 tracking-widest text-left text-left">Diagnostic Individuel Expert</div>
                <div className="space-y-4">
                  {audit.map((item, i) => {
                    const IconComponent = item.icon;
                    return (
                      <div key={`diag-p-row-${normKey}-${i}`} className="flex items-start gap-5 text-left">
                        <div className={`mt-1.5 p-2 rounded-lg shrink-0 ${item.met ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          {IconComponent && <IconComponent size={24} />}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-black uppercase opacity-40 leading-none">{item.label}</span>
                          <p className="text-[10px] font-black text-slate-800 leading-tight mt-1">{item.summary}</p>
                          <p className="text-[8px] font-bold text-slate-500 mt-1 italic leading-relaxed">{item.numericalDetail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 text-left text-left text-left">
                <div className="text-[8px] font-black text-emerald-600 uppercase mb-3 tracking-widest text-left text-left">Directives Manager</div>
                <p className="text-xs font-bold text-emerald-950 italic leading-relaxed whitespace-pre-wrap text-left text-left">{managerComments[normKey] || "Saisissez vos conseils dans l'onglet coaching."}</p>
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

  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedWeeks, setSelectedWeeks] = useState([]);

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // ANALYSE DES ENTRÉES
  const rawEntries = useMemo(() => {
    if (!pastedData || pastedData.trim().length < 10) return [];
    const lines = pastedData.split('\n').filter(l => l.trim().length > 0);
    const headers = lines[0].split(/[|\t]/).map(h => h.trim().toLowerCase());
    const findIdx = (keys) => headers.findIndex(h => keys.some(k => h.includes(k)));
    const idx = { name: findIdx(["nom du collaborateur", "nom"]), po: findIdx(["portes"]), pr: findIdx(["présent"]), ps: findIdx(["prospect"]), cl: findIdx(["closings"]), bc: findIdx(["bc"]), att: findIdx(["présence"]), week: findIdx(["semaine"]), month: findIdx(["mois"]) };
    if (idx.name === -1) return [];
    return lines.slice(1).map(line => {
      const p = line.split(/[|\t]/).map(v => v.trim());
      if (!p[idx.name] || p[idx.name].toLowerCase().includes("nom")) return null;
      return {
        name: p[idx.name], po: parseInt(p[idx.po]) || 0, pr: parseInt(p[idx.pr]) || 0, ps: parseInt(p[idx.ps]) || 0,
        cl: parseInt(p[idx.cl]) || 0, bc: parseInt(p[idx.bc]) || 0,
        isPresent: (idx.att !== -1 && p[idx.att]) ? (p[idx.att].toUpperCase().startsWith('P')) : true,
        week: idx.week !== -1 ? p[idx.week] : "0", month: idx.month !== -1 ? p[idx.month] : "Inconnu"
      };
    }).filter(e => e !== null);
  }, [pastedData]);

  const availableFilters = useMemo(() => {
    if (rawEntries.length === 0) return { months: [], weeks: [] };
    const m = [...new Set(rawEntries.map(e => e.month))].filter(v => v && v !== "Inconnu").sort();
    const w = [...new Set(rawEntries.map(e => e.week))].sort((a, b) => parseInt(a) - parseInt(b));
    return { months: m, weeks: w.map(v => `S${v}`) };
  }, [rawEntries]);

  const dataSummary = useMemo(() => {
    if (rawEntries.length === 0) return { count: 0, collabs: [], agencyAvg: {}, range: "...", topPerformers: [] };
    const filtered = rawEntries.filter(e => {
      const mMatch = selectedMonths.length === 0 || selectedMonths.includes(e.month);
      const wMatch = selectedWeeks.length === 0 || selectedWeeks.includes(`S${e.week}`);
      return mMatch && wMatch;
    });
    if (filtered.length === 0) return { count: 0, collabs: [], agencyAvg: {}, range: "Sélection vide", topPerformers: [] };
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
      const sums = worked.reduce((a, b) => ({ po: a.po + (b.pr > 0 ? b.po/b.pr : 0), pr: a.pr + (b.ps > 0 ? b.pr/b.ps : 0), ps: a.ps + (b.cl > 0 ? b.ps/b.cl : 0), cl: a.cl + (b.bc > 0 ? b.cl/b.bc : 0), bc: a.bc + b.bc }), { po: 0, pr: 0, ps: 0, cl: 0, bc: 0 });
      const weeksAtGoal = worked.filter(e => e.bc >= 12).length;
      return { name: c.name, weeksAtGoal, averages: { rPortePres: (sums.po / wL).toFixed(2), rPresProsp: (sums.pr / wL).toFixed(2), rProspClose: (sums.ps / wL).toFixed(2), rClosingBC: (sums.cl / wL).toFixed(2), valBC: (sums.bc / wL).toFixed(1), attendance: Math.round((worked.length / c.entries.length) * 100) } };
    });
    const topPerformers = collabs.filter(c => c.weeksAtGoal > 0).map(c => ({ name: c.name, count: c.weeksAtGoal }));
    const agencyAvg = { rPortePres: agS.pr > 0 ? (agS.po / agS.pr).toFixed(2) : 0, rPresProsp: agS.ps > 0 ? (agS.pr / agS.ps).toFixed(2) : 0, rProspClose: agS.cl > 0 ? (agS.ps / agS.cl).toFixed(2) : 0, rClosingBC: agS.bc > 0 ? (agS.cl / agS.bc).toFixed(2) : 0, valBC: agS.attD > 0 ? (agS.bc / agS.attD).toFixed(1) : 0, attendance: agS.totD > 0 ? Math.round((agS.attD / agS.totD) * 100) : 0 };
    const rangeText = `${selectedMonths.length > 0 ? selectedMonths.join(', ') : 'Période complète'} | ${selectedWeeks.length > 0 ? selectedWeeks.join(', ') : 'Toutes semaines'}`;
    return { count: collabs.length, collabs, agencyAvg, topPerformers, range: rangeText };
  }, [rawEntries, selectedMonths, selectedWeeks]);

  const handleAnalyse = () => {
    setLoading(true);
    const agRes = getAuditResult(dataSummary.agencyAvg, true, dataSummary.topPerformers);
    setAgencyAudit(agRes);
    const results = {};
    dataSummary.collabs.forEach(c => { results[c.name] = getAuditResult(c.averages, false); });
    setAnalysisResults(results);
    setTab('analyse');
    setLoading(false);
  };

  const handlePrint = () => {
    const content = document.getElementById('print-target').innerHTML;
    const win = window.open('', '_blank');
    if (!win) { alert("Pop-ups bloqués."); return; }
    win.document.write(`<html><head><script src="https://cdn.tailwindcss.com"></script><style>@page { size: A4 portrait; margin: 0; } body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; } .print-page { width: ${A4_WIDTH}; min-height: ${A4_HEIGHT}; padding: 15mm; box-sizing: border-box; background: white !important; text-align: left; overflow: visible; position: relative; display: flex; flex-direction: column; } .page-break { page-break-after: always; clear: both; }</style></head><body>${content}</body></html>`);
    win.document.close(); win.focus();
    setTimeout(() => { win.print(); win.close(); }, 1500);
  };

  return (
    <div className="flex h-screen bg-white text-slate-900 overflow-hidden font-sans text-left text-sm text-left">
      <aside className="w-64 bg-[#0033a0] text-white p-6 flex flex-col gap-8 print:hidden shrink-0 relative z-20 shadow-2xl text-left text-left">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-lg text-left text-left"><ShieldCheck style={{ color: '#0033a0' }} size={20} /></div>
          <div className="text-left text-left text-left"><span className="font-black tracking-tighter uppercase text-sm block leading-none text-left">EM Executive</span><span className="text-[7px] text-blue-200 font-bold tracking-[0.2em] uppercase text-left text-left text-left">v60.15 Diagnostic</span></div>
        </div>
        <nav className="flex flex-col gap-1.5 text-left text-left text-left">
          <SidebarLink active={tab==='import'} onClick={() => setTab('import')} icon={<Database size={16}/>} label="Données Source" />
          <SidebarLink active={tab==='analyse'} onClick={() => setTab('analyse')} icon={<LayoutDashboard size={16}/>} label="Diagnostic Stratégique" disabled={dataSummary.count === 0}/>
          <SidebarLink active={tab==='config'} onClick={() => setTab('config')} icon={<ListTodo size={16}/>} label="Directives Coaching" />
        </nav>
        <div className="mt-auto pt-6 border-t border-white/10 text-left text-left">
          <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-4 flex items-center gap-2"><Scale size={12}/> Seuils Cibles</h3>
          <div className="space-y-1.5 text-left text-left text-left">
            <RuleItem label="Porte / Pres" target="≤ 3" icon={DoorOpen} /><RuleItem label="Pres / Prosp" target="≤ 2" icon={UserSearch} /><RuleItem label="Prosp / Close" target="≤ 2" icon={Handshake} /><RuleItem label="Close / BC" target="≤ 2" icon={FileCheck} /><RuleItem label="Volume BC / J" target="≥ 12" icon={PenTool} /><RuleItem label="Présence" target="100%" icon={CalendarCheck} />
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F4F7FF] print:bg-white text-left text-left">
        <header className="h-16 bg-white border-b border-blue-100 px-8 flex items-center justify-between shrink-0 print:hidden z-10 text-left text-left">
          <div className="flex items-center gap-4 text-left">
            <h2 className="font-black uppercase tracking-tight italic text-sm text-[#0033a0] text-left text-left">Diagnostic du {today}</h2>
            <div className="h-6 w-px bg-slate-100 hidden md:block"></div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[9px] font-black uppercase italic tracking-widest leading-none text-left text-left">v60.15 Fix</span>
          </div>
          <div className="flex gap-2">
            {pastedData && <button onClick={() => {setPastedData(''); setAnalysisResults({});}} className="p-2 text-slate-400 hover:text-rose-500 transition-all text-left text-left"><Trash2 size={18}/></button>}
            <button onClick={()=>setShowPdf(true)} disabled={dataSummary.count === 0} className="flex items-center gap-2 px-5 py-2.5 bg-[#0033a0] text-white rounded-xl font-bold uppercase text-[10px] shadow-xl hover:bg-blue-800 transition-all uppercase text-left text-left text-left text-left"><Eye size={14}/> Aperçu & PDF</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 print:p-0">
          {tab === 'import' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 text-left text-left text-left">
              <div className={CARD_CLASS}>
                <div className="flex items-center gap-3 mb-6 text-left text-left text-left text-left"><div className="p-3 bg-blue-50 text-[#0033a0] rounded-2xl text-left text-left text-left"><ClipboardPaste size={24}/></div><h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 text-left text-left text-left">Chargement Données Source</h3></div>
                <textarea className="w-full h-80 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:border-[#0033a0] font-mono text-[11px] mb-8 text-left text-left text-left text-left text-left text-left" value={pastedData} onChange={(e)=>setPastedData(e.target.value)} placeholder="Collez votre tableau Google Sheet ici..."/>
                
                {dataSummary.count > 0 && (
                  <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl mb-8 animate-in zoom-in duration-300">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-left"><Users style={{ color: '#0033a0' }} size={20} /></div>
                    <div className="text-left text-left text-left text-left text-left text-left text-left"><p className="text-[10px] font-black text-[#0033a0] uppercase tracking-widest leading-none text-left text-left text-left text-left">Analyse nominative</p><p className="text-sm font-bold text-slate-700 mt-1">Le système a identifié <span className="text-[#0033a0] font-black">{dataSummary.count}</span> collaborateur(s) prêt(s) pour le diagnostic.</p></div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-left text-left text-left text-left text-left">
                    <MultiSelectDropdown label="Filtrer par Mois" options={availableFilters.months} selected={selectedMonths} onToggle={(v)=>setSelectedMonths(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])} icon={Filter}/>
                    <MultiSelectDropdown label="Filtrer par Semaine" options={availableFilters.weeks} selected={selectedWeeks} onToggle={(v)=>setSelectedWeeks(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])} icon={Calendar}/>
                </div>
                <div className="mt-8 flex justify-end text-left text-left"><button onClick={handleAnalyse} disabled={loading || !pastedData} className="px-12 py-5 bg-[#0033a0] text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all uppercase">Lancer le Diagnostic</button></div>
              </div>
            </div>
          )}

          {tab === 'analyse' && (
            <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700 text-left text-left text-left text-left text-left">
              <div className="bg-[#0033a0] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden text-left text-left text-left text-left text-left text-left">
                <div className="flex items-center gap-4 mb-8 text-left text-left text-left text-left text-left">
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20 text-left text-left text-left text-left"><Building2 size={28}/></div>
                  <div className="text-left text-left text-left text-left text-left"><h3 className="text-2xl font-black uppercase tracking-tighter leading-none italic text-white text-left text-left text-left text-left">Bilan Diagnostic Agence</h3><p className="text-[9px] font-bold text-blue-200 uppercase tracking-[0.2em] mt-2 text-left text-left text-left text-left text-left text-left">Portrait de Performance ({dataSummary.range})</p></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8 text-left text-left text-left text-left text-left text-left">
                  <StatBox label="Moy. Porte/Pres" value={dataSummary.agencyAvg.rPortePres} threshold={3} isAverage={true} icon={DoorOpen} />
                  <StatBox label="Moy. Pres/Prosp" value={dataSummary.agencyAvg.rPresProsp} threshold={2} isAverage={true} icon={UserSearch} />
                  <StatBox label="Moy. Prosp/Cl" value={dataSummary.agencyAvg.rProspClose} threshold={2} isAverage={true} icon={Handshake} />
                  <StatBox label="Moy. Close/BC" value={dataSummary.agencyAvg.rClosingBC} threshold={2} isAverage={true} icon={FileCheck} />
                  <StatBox label="Moy. BC / J" value={dataSummary.agencyAvg.valBC} threshold={12} isMax={false} isAverage={true} icon={PenTool} />
                  <StatBox label="Moy. Présence" value={dataSummary.agencyAvg.attendance} threshold={100} isMax={false} suffix="%" isAverage={true} icon={CalendarCheck} />
                </div>
                <div className="grid grid-cols-1 gap-4 text-left text-left text-left">
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-left text-left text-left text-left text-left">
                    <div className="flex items-center gap-2 mb-4 text-blue-100 font-black text-[10px] uppercase tracking-widest text-left text-left text-left text-left text-left text-left"><Activity size={14}/> Diagnostic Automatique Complet</div>
                    <div className="grid grid-cols-1 gap-4">
                      {agencyAudit.map((item, i) => {
                        const IconComp = item.icon;
                        return (
                          <div key={`ag-diag-view-${i}`} className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${item.met ? 'bg-white/10 border-white/20' : 'bg-rose-500/20 border-rose-500/30'}`}>
                             <div className={`mt-1.5 p-2 rounded-lg shrink-0 ${item.met ? 'bg-emerald-400 text-emerald-900' : 'bg-rose-400 text-rose-900'}`}>
                                {IconComp && <IconComp size={20} />}
                             </div>
                             <div className="text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><span className="text-[8px] font-black uppercase opacity-60 block text-left text-left text-left text-left">{item.label}</span><p className="text-xs font-bold leading-snug text-left text-left">{item.summary}</p><p className="text-[10px] opacity-80 mt-2 italic leading-relaxed text-left text-left">{item.numericalDetail}</p></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-left text-left text-left text-left">
                     <div className="flex items-center gap-2 mb-4 text-emerald-200 font-black text-[10px] uppercase tracking-widest text-left text-left text-left text-left"><ThumbsUp size={14}/> Directives Agence</div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10 min-h-[150px] text-left text-left text-left">
                        {agencyComment ? (
                           <p className="text-sm font-bold text-white italic leading-relaxed whitespace-pre-wrap text-left text-left text-left text-left text-left">{agencyComment}</p>
                        ) : (
                           <p className="text-blue-200/50 text-xs italic text-left text-left text-left text-left text-left text-left text-left text-left">Saisissez vos directives dans l'onglet coaching.</p>
                        )}
                     </div>
                  </div>
                </div>
              </div>

              {dataSummary.collabs.map((c) => (
                <div key={`card-diag-col-${c.name}`} className={CARD_CLASS}>
                  <div className="flex items-center gap-4 mb-8 pb-4 border-b border-blue-50 text-left text-left text-left text-left text-left text-left">
                    <div className="w-14 h-14 rounded-2xl bg-[#0033a0] text-white flex items-center justify-center font-black text-2xl shadow-xl text-left text-left text-left text-left text-left text-left">{c.name[0]}</div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#0033a0] text-left text-left text-left text-left text-left">{c.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8 text-left text-left text-left text-left text-left text-left">
                    <StatBox label="Porte / Pres" value={c.averages.rPortePres} threshold={3} icon={DoorOpen} />
                    <StatBox label="Pres / Prosp" value={c.averages.rPresProsp} threshold={2} icon={UserSearch} />
                    <StatBox label="Prosp / Cl" value={c.averages.rProspClose} threshold={2} icon={Handshake} />
                    <StatBox label="Close / BC" value={c.averages.rClosingBC} threshold={2} icon={FileCheck} />
                    <StatBox label="BC / J" value={c.averages.valBC} threshold={12} isMax={false} icon={PenTool} />
                    <StatBox label="Présence" value={c.averages.attendance} threshold={100} isMax={false} suffix="%" icon={CalendarCheck} />
                  </div>
                  <div className="p-6 bg-blue-50/40 border border-blue-100 rounded-3xl shadow-inner mb-6 text-left text-left text-left text-left">
                      <div className="flex items-center gap-2 mb-4 text-[#0033a0] font-black text-[10px] uppercase tracking-widest text-left text-left text-left text-left"><Activity size={14}/> Diagnostic Nominatif Complet</div>
                      <div className="space-y-4 text-left text-left">
                        {(analysisResults[c.name] || []).map((item, i) => {
                          const IconC = item.icon;
                          return (
                            <div key={`diag-res-v-${c.name}-${i}`} className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${item.met ? 'bg-white border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                              <div className={`mt-1.5 p-2 rounded-lg shrink-0 ${item.met ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                 {IconC && <IconC size={20} />}
                              </div>
                              <div className="text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><span className="text-[8px] font-black uppercase opacity-40 block text-left text-left text-left text-left">{item.label}</span><p className="text-xs font-black leading-snug text-left text-left text-left text-left text-left">{item.summary}</p><p className="text-[10px] font-bold text-slate-500 mt-2 italic leading-relaxed text-left text-left text-left text-left">{item.numericalDetail}</p></div>
                            </div>
                          );
                        })}
                      </div>
                  </div>
                  <div className="p-6 bg-emerald-50/40 border border-emerald-100 rounded-3xl shadow-inner text-left text-left text-left text-left">
                    <div className="flex items-center gap-2 mb-3 text-emerald-700 font-black text-[10px] uppercase tracking-widest text-left text-left text-left text-left"><ThumbsUp size={14}/> Directives Manager Nominatives</div>
                    <p className="text-sm font-bold text-emerald-900 italic leading-relaxed whitespace-pre-wrap text-left text-left text-left text-left text-left text-left">{managerComments[c.name.toLowerCase().replace(/\s/g, '')] || "Saisissez vos conseils dans l'onglet coaching."}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'config' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-left text-left text-left text-left text-left text-left text-left">
              <div className={CARD_CLASS}>
                 <div className="flex items-center gap-4 mb-8 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                    <div className="p-3 bg-indigo-50 text-[#0033a0] rounded-2xl text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><Building2 size={24}/></div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-[#0033a0] text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Directives Agence Globales</h3>
                 </div>
                 <CoachingTextarea label="Message global (Affiché Diagnostic Page 2)" value={agencyComment} onChange={setAgencyComment} placeholder="Objectifs globaux (850 chars max)..." maxLength={850}/>
              </div>
              <div className="space-y-4 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                 <div className="flex items-center gap-4 mb-6 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                    <div className="p-3 bg-blue-50 text-[#0033a0] rounded-2xl text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><UserCog size={24}/></div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Diagnostic & Coaching par Collaborateur</h3>
                 </div>
                 {[...new Set(rawEntries.map(e => e.name))].map(name => {
                    const key = name.toLowerCase().replace(/\s/g, '');
                    return (
                      <div key={`input-diag-row-${key}`} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                         <div className="flex items-center gap-4 min-w-[200px] text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">{name[0]}</div>
                            <span className="font-black uppercase text-slate-900 tracking-tight text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">{name}</span>
                         </div>
                         <CoachingTextarea value={managerComments[key]} onChange={(val) => setManagerComments(prev => ({...prev, [key]: val}))} placeholder={`Diagnostic & conseils pour ${name}...`} maxLength={500}/>
                      </div>
                    );
                 })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL APERÇU (Portrait A4 Standard) */}
      {showPdf && (
        <div className="fixed inset-0 z-[100] bg-blue-900/95 backdrop-blur-xl flex flex-col p-4 animate-in fade-in duration-300 overflow-hidden text-left print:hidden text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
          <div className="flex justify-between text-white mb-4 px-4 max-w-5xl mx-auto w-full text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
            <div className="flex items-center gap-3 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
              <div className="p-2 bg-white rounded-lg text-[#0033a0] shadow-lg text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><Printer size={20}/></div>
              <span className="font-black uppercase tracking-widest italic text-xs text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Aperçu Diagnostic Portrait A4</span>
            </div>
            <div className="flex items-center gap-4 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
               <button onClick={handlePrint} className="px-6 py-3 bg-white text-[#0033a0] font-black rounded-xl flex items-center gap-2 shadow-2xl text-[10px] uppercase hover:bg-blue-50 transition-all text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">Impression Système</button>
               <button onClick={()=>setShowPdf(false)} className="p-2 bg-white/10 rounded-full hover:bg-rose-50 text-white transition-all text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left"><X size={24}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-200/20 p-4 flex flex-col items-center text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left">
            <div className="bg-white shadow-2xl p-0 text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left text-left" style={{ width: A4_WIDTH }}>
               <ReportLayout dataSummary={dataSummary} agencyAudit={agencyAudit} analysisResults={analysisResults} agencyComment={agencyComment} managerComments={managerComments} />
            </div>
          </div>
        </div>
      )}

      {/* CACHÉ POUR L'IMPRESSION */}
      <div className="hidden">
         <div id="print-layout-diag-final">
            <ReportLayout dataSummary={dataSummary} agencyAudit={agencyAudit} analysisResults={analysisResults} agencyComment={agencyComment} managerComments={managerComments} />
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 20px; }
        .print-page { 
          width: 210mm !important; 
          min-height: 297mm !important; 
          padding: 15mm !important; 
          display: flex !important; 
          flex-direction: column !important; 
          box-sizing: border-box !important; 
          background: white !important; 
          text-align: left !important; 
          overflow: visible !important; 
          position: relative !important; 
        }
        @media print {
          @page { size: A4 portrait; margin: 0 !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0 !important; }
          .page-break { display: block; height: 1px; page-break-after: always; visibility: hidden; clear: both; }
          .print-page { 
            display: flex !important; 
            visibility: visible !important; 
            page-break-after: always !important; 
            width: 210mm !important; 
            min-height: 297mm !important; 
            border: none !important; 
            margin: 0 !important;
            padding: 15mm !important;
            flex-shrink: 0 !important;
          }
          .print-page:last-child { page-break-after: avoid !important; }
        }
      `}} />
    </div>
  );
}
