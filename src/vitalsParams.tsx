import {useEffect,useRef,useState} from 'react'
import type {ReactNode,Ref} from 'react'
import {Icon} from './ui'
import Slider from './Slider'
import type {SL} from './Slider'
import {Empty,Learn,Scale,Verdict} from './Calc'
import {fx,imcCat,num} from './calcdata'
import type {Doc,Tone} from './calcdata'
import type {NewR,Reading} from './Vitals'

export interface VP{rd:Reading[];add:(r:NewR)=>void;del:(id:number)=>void}

const buzz=(n=10)=>{try{navigator.vibrate?.(n)}catch{}}
const when=(t:number)=>new Date(t).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})
const ds=(n:number)=>String(n).replace('.',',')

/** Affichage court d'une mesure (écran d'accueil du Suivi) */
export function fmtR(r:Reading):string{
 switch(r.k){
  case 'pa':return `${r.v}/${r.d}`
  case 't':return fx(r.v,1)
  case 'glyc':return fx(r.v,2)
  case 'obs':return r.x??''
  default:return ds(r.v)}}

/** Réglage mémorisé sur l'appareil (unité, site, contexte) */
function usePref<T extends string>(k:string,i:T){
 const rd=():Record<string,string>=>{try{return JSON.parse(localStorage.getItem('rv-vprefs')||'{}')}catch{return {}}}
 const[v,s]=useState<T>(()=>(rd()[k] as T|undefined)??i)
 const set=(x:T)=>{s(x);try{localStorage.setItem('rv-vprefs',JSON.stringify({...rd(),[k]:x}))}catch{}}
 return[v,set] as const}

function useSaved(){
 const[s,set]=useState(false),t=useRef(0)
 useEffect(()=>()=>clearTimeout(t.current),[])
 return[s,()=>{buzz(25);set(true);clearTimeout(t.current);t.current=window.setTimeout(()=>set(false),3000)}] as const}

/* ====== Briques ====== */

/** Nettoie la saisie : chiffres seuls (et une seule virgule si `dec`), longueur limitée. */
function clean(s:string,dec:boolean,max:number):string{
 let t=s.replace(dec?/[^\d,.]/g:/\D/g,'').replace(/\./g,',')
 if(dec){const i=t.indexOf(',');if(i>=0)t=t.slice(0,i+1)+t.slice(i+1).replace(/,/g,'');if(t.startsWith(','))t='0'+t}
 let n=0,o=''
 for(const c of t){if(c===','){o+=c;continue}if(n<max){o+=c;n++}}
 return o}

/** Saisie d'une valeur : le clavier du téléphone (numérique ou décimal) + un curseur à glisser.
 *  `norm` permet de reformater la saisie (ex. 385 devient 38,5). `onFull` est appelé quand le nombre de chiffres max est tapé. */
export function Entry({l,u,v,on,dec=false,max=4,ph='0',norm,sl,inputRef,onEnter,onFull}:{l:string;u?:string;v:string;on:(s:string)=>void;dec?:boolean;max?:number;ph?:string;norm?:(s:string)=>string;sl?:SL;inputRef?:Ref<HTMLInputElement>;onEnter?:()=>void;onFull?:()=>void}){
 const change=(raw:string)=>{
  let t=clean(raw,dec,max);if(norm)t=norm(t)
  on(t)
  if(onFull&&t.replace(',','').length>=max)onFull()}
 const x=num(v)
 return <div className="entw">
  <label className="ent"><span className="dl">{l}</span>
   <input ref={inputRef} inputMode={dec?'decimal':'numeric'} enterKeyHint={onEnter?'next':'done'} autoComplete="off" autoCorrect="off" spellCheck={false} aria-label={u?`${l} (${u})`:l}
    value={v} placeholder={ph} onChange={e=>change(e.target.value)}
    onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();if(onEnter)onEnter();else (e.target as HTMLInputElement).blur()}}}/>
   {u&&<em>{u}</em>}</label>
  {sl&&<Slider l={sl.l} u={u} min={sl.min} max={sl.max} step={sl.step} def={sl.def} v={Number.isFinite(x)&&v!==''?x:null} on={on}/>}
 </div>}

/** Réglage discret : une ligne (libellé + valeur), la liste native s'ouvre au toucher. */
export function Pick<T extends string>({l,v,on,o,off}:{l:string;v:T;on:(t:T)=>void;o:[T,string,string][];off?:boolean}){
 const cur=o.find(x=>x[0]===v)
 return <label className={'pk'+(off?' off':'')}><span className="pl">{l}</span><b>{cur?.[1]}</b><span className="pc" aria-hidden="true"><Icon n="chev" s={16}/></span>
  <select value={v} disabled={off} onChange={e=>on(e.target.value as T)}>{o.map(([k,,t])=><option key={k} value={k}>{t}</option>)}</select></label>}
const two=<T extends string>(o:[T,string][])=>o.map(([k,t])=>[k,t,t] as [T,string,string])

const Live=({children}:{children?:ReactNode})=><div className="live" aria-live="polite">{children}</div>
const Hint=({t}:{t:string})=><p className="hnt lv">{t}</p>
const Sub=({t}:{t:string})=><p className="sub">{t}</p>

