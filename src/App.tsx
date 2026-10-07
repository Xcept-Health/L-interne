import {useEffect,useState} from 'react'
import {AnimatePresence,motion} from 'framer-motion'
import {MODULES,Module} from './data'
import Study from './Study'
import {Icon,Tilt} from './ui'
export interface Prog{st:Record<number,'k'|'n'|'d'>;fav:Record<number,boolean>}
type Role='Interne'|'Résident'|'Étudiant'; interface Profile{name:string;role:Role}
type Theme='auto'|'light'|'dark'; type Tab='home'|'study'|'me'
function useLS<T>(k:string,i:T){const[v,s]=useState<T>(()=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):i}catch{return i}})
 useEffect(()=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}},[k,v]);return[v,s] as const}
const ROLES:Role[]=['Interne','Résident','Étudiant']

function Splash({first,onDone}:{first:boolean;onDone:()=>void}){
 useEffect(()=>{if(!first){const t=setTimeout(onDone,1300);return()=>clearTimeout(t)}},[first,onDone])
 return <motion.div className="splash" exit={{opacity:0}}>
  <motion.div className="logo3d" initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} transition={{duration:.5}}>
   <span>L</span></motion.div>
  <motion.h1 initial={{y:16,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:.4}}>l'interne</motion.h1>
  <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.7}}>Ta révision médicale,<br/>fluide comme un swipe.</motion.p>
  {first&&<motion.button className="cta" onClick={onDone} initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:1}}>Commencer</motion.button>}
 </motion.div>
}

function Onboard({onSave}:{onSave:(p:Profile)=>void}){
 const [name,setName]=useState(''),[role,setRole]=useState<Role>('Étudiant')
 return <motion.div className="onb" initial={{x:60,opacity:0}} animate={{x:0,opacity:1}}>
  <h1>Faisons connaissance</h1><p>Comment dois-je t'appeler ?</p>
  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ton prénom ou nom" aria-label="Ton prénom ou nom" autoFocus/>
  <p>Tu es…</p>
  <div className="roles">{ROLES.map(r=><Tilt key={r} className={'role'+(role===r?' on':'')} pressed={role===r} onClick={()=>setRole(r)}>{r}</Tilt>)}</div>
  <button className="cta" disabled={!name.trim()} onClick={()=>onSave({name:name.trim(),role})}>Entrer</button>
 </motion.div>
}

/** Anneau de progression en SVG (aucun dégradé) */
function Ring({v}:{v:number}){
 const r=36,c=2*Math.PI*r
 return <div className="ring" role="img" aria-label={`${v} pour cent retenus`}>
  <svg viewBox="0 0 84 84" width="84" height="84"><circle className="trk" cx="42" cy="42" r={r}/>
   <circle className="val" cx="42" cy="42" r={r} strokeDasharray={c} strokeDashoffset={c*(1-v/100)} transform="rotate(-90 42 42)"/></svg>
  <b>{v}%</b></div>
}

function Home({me,p,go,theme,setTheme}:{me:Profile;p:Prog;go:(m:Module)=>void;theme:Theme;setTheme:()=>void}){
 const g=MODULES[0].cards!,known=g.filter(c=>p.st[c.id]==='k').length,pc=Math.round(known/g.length*100)
 const h=new Date().getHours(),hi=h<5||h>=18?'Bonsoir':'Bonjour'
 return <div className="page">
  <div className="top"><div><small>{hi},</small><h1>{me.name}</h1><span className="role-tag">{me.role}</span></div>
   <button className="ib" onClick={setTheme} aria-label="Changer de thème"><Icon n={theme==='dark'?'moon':'sun'}/></button></div>
  <Tilt className="hero" onClick={()=>go(MODULES[0])}>
   <Ring v={pc}/>
   <div><h3>Continuer la révision</h3><p>{MODULES[0].name}<br/>{known} sur {g.length} fiches retenues</p></div></Tilt>
  <h2 className="sec">Modules</h2>
  <div className="grid">{MODULES.map((m,i)=><motion.div key={m.key} initial={{y:16,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:.08+i*.05}}>
   <Tilt className={'mod'+(m.cards?'':' lock')} disabled={!m.cards} onClick={()=>m.cards&&go(m)}>
    <h4>{m.name}</h4><small>{m.sub}</small>{!m.cards&&<span className="lk"><Icon n="lock" s={16}/></span>}</Tilt></motion.div>)}</div>
 </div>
}

