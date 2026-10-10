import {useEffect,useRef,useState} from 'react'
import {Icon,Tilt} from './ui'
import {Empty,KV,Learn,Pills,Res,Scale,Verdict} from './Calc'
import {num} from './calcdata'
import type {Doc,Tone} from './calcdata'

/* ====== Données ======
 * Ajouter un paramètre : l'ajouter dans PARAMS (on:true), créer son écran
 * sur le modèle de FC, puis l'afficher dans le `switch` de Vitals().
 * Toutes les mesures sont stockées dans `rv-vitals` (localStorage), sur l'appareil. */
export interface Reading{id:number;t:number;k:string;v:number;m:'chrono'|'manuel';d?:number;n?:number;a?:string}
type NewR=Omit<Reading,'id'|'t'>
const PARAMS=[
 {k:'fc',code:'FC',n:'Fréquence cardiaque',u:'bpm',on:true},
 {k:'fr',code:'FR',n:'Fréquence respiratoire',u:'/min',on:false},
 {k:'pa',code:'PA',n:'Pression artérielle',u:'mmHg',on:false},
 {k:'t',code:'T°',n:'Température',u:'',on:false},
 {k:'spo2',code:'O₂',n:'SpO₂',u:'%',on:false},
 {k:'poids',code:'kg',n:'Poids',u:'kg',on:false},
 {k:'taille',code:'cm',n:'Taille',u:'cm',on:false},
 {k:'glyc',code:'Gl',n:'Glycémie',u:'',on:false},
 {k:'obs',code:'Obs',n:'Observation clinique',u:'',on:false}]

function useLS<T>(k:string,i:T){const[v,s]=useState<T>(()=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):i}catch{return i}})
 useEffect(()=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}},[k,v]);return[v,s] as const}
const when=(t:number)=>new Date(t).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})

/* ====== Fréquence cardiaque ====== */
type AgeK='adulte'|'enfant'|'nourrisson'|'nne'
/** Plages de repos, sujet éveillé (AHA PALS) */
const AGES:Record<AgeK,{n:string;lo:number;hi:number}>={
 adulte:{n:'Adulte (> 10 ans)',lo:60,hi:100},
 enfant:{n:'Enfant (2 – 10 ans)',lo:60,hi:140},
 nourrisson:{n:'Nourrisson (3 mois – 2 ans)',lo:100,hi:190},
 nne:{n:'Nouveau-né (< 3 mois)',lo:85,hi:205}}

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

