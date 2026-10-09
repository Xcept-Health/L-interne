export type Tone='ok'|'wa'|'ko'|'in'
export interface Doc{use:string[];eq:string[];vars?:string[];read:[string,string,Tone][];ex:string;limits:string[];refs:string[]}
export interface CalcDef{id:string;spec:string;code:string;name:string;sub:string;doc:Doc}

/* ---------- Utilitaires ---------- */
export const DAY=864e5
export const num=(s:string)=>{const v=parseFloat(s.replace(',','.'));return Number.isFinite(v)?v:NaN}
export const fx=(n:number,d=1)=>n.toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d})
/** 'aaaa-mm-jj' → timestamp UTC (évite les décalages d'heure d'été) */
export const pd=(s:string):number|null=>{if(!s)return null;const[y,m,d]=s.split('-').map(Number);return y&&m&&d?Date.UTC(y,m-1,d):null}
export const fd=(t:number)=>new Date(t).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})
export const fds=(t:number)=>new Date(t).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})
export const todayIso=()=>{const n=new Date();return`${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`}
export const saj=(j:number,u='SA')=>`${Math.floor(j/7)} ${u} + ${j%7} j`
export const tri=(j:number)=>j<98?'1er trimestre (jusqu\'à 13+6 SA)':j<196?'2e trimestre (14+0 à 27+6 SA)':'3e trimestre (à partir de 28+0 SA)'

/* ---------- Datation ---------- */
export interface Dat{ddr:number|null;cy:number;ed:number|null;ew:number;ej:number;cc:number|null}
/** Début de grossesse équivalent à une DDR « à 28 jours » */
export function startOf(m:'ddr'|'echo'|'conc',o:Dat):number|null{
 if(m==='ddr'){if(o.ddr==null)return null;const c=Number.isFinite(o.cy)?o.cy:28;return o.ddr+(c-28)*DAY}
 if(m==='echo'){if(o.ed==null||!Number.isFinite(o.ew))return null;const j=Number.isFinite(o.ej)?o.ej:0;return o.ed-(o.ew*7+j)*DAY}
 return o.cc==null?null:o.cc-14*DAY}
/** Seuil de discordance (jours) DDR/écho pour redater — ACOG CO 700 */
export const thr=(ag:number)=>ag<63?5:ag<112?7:ag<154?10:ag<196?14:21
export function term(j:number):{label:string;tone:Tone;note:string}{
 if(j<22*7)return{label:'Avant 22 SA',tone:'in',note:'Seuil de viabilité variable selon les pays et les services : à confirmer avec ton protocole local.'}
 if(j<28*7)return{label:'Prématurité extrême',tone:'ko',note:'Naissance avant 28 SA (définition OMS).'}
 if(j<32*7)return{label:'Grande prématurité',tone:'ko',note:'Naissance de 28+0 à 31+6 SA (OMS).'}
 if(j<37*7)return{label:'Prématurité modérée à tardive',tone:'wa',note:'Naissance de 32+0 à 36+6 SA (OMS).'}
 if(j<39*7)return{label:'Terme précoce',tone:'in',note:'37+0 à 38+6 SA (ACOG).'}
 if(j<41*7)return{label:'Terme',tone:'ok',note:'39+0 à 40+6 SA (ACOG).'}
 if(j<42*7)return{label:'Terme tardif',tone:'wa',note:'41+0 à 41+6 SA : surveillance renforcée selon le protocole.'}
 return{label:'Post-terme',tone:'ko',note:'À partir de 42+0 SA.'}}

/* ---------- IMC & prise de poids ---------- */
export type IomK='under'|'normal'|'over'|'obese'
export function imcCat(i:number):{k:string;tone:Tone;iom:IomK}{
 if(i<18.5)return{k:'Insuffisance pondérale',tone:'in',iom:'under'}
 if(i<25)return{k:'Poids normal',tone:'ok',iom:'normal'}
 if(i<30)return{k:'Surpoids',tone:'wa',iom:'over'}
 if(i<35)return{k:'Obésité modérée (classe I)',tone:'ko',iom:'obese'}
 if(i<40)return{k:'Obésité sévère (classe II)',tone:'ko',iom:'obese'}
 return{k:'Obésité massive (classe III)',tone:'ko',iom:'obese'}}