function Hist({k,rd,del,main,sub}:{k:string;rd:Reading[];del:(id:number)=>void;main:(r:Reading)=>ReactNode;sub?:(r:Reading)=>string}){
 const h=rd.filter(r=>r.k===k).slice(0,15)
 return <><h3 className="lh" style={{marginTop:24}}>Dernières mesures</h3>
  {h.length===0?<Empty t="Aucune mesure enregistrée pour l'instant."/>
  :<ul className="hl">{h.map(r=>{const s=sub?.(r);return <li key={r.id} className="hi"><div className="tx"><b>{main(r)}</b><span>{when(r.t)}{s?` · ${s}`:''}</span></div>
   <button type="button" className="x" aria-label="Supprimer cette mesure" onClick={()=>confirm('Supprimer cette mesure ?')&&del(r.id)}><Icon n="close" s={18}/></button></li>})}</ul>}</>}

/** Onglets Mesurer / Comprendre, identiques à ceux de la FC */
function Shell({doc,children}:{doc:Doc;children:ReactNode}){
 const[tab,setTab]=useState<'m'|'u'>('m')
 return <>
  <div className="seg">{([['m','Mesurer'],['u','Comprendre']] as ['m'|'u',string][]).map(([k,l])=>
   <button key={k} type="button" className={tab===k?'on':''} onClick={()=>setTab(k)}><span>{l}</span>{tab===k&&<i/>}</button>)}</div>
  <div hidden={tab!=='m'}>{children}</div>
  <div hidden={tab!=='u'}><Learn doc={doc}/></div></>}

const imcOf=(kg:number,cm:number)=>kg/((cm/100)*(cm/100))
const lastOf=(rd:Reading[],k:string)=>rd.find(r=>r.k===k)

/* ====== Pression artérielle ====== */
const PADOC:Doc={
 use:['Mesurer la pression exercée par le sang sur la paroi des artères : systolique (PAS, pendant la contraction du cœur) et diastolique (PAD, entre deux battements).','Repérer une hypotension (risque de choc) ou une hypertension, à interpréter avec la clinique.'],
 eq:['PAM = (PAS + 2 × PAD) ÷ 3','Pression pulsée = PAS − PAD'],
 vars:['Patient au repos depuis 5 minutes, assis, dos soutenu, bras à hauteur du cœur, brassard adapté à la taille du bras.','À la première mesure, prendre la pression aux deux bras et retenir le bras où la valeur est la plus élevée.'],
 read:[['Optimale','< 120 et < 80','ok'],['Normale','120 – 129 et/ou 80 – 84','ok'],['Normale haute','130 – 139 et/ou 85 – 89','in'],['HTA grade 1','140 – 159 et/ou 90 – 99','wa'],['HTA grade 2','160 – 179 et/ou 100 – 109','wa'],['HTA grade 3','≥ 180 et/ou ≥ 110','ko'],['Hypotension (seuil indicatif)','PAS < 90 ou PAM < 65 mmHg','ko']],
 ex:'PAS 120 et PAD 80 mmHg → PAM = (120 + 2 × 80) ÷ 3 = 93 mmHg : pression normale.',
 limits:['Seuils de l\'adulte, en consultation. Chez l\'enfant, la pression se lit sur des percentiles selon l\'âge, le sexe et la taille.','Une valeur isolée ne suffit pas à poser le diagnostic d\'HTA : confirmer sur plusieurs mesures.','Brassard trop petit : valeurs surestimées. Brassard trop grand : valeurs sous-estimées.','En urgence, juger le patient avant le chiffre : un patient hypertendu connu peut être en choc avec une PAS « normale ».','Le seuil d\'hypotension est une règle pratique de l\'app : vérifie avec ton protocole et la pression habituelle du patient.'],
 refs:['Williams B et al. 2018 ESC/ESH Guidelines for the management of arterial hypertension. Eur Heart J 2018;39:3021-3104.','Evans L et al. Surviving Sepsis Campaign: international guidelines for management of sepsis and septic shock 2021. Intensive Care Med 2021;47:1181-1247.']}

function paClass(S:number,D:number):[Tone,string,string]{
 const M=(S+2*D)/3
 if(S<90||M<65)return['ko','Hypotension','PAS inférieure à 90 mmHg ou PAM inférieure à 65 mmHg : évaluer la perfusion (conscience, extrémités, diurèse) et chercher un état de choc (hémorragie, sepsis, cause cardiaque).']
 if(S>=180||D>=110)return['ko','HTA de grade 3','Confirmer par une seconde mesure au repos. Rechercher une souffrance d\'organe (céphalée intense, douleur thoracique, dyspnée, déficit neurologique, trouble visuel) : si présente, c\'est une urgence hypertensive.']
 if(S>=160||D>=100)return['wa','HTA de grade 2','Confirmer sur plusieurs mesures au repos, puis avis médical pour la suite.']
 if(S>=140&&D<90)return['wa','HTA systolique isolée','PAS élevée avec PAD normale : fréquente chez le sujet âgé. À confirmer sur plusieurs mesures.']
 if(S>=140||D>=90)return['wa','HTA de grade 1','Mesure isolée : à confirmer (mesures répétées, automesure ou MAPA) avant tout diagnostic.']
 if(S>=130||D>=85)return['in','Normale haute','Surveillance et mesures répétées.']
 if(S>=120||D>=80)return['ok','Pression normale','Dans la plage habituelle de l\'adulte.']
 return['ok','Pression optimale','Dans la plage habituelle de l\'adulte.']}