type Ph='idle'|'run'|'done'
function FC({rd,add,del}:{rd:Reading[];add:(r:NewR)=>void;del:(id:number)=>void}){
 const[tab,setTab]=useState<'m'|'u'>('m'),[mode,setMode]=useState<'chrono'|'manuel'>('chrono'),[age,setAge]=useState<AgeK>('adulte'),[dur,setDur]=useState('30')
 const[ph,setPh]=useState<Ph>('idle'),[el,setEl]=useState(0),[cnt,setCnt]=useState(''),[man,setMan]=useState(''),[saved,setSaved]=useState(false)
 const raf=useRef(0),ctx=useRef<AudioContext|null>(null),lock=useRef<WakeLockSentinel|null>(null),tm=useRef(0)
 const D=Number(dur)
 const release=()=>{try{lock.current?.release()}catch{}lock.current=null}
 useEffect(()=>()=>{cancelAnimationFrame(raf.current);clearTimeout(tm.current);release();ctx.current?.close().catch(()=>{})},[])
 const start=()=>{
  try{const AC=window.AudioContext||(window as unknown as {webkitAudioContext:typeof AudioContext}).webkitAudioContext;ctx.current=ctx.current??new AC()}catch{}
  navigator.wakeLock?.request('screen').then(l=>{lock.current=l}).catch(()=>{})
  const t0=performance.now();setPh('run');setEl(0);setSaved(false)
  const tick=()=>{const e=performance.now()-t0
   if(e>=D*1000){setEl(D*1000);setPh('done');signal(ctx.current);release();return}
   setEl(e);raf.current=requestAnimationFrame(tick)}
  raf.current=requestAnimationFrame(tick)}
 const reset=()=>{cancelAnimationFrame(raf.current);release();setPh('idle');setEl(0);setCnt('')}
 const n=num(cnt)
 const bpm=mode==='chrono'?(ph==='done'&&n>0?Math.round(n*60/D):NaN):Math.round(num(man))
 const has=Number.isFinite(bpm)&&bpm>0
 const odd=has&&(bpm<30||bpm>250)
 const A=AGES[age]
 const save=()=>{add({k:'fc',v:bpm,m:mode,a:age,...(mode==='chrono'?{d:D,n}:{})});reset();setMan('');setSaved(true);clearTimeout(tm.current);tm.current=window.setTimeout(()=>setSaved(false),3000)}
 const v:[Tone,string,string]=!has?['in','','']
  :bpm<A.lo?[bpm<A.lo*.67?'ko':'wa','Bradycardie',`FC inférieure à ${A.lo} bpm pour cette tranche d'âge. Vérifier la régularité du pouls et la tolérance (malaise, hypotension).`]
  :bpm>A.hi?[bpm>A.hi*1.5?'ko':'wa','Tachycardie','Causes fréquentes : fièvre, douleur, anxiété, hémorragie ou déshydratation, anémie. À interpréter avec la PA et la clinique.']
  :['ok','Fréquence normale','Dans la plage de repos pour cette tranche d\'âge.']
 const R=88,circ=2*Math.PI*R,frac=Math.min(1,el/(D*1000)),left=Math.max(0,Math.ceil((D*1000-el)/1000))
 const hist=rd.filter(r=>r.k==='fc').slice(0,15)
 return <>
  <div className="seg">{([['m','Mesurer'],['u','Comprendre']] as ['m'|'u',string][]).map(([k,l])=>
   <button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}><span>{l}</span>{tab===k&&<i/>}</button>)}</div>
  <div hidden={tab!=='m'}>
   <div className="frm">
    <div className={ph==='idle'?'':'dis'}><Pills v={mode} on={setMode} o={[['chrono','Chronomètre'],['manuel','Saisie manuelle']]}/></div>
    <div className={'fld'+(ph==='idle'?'':' dis')}>Tranche d'âge<div className="pills w">{(Object.keys(AGES) as AgeK[]).map(k=><button key={k} type="button" className={age===k?'on':''} aria-pressed={age===k} onClick={()=>setAge(k)}>{AGES[k].n}</button>)}</div></div>
    {mode==='chrono'?<>
     <div className={ph==='idle'?'':'dis'}><Pills l="Durée du comptage" v={dur} on={setDur} o={[['15','15 s × 4'],['30','30 s × 2'],['60','60 s × 1']]}/></div>
     <div className="dialw"><button type="button" className={'dial'+(ph==='done'?' done':'')} disabled={ph!=='idle'} onClick={start} aria-label={ph==='idle'?`Démarrer le chronomètre de ${D} secondes`:ph==='run'?`${left} secondes restantes`:'Comptage terminé'}>
      <svg viewBox="0 0 200 200" aria-hidden="true"><circle className="tr" cx="100" cy="100" r={R}/><circle className="pg" cx="100" cy="100" r={R} strokeDasharray={circ} strokeDashoffset={circ*(1-frac)} transform="rotate(-90 100 100)"/></svg>
      <span className="dc">{ph==='idle'?<><b>{D}<small> s</small></b><span>Touche le cercle pour démarrer</span></>
       :ph==='run'?<><b>{left}</b><span>Compte les battements</span></>
       :<><b><Icon n="check" s={44}/></b><span>Terminé</span></>}</span></button></div>
     {ph==='run'&&<button type="button" className="rst" onClick={reset}><Icon n="close" s={16}/>Annuler</button>}
     {ph==='done'&&<label className="bigl">{`Battements comptés en ${D} s`}<input className="big" inputMode="numeric" autoFocus autoComplete="off" value={cnt} placeholder="0" onChange={e=>setCnt(e.target.value.replace(/\D/g,'').slice(0,3))}/></label>}
     {ph==='idle'&&<p className="disc">Le cercle se remplit pendant le comptage. Un bip et une vibration signalent la fin : tu n'as plus à toucher l'écran avant.</p>}
    </>:<label className="bigl">Fréquence cardiaque (bpm)<input className="big" inputMode="numeric" autoComplete="off" value={man} placeholder="ex. 80" onChange={e=>setMan(e.target.value.replace(/[^\d]/g,'').slice(0,3))}/></label>}
    {saved&&<Verdict tone="ok" t="Mesure enregistrée sur cet appareil"/>}
    {has?<>
     {odd&&<Verdict tone="wa" t="Valeur inhabituelle : vérifie le comptage."/>}
     <Res k="Fréquence cardiaque" big={String(bpm)} unit="bpm" line={mode==='chrono'?`${n} battements × ${60/D} (${D} s)`:undefined}/>
     <Scale min={A.lo*.5} max={A.hi*1.6} v={bpm} seg={[{to:A.lo,t:'wa',l:`<${A.lo}`},{to:A.hi,t:'ok',l:`${A.lo}–${A.hi}`},{to:A.hi*1.6,t:'wa',l:`>${A.hi}`}]}/>
     <Verdict tone={v[0]} t={v[1]}>{v[2]}</Verdict>
     <button type="button" className="save" onClick={save}>Enregistrer la mesure</button></>
    :!saved&&mode==='manuel'&&<Empty t="Saisis la fréquence mesurée pour la comparer à la plage normale."/>}
   </div>
   <h3 className="lh" style={{marginTop:24}}>Dernières mesures</h3>
   {hist.length===0?<Empty t="Aucune mesure enregistrée pour l'instant."/>
   :<ul className="hl">{hist.map(r=>{const a=AGES[r.a as AgeK];return <li key={r.id} className="hi"><div className="tx"><b>{r.v}<small> bpm</small></b>
     <span>{when(r.t)} · {r.m==='chrono'?`${r.n} bat. en ${r.d} s`:'saisie manuelle'}{a?` · ${a.n.split(' (')[0]}`:''}</span></div>
     <button type="button" className="x" aria-label="Supprimer cette mesure" onClick={()=>confirm('Supprimer cette mesure ?')&&del(r.id)}><Icon n="close" s={18}/></button></li>})}</ul>}
  </div>
  <div hidden={tab!=='u'}><Learn doc={FCDOC}/>
   <KV rows={Object.values(AGES).map(a=>[a.n,`${a.lo} – ${a.hi} bpm`] as [string,string])}/></div>
 </>}

