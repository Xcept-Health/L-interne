import {useEffect,useRef,useState} from 'react'
import {Icon,Tilt} from './ui'
import {Empty,KV,Learn,Res,Scale,Verdict} from './Calc'
import {num} from './calcdata'
import type {Doc,Tone} from './calcdata'
import {Entry,Pick,Glyc,Obs,PA,Poids,SpO2,Taille,Temp,fmtR} from './vitalsParams'
import {useBackLayer} from './nav'

/* ====== Données ======
 * Ajouter un paramètre : l'ajouter dans PARAMS (on:true), créer son écran
 * sur le modèle de FC, puis l'afficher dans le `switch` de Vitals().
 * Toutes les mesures sont stockées dans `rv-vitals` (localStorage), sur l'appareil. */
/** v = valeur principale ; d = durée du comptage (s) ou diastolique ; n = nombre compté ; a = contexte (âge, site, unité) ; x = texte libre */
export interface Reading{id:number;t:number;k:string;v:number;m:'chrono'|'manuel';d?:number;n?:number;a?:string;x?:string}
export type NewR=Omit<Reading,'id'|'t'>
const PARAMS=[
 {k:'fc',code:'FC',n:'Fréquence cardiaque',u:'bpm',on:true},
 {k:'fr',code:'FR',n:'Fréquence respiratoire',u:'/min',on:true},
 {k:'pa',code:'PA',n:'Pression artérielle',u:'mmHg',on:true},
 {k:'t',code:'T°',n:'Température',u:'°C',on:true},
 {k:'spo2',code:'O₂',n:'SpO₂',u:'%',on:true},
 {k:'poids',code:'kg',n:'Poids',u:'kg',on:true},
 {k:'taille',code:'cm',n:'Taille',u:'cm',on:true},
 {k:'glyc',code:'Gl',n:'Glycémie',u:'g/L',on:true},
 {k:'obs',code:'Obs',n:'Observation clinique',u:'',on:true}]

function useLS<T>(k:string,i:T){const[v,s]=useState<T>(()=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):i}catch{return i}})
 useEffect(()=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}},[k,v]);return[v,s] as const}
const when=(t:number)=>new Date(t).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})

/* ====== Fréquence cardiaque ====== */
type AgeK='adulte'|'enfant'|'nourrisson'|'nne'
/** Plages de repos, sujet éveillé (AHA PALS) */
const AGES:Record<AgeK,{n:string;s:string;lo:number;hi:number}>={
 adulte:{n:'Adulte (> 10 ans)',s:'Adulte',lo:60,hi:100},
 enfant:{n:'Enfant (2 – 10 ans)',s:'Enfant',lo:60,hi:140},
 nourrisson:{n:'Nourrisson (3 mois – 2 ans)',s:'Nourrisson',lo:100,hi:190},
 nne:{n:'Nouveau-né (< 3 mois)',s:'Nouveau-né',lo:85,hi:205}}

const FCDOC:Doc={
 use:['Mesurer le pouls : nombre de battements par minute (bpm), signe vital de base.','Repérer une bradycardie ou une tachycardie, à interpréter avec la clinique (fièvre, douleur, hémorragie, anxiété, médicaments).'],
 eq:['FC (bpm) = battements comptés × 60 ÷ durée (s)','15 s → × 4   ·   30 s → × 2   ·   60 s → × 1'],
 vars:['Palper le pouls radial (adulte, enfant) ou brachial (nourrisson), ou ausculter le cœur.','Si le rythme est irrégulier, compter 60 secondes.'],
 read:[['Adulte','60 – 100 bpm','ok'],['Enfant 2 – 10 ans','60 – 140 bpm','ok'],['Nourrisson 3 mois – 2 ans','100 – 190 bpm','ok'],['Nouveau-né < 3 mois','85 – 205 bpm','ok'],['Sous la plage','Bradycardie','wa'],['Au-dessus de la plage','Tachycardie','wa'],['< 2/3 du bas ou > 1,5 × le haut','Seuil d\'alerte indicatif : évaluation clinique rapide','ko']],
 ex:'22 battements en 15 s → 22 × 4 = 88 bpm : normal chez l\'adulte.',
 limits:['Compter sur 15 s multiplie l\'erreur par 4 : préférer 30 ou 60 s si le pouls est lent ou irrégulier.','Plages valables au repos, sujet éveillé. L\'âge, le sport, la fièvre (environ + 10 bpm par °C) et la grossesse (+ 10 à 20 bpm) modifient les valeurs.','Un pouls palpé peut être plus lent que la FC cardiaque en cas d\'arythmie (déficit de pouls).','Le seuil d\'alerte indiqué est une règle pratique de l\'app, pas une valeur officielle : vérifie avec ton protocole.'],
 refs:['American Heart Association. PALS Provider Manual : plages de fréquence cardiaque selon l\'âge.','Fleming S et al. Normal ranges of heart rate and respiratory rate in children from birth to 18 years of age. Lancet 2011.']}