export function PA({rd,add,del}:VP){
 const[sys,setSys]=useState(''),[dia,setDia]=useState(''),[saved,flash]=useSaved()
 const dr=useRef<HTMLInputElement>(null)
 const S=num(sys),D=num(dia)
 const okS=Number.isFinite(S)&&S>0,okD=Number.isFinite(D)&&D>0
 const has=okS&&okD&&S>D,bad=okS&&okD&&S<=D
 const odd=has&&(S<50||S>300||D<20||D>200)
 const save=()=>{add({k:'pa',v:S,d:D,m:'manuel'});setSys('');setDia('');flash()}
 const v=has?paClass(S,D):null,M=has?Math.round((S+2*D)/3):0
 return <Shell doc={PADOC}><div className="frm">
  <Entry l="Systolique" u="mmHg" v={sys} on={setSys} max={3} sl={{min:60,max:240,step:1,def:120}} onFull={()=>dr.current?.focus()} onEnter={()=>dr.current?.focus()}/>
  <Entry l="Diastolique" u="mmHg" v={dia} on={setDia} max={3} sl={{min:30,max:140,step:1,def:80}} inputRef={dr}/>
  <Live>{saved?<Verdict tone="ok" t="Mesure enregistrée sur cet appareil"/>
   :has&&v?<><Verdict tone={v[0]} t={v[1]}>{odd?'Valeur inhabituelle : vérifie la saisie. ':''}{v[2]}</Verdict>
    <Scale min={60} max={260} v={S} seg={[{to:90,t:'ko',l:'<90'},{to:120,t:'ok',l:'90–119'},{to:140,t:'in',l:'120–139'},{to:180,t:'wa',l:'140–179'},{to:260,t:'ko',l:'≥180'}]}/>
    <Sub t={`PAM ${M} mmHg · pression pulsée ${S-D} mmHg`}/></>
   :bad?<Verdict tone="wa" t="Systolique et diastolique à vérifier">La pression systolique doit être supérieure à la diastolique.</Verdict>
   :<Hint t="Tape la systolique puis la diastolique, ou fais glisser les curseurs. Seuils de l'adulte."/>}</Live>
  <button type="button" className="save" disabled={!has} onClick={save}>Enregistrer la mesure</button></div>
  <Hist k="pa" rd={rd} del={del} main={r=><>{r.v}/{r.d}<small> mmHg</small></>} sub={r=>`PAM ${Math.round((r.v+2*(r.d??0))/3)}`}/></Shell>}

/* ====== Température ====== */
const TDOC:Doc={
 use:['Mesurer la température corporelle pour repérer une fièvre, une hypothermie ou une hyperthermie.','Suivre l\'évolution sous traitement ou en cas d\'infection.'],
 eq:['°F = °C × 9 ÷ 5 + 32','°C = (°F − 32) × 5 ÷ 9'],
 vars:['Axillaire : la plus courante, un peu plus basse que la température centrale ; garder le thermomètre au creux de l\'aisselle jusqu\'au signal.','Rectale : référence chez le nourrisson et en cas de suspicion d\'hypothermie. Orale et tympanique : selon le matériel disponible.','Saisie rapide en °C : tape 385 pour 38,5.'],
 read:[['< 28 °C','Hypothermie sévère','ko'],['28 – 31,9 °C','Hypothermie modérée','ko'],['32 – 34,9 °C','Hypothermie légère','wa'],['35 – 35,9 °C','Température basse','in'],['36,0 – 37,5 °C','Normale','ok'],['37,6 – 37,9 °C','Subfébrile','in'],['38,0 – 39,9 °C','Fièvre','wa'],['≥ 40 °C','Hyperthermie','ko']],
 ex:'101,3 °F → (101,3 − 32) × 5 ÷ 9 = 38,5 °C : fièvre.',
 limits:['La température varie selon le site (axillaire plus basse que rectale), l\'heure de la journée et l\'âge.','Le seuil de fièvre est conventionnel ; certains patients (nouveau-né, personne âgée, immunodéprimé) font peu de fièvre malgré une infection grave.','Chez le nourrisson de moins de 3 mois, toute fièvre impose un avis médical urgent.','Un thermomètre mal placé ou mal calibré donne des valeurs erronées : recontrôler une valeur inattendue.'],
 refs:['Mackowiak PA et al. A critical appraisal of 98.6°F, the upper limit of the normal body temperature. JAMA 1992;268:1578-1580.','Brown DJA et al. Accidental hypothermia. N Engl J Med 2012;367:1930-1938.','NICE. Fever in under 5s: assessment and initial management (NG143), 2019.']}

function tClass(t:number):[Tone,string,string]{
 if(t<28)return['ko','Hypothermie sévère','Moins de 28 °C : urgence vitale. Manipuler avec précaution, réchauffer selon le protocole et surveiller le rythme cardiaque.']
 if(t<32)return['ko','Hypothermie modérée','28 à 31,9 °C : troubles de la conscience et du rythme possibles. Réchauffement actif et avis médical urgent.']
 if(t<35)return['wa','Hypothermie légère','32 à 34,9 °C : frissons, confusion possible. Réchauffer, vérifier la glycémie et chercher la cause (exposition, sepsis, hypoglycémie).']
 if(t<36)return['in','Température basse','Vérifier la technique de mesure et la tolérance clinique, surtout chez le nouveau-né et la personne âgée.']
 if(t<=37.5)return['ok','Température normale','Plage habituelle de 36,0 à 37,5 °C, variable selon le site et l\'heure.']
 if(t<38)return['in','Subfébrile','Entre 37,6 et 37,9 °C : à recontrôler et à replacer dans la clinique.']
 if(t<40)return['wa',t<39?'Fièvre':'Fièvre élevée','Rechercher la cause (infection, paludisme en zone d\'endémie, inflammation) et évaluer la tolérance. Chez le nourrisson de moins de 3 mois, toute fièvre impose un avis médical urgent.']
 return['ko','Hyperthermie','40 °C ou plus : urgence. Refroidir selon le protocole et chercher sans délai une cause grave (infection sévère, paludisme grave, coup de chaleur, médicament).']}