/* ====== Écran Suivi ====== */
export default function Vitals(){
 const[rd,setRd]=useLS<Reading[]>('rv-vitals',[]),[sel,setSel]=useState<string|null>(null)
 const add=(r:NewR)=>setRd(s=>[{...r,id:Date.now(),t:Date.now()},...s].slice(0,300))
 const del=(id:number)=>setRd(s=>s.filter(r=>r.id!==id))
 const p=PARAMS.find(x=>x.k===sel)
 if(p){
  return <div className="page"><div className="top"><div><small>Suivi</small><h1 className="sm">{p.n}</h1></div>
   <button className="ib" onClick={()=>setSel(null)} aria-label="Retour au suivi"><Icon n="back"/></button></div>
   <div className="cx">{p.k==='fc'&&<FC rd={rd} add={add} del={del}/>}</div></div>}
 const recent=rd.slice(0,5)
 return <div className="page"><div className="top"><div><small>Paramètres vitaux</small><h1>Suivi</h1></div></div>
  <div className="cx"><div className="grid vg">{PARAMS.map(x=>{const last=rd.find(r=>r.k===x.k)
   return <Tilt key={x.k} className={'mod'+(x.on?'':' lock')} disabled={!x.on} onClick={()=>x.on&&setSel(x.k)}>
    <div className="em" aria-hidden="true">{x.code}</div><h4>{x.n}</h4>
    <small>{!x.on?'Bientôt':last?`${last.v} ${x.u}`:'Aucune mesure'}</small>{!x.on&&<span className="lk"><Icon n="lock" s={16}/></span>}</Tilt>})}</div>
   {recent.length>0&&<><h3 className="lh" style={{marginTop:28}}>Dernières mesures</h3>
    <ul className="hl">{recent.map(r=>{const q=PARAMS.find(x=>x.k===r.k)!;return <li key={r.id} className="hi"><div className="tx"><b>{r.v}<small> {q.u}</small></b><span>{q.n} · {when(r.t)}</span></div></li>})}</ul></>}
   <p className="disc">Les mesures restent sur cet appareil. Elles ne sont envoyées nulle part.</p></div></div>
}