import {useState} from 'react'
import {createPortal} from 'react-dom'
import {AnimatePresence,motion,animate,useMotionValue,useTransform,useDragControls} from 'framer-motion'
import type {PanInfo} from 'framer-motion'
import {Card} from './data'
import {Icon} from './ui'
import MindMap,{MindMapViewer} from './MindMap'
import type {Prog} from './App'
import {useBackLayer} from './nav'
type A='k'|'n'|'d'; type F='all'|'rev'|'fav'
const buzz=()=>navigator.vibrate?.(12)

function Deck({d,p,onAct,onFav,onMap}:{d:Card;p:Prog;onAct:(a:A)=>void;onFav:()=>void;onMap:()=>void}){
 const [flip,setFlip]=useState(false),[map,setMap]=useState(false),ctl=useDragControls()
 const x=useMotionValue(0),y=useMotionValue(0),rot=useTransform(x,[-200,200],[-14,14])
 const ok=useTransform(x,[0,90],[0,1]),no=useTransform(x,[0,-90],[0,1]),db=useTransform(y,[0,-90],[0,1])
 const fly=async(a:A)=>{buzz();const tx=a==='k'?700:a==='n'?-700:0,ty=a==='d'?-800:0
  await Promise.all([animate(x,tx,{duration:.26,ease:[.32,.72,0,1]}),animate(y,ty,{duration:.26,ease:[.32,.72,0,1]})]);onAct(a)}
 const end=(_:unknown,i:PanInfo)=>{const{x:ox,y:oy}=i.offset,{x:vx,y:vy}=i.velocity
  if(Math.abs(ox)>Math.abs(oy)&&(Math.abs(ox)>90||(Math.abs(vx)>550&&Math.abs(ox)>30)))fly(ox>0?'k':'n')
  else if(oy<-90||(vy<-550&&oy<-30))fly('d')}
 const st=p.st[d.id],fav=!!p.fav[d.id]
 return <>
 <motion.div className="card" drag dragControls={ctl} dragListener={false} dragSnapToOrigin dragElastic={.85} dragMomentum={false} dragTransition={{bounceStiffness:420,bounceDamping:28}}
  style={{x,y,rotate:rot}} onDragEnd={end} initial={{scale:.92,opacity:0}} animate={{scale:1,opacity:1}}
  onTap={()=>!flip&&setFlip(true)} exit={{opacity:0}}>
  <motion.div className="stamp k" style={{opacity:ok}}>Retenu</motion.div>
  <motion.div className="stamp n" style={{opacity:no}}>Pas retenu</motion.div>
  <motion.div className="stamp d" style={{opacity:db}}>Doute</motion.div>
  <motion.div className="flipper" animate={{rotateY:flip?180:0}} transition={{type:'spring',stiffness:140,damping:17}}>
   <div className="face front" onPointerDown={e=>ctl.start(e)}>
    <motion.svg className="ms" viewBox="-60 -50 120 100" animate={{y:[0,-6,0]}} transition={{repeat:Infinity,duration:3.2}}>
     <path fill="var(--fill)" stroke="var(--edge)" strokeWidth="2" d="M-48 8C-52-22-30-38-12-34C0-46 28-44 34-26C54-24 58 4 46 18C40 36-40 36-48 8Z"/>
     <circle cx="-14" cy="-6" r="5" fill="var(--t)"/><circle cx="14" cy="-6" r="5" fill="var(--t)"/>
     <path d="M-12 6Q0 20 12 6" fill="none" stroke="var(--t)" strokeWidth="4" strokeLinecap="round"/></motion.svg>
    <div className="meta">Q{d.id} · {d.it.length} éléments</div><h2>{d.q}</h2>
    <div className="chips">{st==='n'&&<span>à revoir</span>}{st==='d'&&<span>doute</span>}{fav&&<span>favori</span>}</div>
    <div className="hint">Touche pour retourner · glisse pour noter</div>
   </div>
   <div className="face back">
    <div className="hd" onPointerDown={e=>ctl.start(e)}><div className="meta">Q{d.id}</div><h3>{d.q}</h3></div>
    <div className="bd"><div className="tools"><button className="sw" onClick={()=>setMap(!map)}>{map?'Liste':'Carte mentale'}</button>{map&&<button className="sw" onClick={onMap}><Icon n="fit" s={16}/>Agrandir &amp; exporter</button>}</div>
     {map?<button className="mm-open" onClick={onMap} aria-label="Agrandir la carte mentale"><MindMap d={d}/></button>:<ul>{d.it.map((t,i)=><motion.li key={i} initial={{opacity:0,x:16}} animate={{opacity:flip?1:0,x:0}} transition={{delay:.25+i*.05}}>{t}</motion.li>)}</ul>}</div>
    <button className="fl" onClick={()=>setFlip(false)} aria-label="Retourner"><Icon n="flip" s={18}/></button>
   </div>
  </motion.div>
  <button className={'fv'+(fav?' on':'')} onClick={e=>{e.stopPropagation();onFav()}} onPointerDown={e=>e.stopPropagation()}><Icon n="star" s={18}/></button>
 </motion.div>
 <div className="bt">
  <button onClick={()=>fly('n')}>Pas retenu</button><button onClick={()=>fly('d')}>Doute</button>
  <button className="main" onClick={()=>fly('k')}>Retenu</button></div></>
}