type Site='axillaire'|'orale'|'rectale'|'tympanique'
const SITES:[Site,string][]=[['axillaire','Axillaire'],['orale','Orale'],['rectale','Rectale'],['tympanique','Tympan.']]
/** Saisie sans virgule : 385 → 38,5 (°C) ; 986 → 98,6 et 1004 → 100,4 (°F) */
function tParse(raw:string,u:'C'|'F'):number{
 if(!raw)return NaN
 if(raw.includes(','))return num(raw)
 const n=Number(raw)
 return u==='C'?(n>=100?n/10:n):(n>115?n/10:n)}
function tShow(raw:string,u:'C'|'F'):string{
 if(!raw||raw.includes(','))return raw
 const n=Number(raw)
 if(u==='C'&&n>=100)return raw.slice(0,2)+','+raw.slice(2)
 if(u==='F'&&n>115)return raw.length>=4?raw.slice(0,3)+','+raw.slice(3):raw.slice(0,2)+','+raw.slice(2)
 return raw}

export function Temp({rd,add,del}:VP){
 const[raw,setRaw]=useState(''),[u,setU]=usePref<'C'|'F'>('tu','C'),[site,setSite]=usePref<Site>('ts','axillaire'),[saved,flash]=useSaved()
 const x=tParse(raw,u)
 const c=Number.isFinite(x)?Math.round((u==='C'?x:(x-32)*5/9)*10)/10:NaN
 const has=Number.isFinite(c)&&c>0
 const odd=has&&(c<30||c>43)
 const v=has?tClass(c):null
 const save=()=>{add({k:'t',v:c,m:'manuel',a:site});setRaw('');flash()}
 const other=u==='C'?`${fx(c*9/5+32,1)} °F`:`${fx(c,1)} °C`
 return <Shell doc={TDOC}><div className="frm">
  <div className="opts two"><Pick l="Unité" v={u} on={x=>{setU(x);setRaw('')}} o={two<'C'|'F'>([['C','°C'],['F','°F']])}/>
   <Pick l="Site de mesure" v={site} on={setSite} o={two(SITES)}/></div>
  <Entry l="Température" u={u==='C'?'°C':'°F'} v={raw} on={setRaw} dec max={4} ph={u==='C'?'37,0':'98,6'} norm={t=>tShow(t,u)}
   sl={u==='C'?{min:34,max:42,step:.1,def:37}:{min:93,max:108,step:.1,def:98.6}}/>
  <Live>{saved?<Verdict tone="ok" t="Mesure enregistrée sur cet appareil"/>
   :has&&v?<><Verdict tone={v[0]} t={v[1]}>{odd?'Valeur inhabituelle : vérifie la saisie. ':''}{v[2]}</Verdict>
    <Scale min={33} max={42} v={c} seg={[{to:35,t:'ko',l:'<35'},{to:36,t:'in',l:'35–36'},{to:37.5,t:'ok',l:'36–37,5'},{to:38,t:'in',l:'\u00a0'},{to:40,t:'wa',l:'38–39,9'},{to:42,t:'ko',l:'≥40'}]}/>
    <Sub t={`Équivalent : ${other}`}/></>
   :<Hint t={u==='C'?'Tape les chiffres sans virgule (385 devient 38,5) ou fais glisser le curseur.':'Tape les chiffres sans virgule (1004 devient 100,4) ou fais glisser le curseur.'}/>}</Live>
  <button type="button" className="save" disabled={!has} onClick={save}>Enregistrer la mesure</button></div>
  <Hist k="t" rd={rd} del={del} main={r=><>{fx(r.v,1)}<small> °C</small></>} sub={r=>r.a??''}/></Shell>}

/* ====== SpO2 ====== */
const SPDOC:Doc={
 use:['Estimer la saturation de l\'hémoglobine en oxygène par oxymétrie de pouls, sans prélèvement.','Détecter une hypoxémie avant l\'apparition de signes cliniques évidents et suivre la réponse à l\'oxygène.'],
 eq:['SpO₂ (%) = HbO₂ ÷ (HbO₂ + Hb réduite) × 100','Lecture directe sur l\'oxymètre, valeur stable.'],
 vars:['Capteur sur un doigt propre, chaud, immobile, à hauteur du cœur ; retirer le vernis épais ou les faux ongles si le signal est faible.','Attendre une courbe de pouls régulière et une valeur stable avant de lire.','Noter si le patient est sous oxygène.'],
 read:[['≥ 95 %','Normale','ok'],['90 – 94 %','Basse : évaluer','wa'],['< 90 %','Hypoxémie : évaluation immédiate','ko'],['Cible sous O₂ (adulte)','94 – 98 %','in'],['Cible si risque d\'hypercapnie','88 – 92 %','in']],
 ex:'SpO₂ 92 % en air ambiant chez un adulte dyspnéique : valeur basse, à replacer avec la FR, l\'effort respiratoire et la conscience.',
 limits:['L\'oxymètre peut surestimer la saturation chez les patients à peau foncée : une valeur rassurante ne prime pas sur une clinique inquiétante.','Fausses lectures : extrémités froides, état de choc, mouvements, vernis, intoxication au monoxyde de carbone (valeur faussement normale).','Ne renseigne ni la ventilation (CO₂) ni le contenu en oxygène du sang (anémie).','Les cibles dépendent du patient et du protocole du service : vérifie avant d\'agir.'],
 refs:['O\'Driscoll BR et al. BTS guideline for oxygen use in adults in healthcare and emergency settings. Thorax 2017;72(Suppl 1):ii1-ii90.','Sjoding MW et al. Racial bias in pulse oximetry measurement. N Engl J Med 2020;383:2477-2478.']}