/** IOM 2009 : gain total à terme (kg) et rythme hebdomadaire aux 2e-3e trimestres (kg/sem) */
export const IOM:Record<IomK,{n:string;t:[number,number];r:[number,number]}>={
 under:{n:'IMC < 18,5',t:[12.5,18],r:[.44,.58]},
 normal:{n:'IMC 18,5 – 24,9',t:[11.5,16],r:[.35,.50]},
 over:{n:'IMC 25 – 29,9',t:[7,11.5],r:[.23,.33]},
 obese:{n:'IMC ≥ 30',t:[5,9],r:[.17,.27]}}
/** Fourchette de gain attendue à `w` semaines (approximation décrite dans la fiche) */
export function expected(w:number,k:IomK):[number,number]{
 const{r}=IOM[k]
 if(w<=13){const f=w/13;return[.5*f,2*f]}
 return[.5+r[0]*(w-13),2+r[1]*(w-13)]}

/* ---------- Fiches ---------- */
export const CALCS:CalcDef[]=[
{id:'ga',spec:'gyneco',code:'AG',name:'Âge gestationnel',sub:'SA + jours à une date donnée, depuis la DDR, l\'écho ou la conception',doc:{
 use:['Savoir où en est la grossesse (SA + jours) à une date donnée.','Situer le trimestre et le terme pour choisir le calendrier de suivi, les examens à proposer et la conduite en cas de menace d\'accouchement.'],
 eq:['AG (jours) = date de référence − début de grossesse','Début de grossesse :','  • DDR : DDR + (durée du cycle − 28 j)','  • Écho : date de l\'écho − AG à l\'écho','  • Conception : date de conception − 14 j','SA = partie entière de (AG ÷ 7) ; jours = reste','SG = SA − 2'],
 vars:['SA : semaines d\'aménorrhée, comptées depuis le 1er jour des dernières règles.','SG : semaines de grossesse, comptées depuis la conception (≈ SA − 2).'],
 read:[['< 37+0 SA','Prématurité (OMS : extrême < 28, grande 28–31+6, modérée à tardive 32–36+6)','wa'],['37+0 – 38+6','Terme précoce','in'],['39+0 – 40+6','Terme','ok'],['41+0 – 41+6','Terme tardif : surveillance renforcée','wa'],['≥ 42+0','Post-terme','ko']],
 ex:'DDR le 1er janvier, cycle de 28 j, date de référence le 1er avril → 90 jours = 12 SA + 6 j (1er trimestre).',
 limits:['La DDR suppose une ovulation au 14e jour d\'un cycle de 28 j : peu fiable si cycles irréguliers, contraception hormonale récente ou allaitement.','DDR oubliée ou imprécise : privilégier l\'échographie du 1er trimestre (longueur cranio-caudale).','La correction par la durée du cycle est une approximation.'],
 refs:['ACOG Committee Opinion n° 700. Methods for estimating the due date. Obstet Gynecol 2017.','ACOG Committee Opinion n° 579. Definition of term pregnancy. Obstet Gynecol 2013.','OMS. Born too soon: the global action report on preterm birth. Genève, 2012.']}},
{id:'dpa',spec:'gyneco',code:'DPA',name:'Date prévue d\'accouchement',sub:'Estimation depuis la DDR, comparée à l\'écho du 1er trimestre',doc:{
 use:['Annoncer une date repère à la patiente et organiser le suivi (consultations, échographies, terme).','Comparer la DDR et l\'échographie précoce pour décider quelle date retenir.'],
 eq:['DPA (DDR) = DDR + 280 jours + (durée du cycle − 28 j)','Règle de Naegele : DDR + 7 jours − 3 mois (+ 1 an), même résultat à quelques jours près selon la longueur des mois','DPA (écho) = date de l\'écho + (280 − AG à l\'écho en jours)','Écart = |DPA (écho) − DPA (DDR)|'],
 vars:['280 jours = 40 SA, durée moyenne d\'une grossesse comptée depuis la DDR.'],
 read:[['AG écho ≤ 8+6','Redater si écart > 5 jours','in'],['9+0 – 15+6','Redater si écart > 7 jours','in'],['16+0 – 21+6','Redater si écart > 10 jours','in'],['22+0 – 27+6','Redater si écart > 14 jours','in'],['≥ 28+0','Redater si écart > 21 jours','in']],
 ex:'DDR le 10 mars, cycle de 28 j → DPA le 15 décembre (280 jours plus tard).',
 limits:['La DPA est une estimation : seule une petite minorité des accouchements survient exactement à cette date.','Fiable seulement si la DDR est certaine et les cycles réguliers.','La datation échographique est la plus précise au 1er trimestre (LCC entre 7 et 13+6 SA) ; plus tard, la biométrie est moins précise.','Seuils d\'écart issus de l\'ACOG : compare avec le protocole de ton service.'],
 refs:['ACOG Committee Opinion n° 700. Methods for estimating the due date. Obstet Gynecol 2017.','Règle de Naegele : règle classique d\'obstétrique (début du XIXe siècle).']}},
{id:'imc',spec:'gyneco',code:'IMC',name:'IMC',sub:'Poids ÷ taille², catégorie OMS et poids de référence',doc:{
 use:['Classer la corpulence (maigreur, normal, surpoids, obésité).','En obstétrique : l\'IMC d\'avant la grossesse sert à fixer le gain de poids recommandé (voir « Prise pondérale »).'],
 eq:['IMC = poids (kg) ÷ taille² (m²)','Poids de référence = IMC cible × taille²  (cibles : 18,5 et 24,9)'],
 read:[['< 18,5','Insuffisance pondérale','in'],['18,5 – 24,9','Poids normal','ok'],['25 – 29,9','Surpoids','wa'],['30 – 34,9','Obésité classe I','ko'],['35 – 39,9','Obésité classe II','ko'],['≥ 40','Obésité classe III','ko']],
 ex:'60 kg, 1,65 m → 60 ÷ 2,7225 = 22,0 kg/m² (poids normal).',
 limits:['Ne distingue pas masse grasse et masse maigre (sportif musclé, œdèmes, ascite).','Pendant la grossesse, l\'IMC actuel n\'est pas interprétable : utiliser l\'IMC d\'avant la grossesse ou du 1er trimestre.','Chez l\'enfant, on utilise des courbes de croissance, pas ces seuils.'],
 refs:['OMS. Obesity: preventing and managing the global epidemic. WHO Technical Report Series 894. Genève, 2000.','Quetelet A. Sur l\'homme et le développement de ses facultés. Paris, 1835.']}},
{id:'apgar',spec:'gyneco',code:'AP',name:'Score d\'Apgar',sub:'Cinq critères notés de 0 à 2, à 1, 5 et 10 minutes',doc:{
 use:['Résumer l\'adaptation du nouveau-né à la vie extra-utérine.','Suivre l\'évolution entre 1, 5 et 10 minutes de vie et la transmettre dans le dossier.'],
 eq:['Apgar = FC + respiration + tonus + réactivité + coloration','Chaque critère vaut 0, 1 ou 2 → total sur 10','À noter à 1, 5 et 10 minutes de vie'],
 read:[['7 – 10','Bonne adaptation à la vie extra-utérine','ok'],['4 – 6','Dépression modérée : stimulation, surveillance, soutien selon la clinique','wa'],['0 – 3','Dépression sévère : en général une réanimation néonatale est en cours','ko']],
 ex:'FC 120 (2) + cri vigoureux (2) + mouvements actifs (2) + grimace (1) + corps rose, extrémités bleues (1) = 8.',
 limits:['Ne sert pas à décider de réanimer : la réanimation commence sans attendre la 1re minute si le nouveau-né en a besoin.','Un score bas à 1 minute est peu prédictif seul ; l\'évolution à 5 et 10 minutes est plus informative.','Dépend de l\'examinateur, de la prématurité, des médicaments reçus par la mère.'],
 refs:['Apgar V. A proposal for a new method of evaluation of the newborn infant. Curr Res Anesth Analg 1953.','AAP Committee on Fetus and Newborn, ACOG Committee on Obstetric Practice. The Apgar score. Pediatrics 2015.']}},
{id:'bishop',spec:'gyneco',code:'BI',name:'Score de Bishop',sub:'État du col et de la présentation avant déclenchement',doc:{
 use:['Évaluer si le col est « favorable » avant un déclenchement artificiel du travail.','Choisir entre maturation cervicale (col défavorable) et ocytocine (col favorable).'],
 eq:['Bishop = dilatation + effacement + consistance + position du col + hauteur de la présentation','Total de 0 à 13'],
 vars:['Dilatation : 0 / 1–2 / 3–4 / ≥ 5 cm → 0 à 3 points.','Effacement : 0–30 / 40–50 / 60–70 / ≥ 80 % → 0 à 3 points.','Consistance : ferme, moyenne, molle → 0 à 2 points.','Position : postérieur, intermédiaire, antérieur → 0 à 2 points.','Présentation : haute et mobile, amorcée, appliquée, engagée → 0 à 3 points.'],
 read:[['0 – 5','Col défavorable : envisager une maturation cervicale','wa'],['6 – 7','Col intermédiaire : à discuter selon le protocole','in'],['8 – 13','Col favorable : le déclenchement a des chances de succès proches d\'un travail spontané','ok']],
 ex:'Dilatation 3 cm (2) + effacement 50 % (1) + consistance moyenne (1) + position intermédiaire (1) + présentation amorcée (1) = 6.',
 limits:['Les seuils « favorable / défavorable » varient selon les protocoles (≥ 6, ≥ 7 ou ≥ 8) : vérifie celui de ton service.','Examen subjectif : variabilité entre examinateurs.','Le score n\'indique pas à lui seul s\'il faut déclencher : indications et contre-indications se jugent à part.'],
 refs:['Bishop EH. Pelvic scoring for elective induction. Obstet Gynecol 1964.','ACOG Practice Bulletin n° 107. Induction of labor. Obstet Gynecol 2009.','HAS / CNGOF. Déclenchement artificiel du travail à partir de 37 SA. Recommandations, 2008.']}},
{id:'choc',spec:'gyneco',code:'IC',name:'Indice de choc obstétrical',sub:'FC ÷ PAS pour repérer un retentissement hémodynamique',doc:{
 use:['Repérer tôt un retentissement hémodynamique, surtout dans l\'hémorragie du post-partum, où la PA peut rester « normale » longtemps.','Suivre l\'évolution sous traitement : répéter la mesure.'],
 eq:['Indice de choc = FC (bpm) ÷ PAS (mmHg)'],
 vars:['FC : fréquence cardiaque ; PAS : pression artérielle systolique.'],
 read:[['< 0,7','Valeur habituelle hors grossesse (0,5–0,7)','in'],['0,7 – 0,9','Plage attendue chez la femme enceinte ou en post-partum','ok'],['0,9 – 1,0','Alerte : surveillance rapprochée, chercher une hémorragie','wa'],['≥ 1,0','État de choc probable : prise en charge urgente','ko']],
 ex:'FC 110, PAS 90 → 110 ÷ 90 = 1,22 : état de choc probable.',
 limits:['Les seuils varient selon les études : pas de consensus unique.','Une HTA (pré-éclampsie), des bêtabloquants, la douleur, la fièvre ou l\'anxiété faussent l\'indice ; une PAS élevée peut masquer une hémorragie.','Une mesure isolée compte moins que la tendance.','Ne remplace ni l\'estimation des pertes sanguines ni le protocole du service.'],
 refs:['Allgöwer M, Burri C. « Schockindex ». Dtsch Med Wochenschr 1967.','Le Bas A et al. Use of the obstetric shock index as an adjunct in identifying significant blood loss in patients with massive postpartum hemorrhage. Int J Gynaecol Obstet 2014.','Nathan HL et al. Shock index: an effective predictor of outcome in postpartum haemorrhage? BJOG 2015.']}},
{id:'pp',spec:'gyneco',code:'PP',name:'Prise pondérale',sub:'Gain de poids comparé aux recommandations IOM',doc:{
 use:['Vérifier que le gain de poids est dans la fourchette recommandée selon l\'IMC d\'avant la grossesse.','Repérer un gain insuffisant (risque de petit poids de naissance) ou excessif (macrosomie, HTA, diabète gestationnel).'],
 eq:['Gain = poids actuel − poids de référence','IMC de référence = poids de référence ÷ taille²','Fourchette attendue (SA ≤ 13) = (0,5 à 2 kg) × SA ÷ 13','Fourchette attendue (SA > 13) = 0,5 + rmin × (SA − 13)  à  2 + rmax × (SA − 13)'],
 vars:['r : rythme hebdomadaire recommandé aux 2e et 3e trimestres selon l\'IMC de référence (tableau ci-dessous).','Les valeurs sont celles de l\'IOM 2009 pour une grossesse unique.'],
 read:[['IMC < 18,5','12,5 – 18 kg à terme · 0,44 – 0,58 kg/sem','in'],['IMC 18,5 – 24,9','11,5 – 16 kg à terme · 0,35 – 0,50 kg/sem','ok'],['IMC 25 – 29,9','7 – 11,5 kg à terme · 0,23 – 0,33 kg/sem','wa'],['IMC ≥ 30','5 – 9 kg à terme · 0,17 – 0,27 kg/sem','ko']],
 ex:'60 kg avant la grossesse, 1,65 m (IMC 22,0, normal) ; 68 kg à 28 SA → +8 kg. Fourchette : 0,5 + 0,35 × 15 = 5,75 kg à 2 + 0,50 × 15 = 9,5 kg → dans la fourchette.',
 limits:['Valable pour une grossesse unique : les gémellaires ont d\'autres cibles.','La fourchette « attendue à ce jour » est une approximation déduite des rythmes IOM, pas une valeur officielle.','Le poids de référence doit être mesuré avant la grossesse ou avant 14 SA.','Une prise brutale avec œdèmes, HTA ou protéinurie doit faire évoquer une pré-éclampsie.'],
 refs:['Institute of Medicine, National Research Council. Weight gain during pregnancy: reexamining the guidelines. Washington DC : National Academies Press, 2009.','ACOG Committee Opinion n° 548. Weight gain during pregnancy. Obstet Gynecol 2013.']}},
{id:'conv',spec:'gyneco',code:'CV',name:'Conversion de grossesse',sub:'Semaines, jours et mois, avec convention explicite',doc:{
 use:['Passer de « 28 SA + 3 j » à des jours ou à des mois pour expliquer à la patiente.','Comprendre l\'écart entre « 9 mois » et 40 ou 41 SA.'],
 eq:['Jours = SA × 7 + j','Mois civils = jours ÷ 30,4375  (365,25 ÷ 12)','Mois lunaires = jours ÷ 28','Base conception : jours − 14 (SG = SA − 2)'],
 vars:['Mois révolus = partie entière ; le mois en cours est le suivant.'],
 read:[['40 SA','280 j · ≈ 9,2 mois civils · 10 mois lunaires','in'],['20 SA','140 j · ≈ 4,6 mois civils · 5 mois lunaires','in'],['9 mois civils','≈ 274 j ≈ 39 SA + 1 j','in']],
 ex:'28 SA + 3 j = 199 jours ≈ 6,5 mois civils (base aménorrhée).',
 limits:['Aucune convention universelle : toujours préciser SA ou SG, et le type de mois.','En clinique, raisonner en SA + jours ; les mois servent à la communication avec la patiente.'],
 refs:['Convention de calcul, sans recommandation officielle : les sociétés savantes expriment l\'âge gestationnel en SA et en jours.']}}
]