export default function Study({cards,p,setP,onHome}:{cards:Card[];p:Prog;setP:(f:(p:Prog)=>Prog)=>void;onHome:()=>void}){
 const [f,setF]=useState<F>('all'),[mm,setMm]=useState<Card|null>(null)
 useBackLayer(!!mm,()=>setMm(null))
 const build=(m:F)=>cards.filter(d=>m==='fav'?p.fav[d.id]:m==='rev'?'nd'.includes(p.st[d.id]||'-'):p.st[d.id]!=='k').map(d=>d.id)
 const [Q,setQ]=useState<number[]>(()=>build('all'))
 const pick=(m:F)=>{setF(m);setQ(build(m))}
 const act=(a:A)=>{const id=Q[0];setP(s=>({...s,st:{...s.st,[id]:a}}))
  setQ(q=>{const r=q.slice(1);if(a==='n')r.splice(Math.min(3,r.length),0,id);if(a==='d')r.splice(Math.min(8,r.length),0,id);return r})}
 const fav=()=>setP(s=>({...s,fav:{...s.fav,[Q[0]]:!s.fav[Q[0]]}}))
 const d=Q.length?cards.find(c=>c.id===Q[0])!:null
 const known=cards.filter(c=>p.st[c.id]==='k').length
 return <div className="study">
  <div className="seg">{([['all','À réviser'],['rev','À revoir'],['fav','Favoris']] as [F,string][]).map(([k,l])=>
   <button key={k} className={f===k?'on':''} onClick={()=>pick(k)}>{f===k&&<motion.i layoutId="seg"/>}<span>{l}</span></button>)}</div>
  <div className="st">{known}/{cards.length} retenues · {Q.length} dans la pile</div>
  <div className="pb"><motion.i animate={{width:`${known/cards.length*100}%`}}/></div>
  <div className="deck">{Q.length>2&&<div className="gh g2"/>}{Q.length>1&&<div className="gh g1"/>}
   {d?<Deck key={d.id+'-'+Q.length} d={d} p={p} onAct={act} onFav={fav} onMap={()=>setMm(d)}/>:<div className="done"> Hourra ! Pile terminée.<br/>Change le filtre pour continuer.</div>}</div>
  {createPortal(<AnimatePresence>{mm&&<MindMapViewer key={mm.id} d={mm} onClose={()=>setMm(null)} onHome={onHome}/>}</AnimatePresence>,document.body)}
 </div>
}