const spTone=(n:number):Tone=>n>=95?'ok':n>=90?'wa':'ko'

export function SpO2({rd,add,del}:VP){
 const[raw,setRaw]=useState(''),[ctx,setCtx]=usePref<'air'|'o2'>('spc','air'),[saved,flash]=useSaved()
 const n=Math.round(num(raw)),has=Number.isFinite(n)&&n>=1&&n<=100,over=Number.isFinite(n)&&n>100
 const save=()=>{add({k:'spo2',v:n,m:'manuel',a:ctx});setRaw('');flash()}
 const t=has?spTone(n):'in'
 return <Shell doc={SPDOC}><div className="frm">
  <div className="opts"><Pick l="Conditions" v={ctx} on={setCtx} o={two<'air'|'o2'>([['air','Air ambiant'],['o2','Sous O₂']])}/></div>
  <Entry l="SpO₂" u="%" v={raw} on={setRaw} max={3} sl={{min:70,max:100,step:1,def:95}}/>
  <Live>{saved?<Verdict tone="ok" t="Mesure enregistrée sur cet appareil"/>
   :has?<><Verdict tone={t} t={n>=95?'Saturation normale':n>=90?'Saturation basse':'Hypoxémie'}>
    {n<70?'Valeur très basse : vérifie le capteur et la qualité du signal. ':''}
    {n>=95?'Dans la plage habituelle. Un oxymètre peut surestimer la saturation sur peau foncée : la clinique prime.'
     :n>=90?'Évaluer la fréquence respiratoire, l\'effort respiratoire et la cause. Cibles sous oxygène : 94 à 98 %, ou 88 à 92 % si risque d\'hypercapnie.'
     :'Évaluation clinique immédiate : voies aériennes, respiration, circulation. Vérifier la qualité du signal (doigt chaud, propre, immobile).'}{ctx==='o2'?' Noter le débit ou le dispositif d\'oxygène dans l\'observation.':''}</Verdict>
    <Scale min={80} max={100} v={n} seg={[{to:90,t:'ko',l:'<90'},{to:95,t:'wa',l:'90–94'},{to:100,t:'ok',l:'≥95'}]}/></>
   :over?<Verdict tone="wa" t="Valeur impossible">La SpO₂ ne peut pas dépasser 100 %.</Verdict>
   :<Hint t="Tape la valeur lue sur l'oxymètre, ou fais glisser le curseur."/>}</Live>
  <button type="button" className="save" disabled={!has} onClick={save}>Enregistrer la mesure</button></div>
  <Hist k="spo2" rd={rd} del={del} main={r=><>{r.v}<small> %</small></>} sub={r=>r.a==='o2'?'sous O₂':'air ambiant'}/></Shell>}

/* ====== Poids ====== */
const PODOC:Doc={
 use:['Suivre l\'évolution du poids (nutrition, œdèmes, déshydratation, traitement).','Calculer l\'IMC avec la taille et fournir un poids mesuré récent pour les doses dépendantes du poids.'],
 eq:['IMC (kg/m²) = poids (kg) ÷ taille (m)²'],
 vars:['Peser en vêtements légers, sans chaussures, sur une balance posée à plat et remise à zéro.','Nourrisson : pèse-bébé, nu ou avec une couche sèche.','Patient qui ne peut pas se tenir debout : peser avec un lève-malade ou une balance adaptée, sinon noter « estimé » dans l\'observation.'],
 read:[['< 18,5','Insuffisance pondérale','in'],['18,5 – 24,9','Poids normal','ok'],['25 – 29,9','Surpoids','wa'],['30 – 34,9','Obésité classe I','ko'],['35 – 39,9','Obésité classe II','ko'],['≥ 40','Obésité classe III','ko']],
 ex:'72 kg pour 1,75 m → 72 ÷ 1,75² = 23,5 kg/m² : poids normal.',
 limits:['L\'IMC vaut pour l\'adulte. Chez l\'enfant, utiliser les courbes de croissance de l\'OMS.','L\'IMC ne distingue pas masse grasse et masse musculaire ; œdèmes, ascite et grossesse faussent le poids.','Pour une dose dépendante du poids, utiliser un poids mesuré récent et faire vérifier le calcul avec la prescription.'],
 refs:['World Health Organization. Obesity: preventing and managing the global epidemic. WHO Technical Report Series 894, 2000.','WHO Multicentre Growth Reference Study Group. WHO Child Growth Standards. Acta Paediatr Suppl 2006;450.']}