function Me({me,setMe,theme,setTheme,reset}:{me:Profile;setMe:(p:Profile)=>void;theme:Theme;setTheme:(t:Theme)=>void;reset:()=>void}){
 return <div className="page"><div className="top"><h1>Profil</h1></div>
  <label className="fld">Nom<input value={me.name} onChange={e=>setMe({...me,name:e.target.value})}/></label>
  <div className="fld">Statut<div className="pills">{ROLES.map(r=><button key={r} className={me.role===r?'on':''} aria-pressed={me.role===r} onClick={()=>setMe({...me,role:r})}>{r}</button>)}</div></div>
  <div className="fld">Thème<div className="pills">{(['auto','light','dark'] as Theme[]).map(t=><button key={t} className={theme===t?'on':''} aria-pressed={theme===t} onClick={()=>setTheme(t)}>{t==='auto'?'Auto':t==='light'?'Clair':'Sombre'}</button>)}</div></div>
  <button className="danger" onClick={()=>confirm('Effacer toute ta progression ?')&&reset()}>Réinitialiser la progression</button></div>
}

export default function App(){
 const [me,setMe]=useLS<Profile|null>('rv-me',null),[theme,setTheme]=useLS<Theme>('rv-theme','auto')
 const [p,setP]=useLS<Prog>('gy',{st:{},fav:{}}),[seen,setSeen]=useLS('rv-seen',false)
 const [splash,setSplash]=useState(true),[tab,setTab]=useState<Tab>('home'),[mod,setMod]=useState<Module>(MODULES[0])
 useEffect(()=>{const r=document.documentElement;theme==='auto'?r.removeAttribute('data-theme'):r.setAttribute('data-theme',theme)},[theme])
 const cycle=()=>setTheme(theme==='dark'?'light':'dark')
 const nav:[Tab,string,string][]=[['home','home','Accueil'],['study','cards','Réviser'],['me','user','Profil']]
 return <div className="stage"><div className="device">
  <AnimatePresence>{splash&&<Splash key="s" first={!seen} onDone={()=>{setSeen(true);setSplash(false)}}/>}</AnimatePresence>
  {!splash&&!me&&<Onboard onSave={setMe}/>}
  {!splash&&me&&<>
   <AnimatePresence mode="wait"><motion.main key={tab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:.2}}>
    {tab==='home'&&<Home me={me} p={p} theme={theme} setTheme={cycle} go={m=>{setMod(m);setTab('study')}}/>}
    {tab==='study'&&<div className="page"><div className="top"><div><small>Module</small><h1 className="sm">{mod.name}</h1></div><button className="ib" onClick={()=>setTab('home')} aria-label="Retour"><Icon n="back"/></button></div>
     <Study cards={mod.cards!} p={p} setP={f=>setP(f)}/></div>}
    {tab==='me'&&<Me me={me} setMe={setMe} theme={theme} setTheme={setTheme} reset={()=>setP({st:{},fav:{}})}/>}
   </motion.main></AnimatePresence>
   <nav className="tabbar" aria-label="Navigation principale">{nav.map(([k,i,l])=><button key={k} className={tab===k?'on':''} aria-label={l} aria-current={tab===k?'page':undefined} onClick={()=>setTab(k)}>
    {tab===k&&<motion.i layoutId="tab"/>}<Icon n={i}/><span>{l}</span></button>)}</nav></>}
 </div></div>
}