/* Signal de fin : vibration + bip, pour ne pas avoir à regarder l'écran */
const signal=(c:AudioContext|null)=>{
 try{navigator.vibrate?.([220,90,220])}catch{}
 try{if(!c)return;const o=c.createOscillator(),g=c.createGain();o.frequency.value=880;g.gain.value=.18;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.4)}catch{}}

/* ====== Fréquence respiratoire ====== */
/** Plages de repos, sujet éveillé (AHA PALS, Fleming 2011 ; arrondies) */
const FRAGES:Record<AgeK,{n:string;s:string;lo:number;hi:number}>={
 adulte:{n:'Adulte (> 10 ans)',s:'Adulte',lo:12,hi:20},
 enfant:{n:'Enfant (2 – 10 ans)',s:'Enfant',lo:18,hi:28},
 nourrisson:{n:'Nourrisson (3 mois – 2 ans)',s:'Nourrisson',lo:22,hi:53},
 nne:{n:'Nouveau-né (< 3 mois)',s:'Nouveau-né',lo:30,hi:60}}

const FRDOC:Doc={
 use:['Mesurer la fréquence respiratoire : nombre de respirations par minute, signe vital le plus précoce d\'une dégradation clinique.','Repérer une bradypnée ou une tachypnée, à interpréter avec la SpO₂, l\'effort respiratoire et la conscience.'],
 eq:['FR (/min) = respirations comptées × 60 ÷ durée (s)','15 s → × 4   ·   30 s → × 2   ·   60 s → × 1'],
 vars:['Compter si possible sans prévenir le patient (la respiration change quand on l\'observe). Observer le thorax et l\'abdomen : une montée = une respiration.','Compter 60 secondes si le rythme est irrégulier, si la valeur est anormale, et chez le nourrisson.','Dans l\'application, touche l\'écran à chaque respiration pendant le chronomètre : le total est reporté automatiquement.'],
 read:[['Adulte','12 – 20 /min','ok'],['Enfant 2 – 10 ans','18 – 28 /min','ok'],['Nourrisson 3 mois – 2 ans','22 – 53 /min','ok'],['Nouveau-né < 3 mois','30 – 60 /min','ok'],['Sous la plage','Bradypnée','wa'],['Au-dessus de la plage','Tachypnée','wa'],['Adulte ≥ 22 /min','Critère qSOFA : évaluer le risque de sepsis','wa'],['< 2/3 du bas ou > 1,5 × le haut','Seuil d\'alerte indicatif : évaluation clinique rapide','ko']],
 ex:'9 respirations en 30 s → 9 × 2 = 18 /min : normal chez l\'adulte.',
 limits:['Compter sur 15 s multiplie l\'erreur par 4 : préférer 30 ou 60 s, surtout si la respiration est irrégulière.','Plages valables au repos, sujet éveillé. Le sommeil abaisse la FR ; fièvre, douleur, anxiété et grossesse l\'augmentent.','Pneumonie de l\'enfant (OMS) : respiration rapide si FR ≥ 60 /min avant 2 mois, ≥ 50 /min de 2 à 11 mois, ≥ 40 /min de 1 à 5 ans.','Le seuil d\'alerte indiqué est une règle pratique de l\'app, pas une valeur officielle : vérifie avec ton protocole.'],
 refs:['Fleming S et al. Normal ranges of heart rate and respiratory rate in children from birth to 18 years of age. Lancet 2011.','American Heart Association. PALS Provider Manual : plages de fréquence respiratoire selon l\'âge.','Cretikos MA et al. Respiratory rate: the neglected vital sign. Med J Aust 2008;188:657-659.','Singer M et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA 2016;315:801-810.','World Health Organization. Integrated Management of Childhood Illness: chart booklet, 2014.']}

/* ====== Comptage chronométré (FC et FR) ====== */
type Ph='idle'|'run'|'done'
interface Cfg{k:'fc'|'fr';name:string;unit:string;ages:Record<AgeK,{n:string;s:string;lo:number;hi:number}>;doc:Doc
 cnt:string;noun:string;abbr:string;run:string;ph:string;tap:boolean
 verdict:(v:number,A:{lo:number;hi:number})=>[Tone,string,string]}