export function Poids({rd,add,del}:VP){
 const[raw,setRaw]=useState(''),[saved,flash]=useSaved()
 const w=num(raw),has=Number.isFinite(w)&&w>0
 const odd=has&&(w<0.3||w>400)
 const ht=lastOf(rd,'taille'),prev=lastOf(rd,'poids')
 const imc=has&&ht?imcOf(w,ht.v):NaN,cat=Number.isFinite(imc)?imcCat(imc):null
 const save=()=>{add({k:'poids',v:Math.round(w*100)/100,m:'manuel'});setRaw('');flash()}
 const dl=has&&prev?w-prev.v:NaN
 return <Shell doc={PODOC}><div className="frm">
  <Entry l="Poids" u="kg" v={raw} on={setRaw} dec max={4} ph="0,0" sl={{min:1,max:150,step:.1,def:70}}/>
  <Live>{saved?<Verdict tone="ok" t="Mesure enregistrée sur cet appareil"/>
   :has?<>{odd&&<Verdict tone="wa" t="Valeur inhabituelle">Vérifie la saisie : le poids attendu se situe entre 0,3 et 400 kg.</Verdict>}
    {cat&&!odd?<Verdict tone={cat.tone} t={`IMC ${fx(imc)} kg/m² · ${cat.k}`}>Calculé avec la dernière taille enregistrée ({ds(ht!.v)} cm). Valable pour l'adulte.</Verdict>
     :!odd&&<Hint t="Aucune taille enregistrée : l'IMC apparaîtra dès qu'elle l'est."/>}
    {Number.isFinite(dl)&&<Sub t={`Écart avec la dernière mesure : ${dl>0?'+':''}${fx(dl,1)} kg`}/>}</>
   :<Hint t="Poids en kilogrammes. Une virgule pour les décimales (nourrisson : 3,4), ou fais glisser le curseur."/>}</Live>
  <button type="button" className="save" disabled={!has} onClick={save}>Enregistrer la mesure</button></div>
  <Hist k="poids" rd={rd} del={del} main={r=><>{ds(r.v)}<small> kg</small></>}/></Shell>}

/* ====== Taille ====== */
const TADOC:Doc={
 use:['Mesurer la taille pour calculer l\'IMC, la surface corporelle ou suivre la croissance de l\'enfant.'],
 eq:['Taille (cm) = taille (m) × 100'],
 vars:['Debout, sans chaussures, talons joints, dos contre la toise, regard à l\'horizontale.','Enfant de moins de 2 ans : mesurer la longueur couché, avec une toise adaptée.','Patient alité : mesure couchée au mètre ruban, à noter dans l\'observation.'],
 read:[['40 – 230 cm','Plage acceptée par l\'application','in']],
 ex:'1,72 m → 1,72 × 100 = 172 cm.',
 limits:['La taille diminue avec l\'âge (tassements) et varie d\'un à deux centimètres au cours de la journée.','Une taille erronée fausse l\'IMC : l\'erreur est élevée au carré.','Une taille déclarée par le patient est moins fiable qu\'une taille mesurée.'],
 refs:['WHO Multicentre Growth Reference Study Group. WHO Child Growth Standards. Acta Paediatr Suppl 2006;450.']}

export function Taille({rd,add,del}:VP){
 const[raw,setRaw]=useState(''),[u,setU]=usePref<'cm'|'m'>('tau','cm'),[saved,flash]=useSaved()
 const x=num(raw),cm=Number.isFinite(x)?(u==='m'?x*100:x):NaN
 const has=Number.isFinite(cm)&&cm>0
 const odd=has&&(cm<40||cm>230)
 const pw=lastOf(rd,'poids')
 const imc=has&&pw?imcOf(pw.v,cm):NaN,cat=Number.isFinite(imc)?imcCat(imc):null
 const save=()=>{add({k:'taille',v:Math.round(cm*10)/10,m:'manuel'});setRaw('');flash()}
 return <Shell doc={TADOC}><div className="frm">
  <div className="opts"><Pick l="Unité" v={u} on={x=>{setU(x);setRaw('')}} o={two<'cm'|'m'>([['cm','Centimètres'],['m','Mètres']])}/></div>
  <Entry l="Taille" u={u} v={raw} on={setRaw} dec={u==='m'} max={3} ph={u==='cm'?'170':'1,70'} sl={u==='cm'?{min:40,max:220,step:1,def:170}:{min:.4,max:2.2,step:.01,def:1.7}}/>
  <Live>{saved?<Verdict tone="ok" t="Mesure enregistrée sur cet appareil"/>
   :has?<>{odd?<Verdict tone="wa" t="Valeur inhabituelle">Vérifie la saisie : la taille attendue se situe entre 40 et 230 cm.</Verdict>
    :cat?<Verdict tone={cat.tone} t={`IMC ${fx(imc)} kg/m² · ${cat.k}`}>Calculé avec le dernier poids enregistré ({ds(pw!.v)} kg). Valable pour l'adulte.</Verdict>
    :<Hint t="Aucun poids enregistré : l'IMC apparaîtra dès qu'il l'est."/>}
    <Sub t={`${fx(cm,0)} cm = ${fx(cm/100,2)} m`}/></>
   :<Hint t={u==='cm'?'Taille en centimètres, par exemple 172, ou fais glisser le curseur.':'Taille en mètres, par exemple 1,72, ou fais glisser le curseur.'}/>}</Live>
  <button type="button" className="save" disabled={!has} onClick={save}>Enregistrer la mesure</button></div>
  <Hist k="taille" rd={rd} del={del} main={r=><>{ds(r.v)}<small> cm</small></>}/></Shell>}