const FC_CFG:Cfg={k:'fc',name:'Fréquence cardiaque',unit:'bpm',ages:AGES,doc:FCDOC,cnt:'Battements comptés',noun:'battements',abbr:'bat.',run:'Compte les battements',ph:'ex. 80',tap:false,
 verdict:(bpm,A)=>bpm<A.lo?[bpm<A.lo*.67?'ko':'wa','Bradycardie',`FC inférieure à ${A.lo} bpm pour cette tranche d'âge. Vérifier la régularité du pouls et la tolérance (malaise, hypotension).`]
  :bpm>A.hi?[bpm>A.hi*1.5?'ko':'wa','Tachycardie','Causes fréquentes : fièvre, douleur, anxiété, hémorragie ou déshydratation, anémie. À interpréter avec la PA et la clinique.']
  :['ok','Fréquence normale','Dans la plage de repos pour cette tranche d\'âge.']}

const FR_CFG:Cfg={k:'fr',name:'Fréquence respiratoire',unit:'/min',ages:FRAGES,doc:FRDOC,cnt:'Respirations comptées',noun:'respirations',abbr:'resp.',run:'Compte les respirations',ph:'ex. 16',tap:true,
 verdict:(v,A)=>v<A.lo?[v<A.lo*.67?'ko':'wa','Bradypnée',`FR inférieure à ${A.lo} /min pour cette tranche d'âge. Penser à une dépression respiratoire (opioïdes, sédatifs), un trouble neurologique ou un épuisement. Évaluer la conscience et la SpO₂.`]
  :v>A.hi?[v>A.hi*1.5?'ko':'wa','Tachypnée','Causes fréquentes : fièvre, douleur, anxiété, hypoxie, acidose, sepsis, détresse respiratoire. Rechercher une lutte respiratoire et mesurer la SpO₂.']
  :['ok','Fréquence normale','Dans la plage de repos pour cette tranche d\'âge.']}

function Chrono({cfg,rd,add,del}:{cfg:Cfg;rd:Reading[];add:(r:NewR)=>void;del:(id:number)=>void}){
 const[tab,setTab]=useState<'m'|'u'>('m'),[mode,setMode]=useState<'chrono'|'manuel'>('chrono'),[age,setAge]=useState<AgeK>('adulte'),[dur,setDur]=useState('30')
 const[ph,setPh]=useState<Ph>('idle'),[el,setEl]=useState(0),[cnt,setCnt]=useState(''),[man,setMan]=useState(''),[saved,setSaved]=useState(false),[taps,setTaps]=useState(0)
 const raf=useRef(0),ctx=useRef<AudioContext|null>(null),lock=useRef<WakeLockSentinel|null>(null),tm=useRef(0),tp=useRef(0)
 const D=Number(dur),AG=cfg.ages
 const release=()=>{try{lock.current?.release()}catch{}lock.current=null}
 useEffect(()=>()=>{cancelAnimationFrame(raf.current);clearTimeout(tm.current);release();ctx.current?.close().catch(()=>{})},[])
 const start=()=>{
  try{const AC=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;ctx.current=ctx.current??new AC()}catch{}
  navigator.wakeLock?.request('screen').then(l=>{lock.current=l}).catch(()=>{})
  const t0=performance.now();setPh('run');setEl(0);setSaved(false);tp.current=0;setTaps(0)
  const tick=()=>{const e=performance.now()-t0
   if(e>=D*1000){setEl(D*1000);setPh('done');if(cfg.tap&&tp.current>0)setCnt(String(tp.current));signal(ctx.current);release();return}
   setEl(e);raf.current=requestAnimationFrame(tick)}
  raf.current=requestAnimationFrame(tick)}
 const reset=()=>{cancelAnimationFrame(raf.current);release();setPh('idle');setEl(0);setCnt('');tp.current=0;setTaps(0)}
 const tap=()=>{tp.current+=1;setTaps(tp.current);try{navigator.vibrate?.(12)}catch{}}
 const n=num(cnt)
 const bpm=mode==='chrono'?(ph==='done'&&n>0?Math.round(n*60/D):NaN):Math.round(num(man))
 const has=Number.isFinite(bpm)&&bpm>0
 const odd=has&&(bpm<(cfg.k==='fc'?30:4)||bpm>(cfg.k==='fc'?250:70))
 const A=AG[age]
 const save=()=>{add({k:cfg.k,v:bpm,m:mode,a:age,...(mode==='chrono'?{d:D,n}:{})});reset();setMan('');setSaved(true);clearTimeout(tm.current);tm.current=window.setTimeout(()=>setSaved(false),3000)}
 const v:[Tone,string,string]=has?cfg.verdict(bpm,A):['in','','']
 const R=88,circ=2*Math.PI*R,frac=Math.min(1,el/(D*1000)),left=Math.max(0,Math.ceil((D*1000-el)/1000))
 const hist=rd.filter(r=>r.k===cfg.k).slice(0,15)
 return <>
  <div className="seg">{([['m','Mesurer'],['u','Comprendre']] as ['m'|'u',string][]).map(([k,l])=>
   <button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}><span>{l}</span>{tab===k&&<i/>}</button>)}</div>
  <div hidden={tab!=='m'}>
   <div className="frm">
    <div className={'setup'+(mode==='chrono'?' two':'')}>
     <Pick l="Tranche d'âge" v={age} on={setAge} off={ph==='run'} o={(Object.keys(AG) as AgeK[]).map(k=>[k,AG[k].s,AG[k].n] as [AgeK,string,string])}/>
     {mode==='chrono'&&<Pick l="Durée" v={dur} on={setDur} off={ph!=='idle'} o={[['15','15 s','15 s × 4'],['30','30 s','30 s × 2'],['60','60 s','60 s × 1']]}/>}
    </div>
    {mode==='chrono'?<>
     <div className="dialw"><button type="button" className={'dial'+(ph==='done'?' done mini':'')} disabled={ph!=='idle'} onClick={start} aria-label={ph==='idle'?`Démarrer le chronomètre de ${D} secondes`:ph==='run'?`${left} secondes restantes`:'Comptage terminé'}>
      <svg viewBox="0 0 200 200" aria-hidden="true"><circle className="tr" cx="100" cy="100" r={R}/><circle className="pg" cx="100" cy="100" r={R} strokeDasharray={circ} strokeDashoffset={circ*(1-frac)} transform="rotate(-90 100 100)"/></svg>
      <span className="dc">{ph==='idle'?<><b>{D}<small> s</small></b><span>Touche pour démarrer</span></>
       :ph==='run'?<><b>{left}</b><span>{cfg.run}</span></>
       :<><b><Icon n="check" s={36}/></b><span>Terminé</span></>}</span></button></div>
     {ph==='idle'&&<p className="hnt">{cfg.tap?'Pendant le comptage, touche l\'écran à chaque respiration. Bip et vibration à la fin.':'Bip et vibration à la fin du comptage.'}</p>}
     {ph==='run'&&<>
      {cfg.tap&&<button type="button" className="tapz" onClick={tap} aria-label={`Compter une respiration, total ${taps}`}><b>{taps}</b><span>Touche à chaque respiration</span></button>}
      <button type="button" className="rst ctr" onClick={reset}><Icon n="close" s={16}/>Annuler</button></>}
     {ph==='done'&&<><label className="bigl">{`${cfg.cnt} en ${D} s`}<input className="big" inputMode="numeric" autoFocus autoComplete="off" value={cnt} placeholder="0" onChange={e=>setCnt(e.target.value.replace(/\D/g,'').slice(0,3))}/></label>
      {cfg.tap&&taps>0&&<p className="hnt" style={{marginBottom:10}}>Total compté par appuis : corrige-le si besoin.</p>}
      <button type="button" className="rst ctr" onClick={reset}><Icon n="flip" s={16}/>Recommencer</button></>}
    </>:<Entry l={cfg.name} u={cfg.unit} v={man} on={setMan} max={3} ph={cfg.ph.replace('ex. ','')} sl={cfg.k==='fc'?{min:30,max:220,step:1,def:75}:{min:4,max:60,step:1,def:16}}/>}
    {ph==='idle'&&<button type="button" className="lnk" onClick={()=>setMode(mode==='chrono'?'manuel':'chrono')}>{mode==='chrono'?'Saisir la valeur à la main':'Utiliser le chronomètre'}</button>}
    {saved&&<Verdict tone="ok" t="Mesure enregistrée sur cet appareil"/>}
    {has?<div className="out">
     <Res k={cfg.name} big={String(bpm)} unit={cfg.unit} line={mode==='chrono'?`${n} ${cfg.noun} × ${60/D} (${D} s)`:undefined} warn={odd?'Valeur inhabituelle : vérifie le comptage.':undefined}/>
     <Scale min={A.lo*.5} max={A.hi*1.6} v={bpm} seg={[{to:A.lo,t:'wa',l:`<${A.lo}`},{to:A.hi,t:'ok',l:`${A.lo}–${A.hi}`},{to:A.hi*1.6,t:'wa',l:`>${A.hi}`}]}/>
     <Verdict tone={v[0]} t={v[1]}>{v[2]}</Verdict>
     <button type="button" className="save" onClick={save}>Enregistrer la mesure</button></div>
    :!saved&&mode==='manuel'&&<Empty t="Saisis la fréquence mesurée pour la comparer à la plage normale."/>}
   </div>
   <h3 className="lh" style={{marginTop:24}}>Dernières mesures</h3>
   {hist.length===0?<Empty t="Aucune mesure enregistrée pour l'instant."/>
   :<ul className="hl">{hist.map(r=>{const a=AG[r.a as AgeK];return <li key={r.id} className="hi"><div className="tx"><b>{r.v}<small> {cfg.unit}</small></b>
     <span>{when(r.t)} · {r.m==='chrono'?`${r.n} ${cfg.abbr} en ${r.d} s`:'saisie manuelle'}{a?` · ${a.n.split(' (')[0]}`:''}</span></div>
     <button type="button" className="x" aria-label="Supprimer cette mesure" onClick={()=>confirm('Supprimer cette mesure ?')&&del(r.id)}><Icon n="close" s={18}/></button></li>})}</ul>}
  </div>
  <div hidden={tab!=='u'}><Learn doc={cfg.doc}/>
   <KV rows={Object.values(AG).map(a=>[a.n,`${a.lo} – ${a.hi} ${cfg.unit}`] as [string,string])}/></div>
 </>}