/* ====== Glycémie ====== */
const GDOC:Doc={
 use:['Mesurer la glycémie capillaire ou veineuse pour repérer une hypoglycémie (urgence) ou une hyperglycémie.','Dépister ou suivre un diabète, en tenant compte du moment de la mesure.'],
 eq:['mg/dL = g/L × 100','mmol/L = g/L × 5,55','g/L = mmol/L × 0,18'],
 vars:['Préciser le contexte : à jeun (8 h sans apport calorique), 2 heures après un repas, ou au hasard.','Mains lavées et sèches pour la glycémie capillaire : un reste de sucre sur le doigt fausse la valeur.'],
 read:[['< 0,54 g/L (3,0 mmol/L)','Hypoglycémie sévère','ko'],['< 0,70 g/L (3,9 mmol/L)','Hypoglycémie','wa'],['À jeun 0,70 – 1,10','Normale','ok'],['À jeun 1,10 – 1,25','Hyperglycémie modérée à jeun','wa'],['À jeun ≥ 1,26','Compatible avec un diabète (à confirmer)','wa'],['2 h après repas < 1,40','Normale','ok'],['2 h après repas 1,40 – 1,99','Intolérance au glucose','wa'],['≥ 2,00 g/L','Compatible avec un diabète (à confirmer)','wa'],['≥ 3,00 g/L','Hyperglycémie sévère : chercher une cétose','ko']],
 ex:'92 mg/dL = 0,92 g/L = 5,1 mmol/L : normal à jeun.',
 limits:['Un lecteur capillaire a une marge d\'erreur d\'environ 15 % ; le diagnostic de diabète repose sur une glycémie veineuse de laboratoire, confirmée.','Chez un patient confus ou convulsant, une glycémie capillaire basse se traite sans attendre le laboratoire, selon le protocole.','Les seuils de l\'app sont ceux de l\'adulte non enceinte. Grossesse, enfant et diabète connu ont des cibles propres.','Les seuils d\'alerte sont des règles pratiques : vérifie avec ton protocole.'],
 refs:['American Diabetes Association. Standards of Care in Diabetes (édition en vigueur). Diabetes Care.','World Health Organization. Definition and diagnosis of diabetes mellitus and intermediate hyperglycaemia. Genève, 2006.']}

type GU='gl'|'mg'|'mm'
type GC='jeun'|'repas'|'hasard'
const GUN:[GU,string][]=[['gl','g/L'],['mg','mg/dL'],['mm','mmol/L']]
const GCN:[GC,string][]=[['jeun','À jeun'],['repas','Après repas'],['hasard','Au hasard']]
const toG=(x:number,u:GU)=>u==='gl'?x:u==='mg'?x/100:x*0.1802
function gClass(g:number,c:GC):[Tone,string,string]{
 if(g<0.54)return['ko','Hypoglycémie sévère','Moins de 0,54 g/L (3,0 mmol/L) : urgence. Traiter selon le protocole sans attendre et rechercher les signes neuroglycopéniques (confusion, convulsions, coma).']
 if(g<0.70)return['wa','Hypoglycémie','Moins de 0,70 g/L (3,9 mmol/L) : resucrage selon le protocole, puis contrôle de la glycémie après 15 minutes.']
 if(g>=3)return['ko','Hyperglycémie sévère','3 g/L ou plus : chercher une cétose (cétonémie, cétonurie) et une déshydratation, évaluer la conscience. Avis médical.']
 if(c==='jeun'){
  if(g<=1.10)return['ok','Glycémie normale à jeun','Entre 0,70 et 1,10 g/L.']
  if(g<1.26)return['wa','Hyperglycémie modérée à jeun','Entre 1,10 et 1,25 g/L : à contrôler sur une glycémie veineuse.']
  return['wa','Compatible avec un diabète','1,26 g/L ou plus à jeun : à confirmer sur une glycémie veineuse de laboratoire.']}
 if(c==='repas'){
  if(g<1.40)return['ok','Glycémie normale après repas','Moins de 1,40 g/L à 2 heures du repas.']
  if(g<2)return['wa','Intolérance au glucose','Entre 1,40 et 1,99 g/L à 2 heures du repas : à contrôler.']
  return['wa','Compatible avec un diabète','2,00 g/L ou plus : à confirmer sur une glycémie veineuse de laboratoire.']}
 if(g<1.40)return['ok','Glycémie sans anomalie','Valeur prise au hasard, sans anomalie franche. Préciser à jeun ou après repas si besoin.']
 if(g<2)return['wa','Glycémie élevée','Valeur prise au hasard : à replacer avec le moment du dernier repas et à contrôler.']
 return['wa','Compatible avec un diabète','2,00 g/L ou plus au hasard : à confirmer sur une glycémie veineuse, surtout s\'il y a des signes cliniques (soif, polyurie, amaigrissement).']}