/* ====== Écran Suivi ====== */
export default function Vitals(){
 const[rd,setRd]=useLS<Reading[]>('rv-vitals',[]),[sel,setSel]=useState<string|null>(null)
 const add=(r:NewR)=>setRd(s=>[{...r,id:Date.now(),t:Date.now()},...s].slice(0,300))
 const del=(id:number)=>setRd(s=>s.filter(r=>r.id!==id))
 const p=PARAMS.find(x=>x.k===sel),pp={rd,add,del}
 useBackLayer(!!p,()=>setSel(null))
 if(p){
  return <div key={'d-'+p.k} className="page"><div className="top"><div><small>Suivi</small><h1 className="sm">{p.n}</h1></div>
   <button className="ib" onClick={()=>setSel(null)} aria-label="Retour au suivi"><Icon n="back"/></button></div>
   <div className="cx">
    {p.k==='fc'&&<Chrono cfg={FC_CFG} {...pp}/>}
    {p.k==='fr'&&<Chrono cfg={FR_CFG} {...pp}/>}
    {p.k==='pa'&&<PA {...pp}/>}
    {p.k==='t'&&<Temp {...pp}/>}
    {p.k==='spo2'&&<SpO2 {...pp}/>}
    {p.k==='poids'&&<Poids {...pp}/>}
    {p.k==='taille'&&<Taille {...pp}/>}
    {p.k==='glyc'&&<Glyc {...pp}/>}
    {p.k==='obs'&&<Obs {...pp}/>}
   </div></div>}
 const recent=rd.slice(0,5)
 return <div key="list" className="page"><div className="top"><div><small>Paramètres vitaux</small><h1>Suivi</h1></div></div>
  <div className="cx"><div className="grid vg">{PARAMS.map(x=>{const last=rd.find(r=>r.k===x.k)
   return <Tilt key={x.k} className={'mod'+(x.on?'':' lock')} disabled={!x.on} onClick={()=>x.on&&setSel(x.k)}>
    <div className="em" aria-hidden="true">{x.code}</div><h4>{x.n}</h4>
    <small>{!x.on?'Bientôt':!last?'Aucune mesure':x.k==='obs'?`Dernière note : ${when(last.t)}`:`${fmtR(last)} ${x.u}`}</small>{!x.on&&<span className="lk"><Icon n="lock" s={16}/></span>}</Tilt>})}</div>
   {recent.length>0&&<><h3 className="lh" style={{marginTop:28}}>Dernières mesures</h3>
    <ul className="hl">{recent.map(r=>{const q=PARAMS.find(x=>x.k===r.k)!;return <li key={r.id} className="hi"><div className="tx"><b>{r.k==='obs'?<span className="tt">{r.x}</span>:<>{fmtR(r)}<small> {q.u}</small></>}</b><span>{q.n} · {when(r.t)}</span></div></li>})}</ul></>}
   <p className="disc">Les mesures restent sur cet appareil. Elles ne sont envoyées nulle part.</p></div></div>
}