export function Glyc({rd,add,del}:VP){
 const[raw,setRaw]=useState(''),[u,setU]=usePref<GU>('gu','gl'),[c,setC]=usePref<GC>('gc','jeun'),[saved,flash]=useSaved()
 const x=num(raw),g=Number.isFinite(x)?toG(x,u):NaN
 const has=Number.isFinite(g)&&g>0
 const odd=has&&(g<0.2||g>6)
 const v=has?gClass(g,c):null
 const save=()=>{add({k:'glyc',v:Math.round(g*100)/100,m:'manuel',a:c});setRaw('');flash()}
 const all=has?`${fx(g,2)} g/L · ${fx(g*100,0)} mg/dL · ${fx(g/0.1802,1)} mmol/L`:''
 return <Shell doc={GDOC}><div className="frm">
  <div className="opts two"><Pick l="Unité" v={u} on={x=>{setU(x);setRaw('')}} o={two(GUN)}/>
   <Pick l="Moment" v={c} on={setC} o={two(GCN)}/></div>
  <Entry l="Glycémie" u={GUN.find(a=>a[0]===u)![1]} v={raw} on={setRaw} dec={u!=='mg'} max={4} ph={u==='gl'?'1,00':u==='mg'?'100':'5,5'}
   sl={u==='gl'?{min:.2,max:4,step:.01,def:1}:u==='mg'?{min:20,max:400,step:1,def:100}:{min:1,max:22,step:.1,def:5.5}}/>
  <Live>{saved?<Verdict tone="ok" t="Mesure enregistrée sur cet appareil"/>
   :has&&v?<><Verdict tone={v[0]} t={v[1]}>{odd?'Valeur inhabituelle : vérifie la saisie et l\'unité. ':''}{v[2]}</Verdict><Sub t={all}/></>
   :<Hint t="Choisis l'unité du lecteur et le moment de la mesure, puis tape la valeur ou fais glisser le curseur."/>}</Live>
  <button type="button" className="save" disabled={!has} onClick={save}>Enregistrer la mesure</button></div>
  <Hist k="glyc" rd={rd} del={del} main={r=><>{fx(r.v,2)}<small> g/L</small></>} sub={r=>r.a==='repas'?'après repas':r.a==='hasard'?'au hasard':'à jeun'}/></Shell>}

/* ====== Observation clinique ====== */
const ODOC:Doc={
 use:['Garder une trace datée de ce que tu constates, en complément des chiffres.','Faciliter la transmission au médecin ou à l\'équipe suivante.'],
 eq:['Situation, Antécédents, Évaluation, Recommandation (SBAR)'],
 vars:['Touche les constats rapides (conscience, aspect, signes), puis ajoute une phrase libre si besoin.','Rester factuel et bref : ce que tu vois, mesures à l\'appui, plutôt qu\'une interprétation.','L\'heure est enregistrée automatiquement.'],
 read:[['Conscience','Un seul choix à la fois','in'],['Aspect et signes','Plusieurs choix possibles','in']],
 ex:'Somnolent, pâleur, sueurs. Douleur thoracique depuis 1 h, appel du médecin à 14 h 20.',
 limits:['Les constats rapides ne remplacent pas le dossier du patient : reporte les informations importantes dans le dossier du service.','Aucune donnée n\'est envoyée : l\'observation reste sur cet appareil.','Ne pas saisir d\'informations qui identifient un patient si l\'appareil est partagé.'],
 refs:['Haig KM et al. SBAR: a shared mental model for improving communication between clinicians. Jt Comm J Qual Patient Saf 2006;32:167-175.']}
const OG:{g:string;one:boolean;o:string[]}[]=[
 {g:'Conscience',one:true,o:['Conscient','Somnolent','Confus','Inconscient']},
 {g:'Aspect',one:false,o:['Pâleur','Cyanose','Sueurs','Marbrures','Ictère']},
 {g:'Signes',one:false,o:['Dyspnée','Douleur thoracique','Douleur abdominale','Céphalées','Vomissements','Convulsions']}]

export function Obs({rd,add,del}:VP){
 const[sel,setSel]=useState<string[]>([]),[note,setNote]=useState(''),[saved,flash]=useSaved()
 const chips=sel.join(', '),nt=note.trim()
 const text=chips+(chips&&nt?'. ':'')+nt
 const has=text.length>0
 const tog=(g:typeof OG[number],o:string)=>{buzz()
  setSel(s=>s.includes(o)?s.filter(x=>x!==o):[...(g.one?s.filter(x=>!g.o.includes(x)):s),o])}
 const save=()=>{add({k:'obs',v:0,m:'manuel',x:text});setSel([]);setNote('');flash()}
 return <Shell doc={ODOC}><div className="frm">
  {OG.map(g=><div key={g.g} className="fld">{g.g}
   <div className="chps wrap" role="group" aria-label={g.g}>{g.o.map(o=>
    <button key={o} type="button" className={'chp'+(sel.includes(o)?' on':'')} aria-pressed={sel.includes(o)} onClick={()=>tog(g,o)}>{o}</button>)}</div></div>)}
  <label className="fld">Précisions
   <textarea className="ta" rows={4} maxLength={500} autoCapitalize="sentences" value={note} placeholder="Texte libre (la dictée vocale du clavier fonctionne)" onChange={e=>setNote(e.target.value)}/></label>
  {saved&&<Verdict tone="ok" t="Observation enregistrée sur cet appareil"/>}
  <button type="button" className="save" disabled={!has} onClick={save}>Enregistrer l'observation</button></div>
  <Hist k="obs" rd={rd} del={del} main={r=><span className="tt">{r.x}</span>}/></Shell>}