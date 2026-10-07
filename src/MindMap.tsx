import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react'
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion'
import type {Card} from './data'
import {Icon} from './ui'
const RX=4,RW=104,NX=150,NW=206,LH=15
interface Box{x:number;y:number;w:number;h:number;l:string[]}
type Off=Record<string,{x:number;y:number}>
type Geo=ReturnType<typeof geo>
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v))

function wrap(t:string,n:number){const L:string[]=[];let c=''
 for(const w of t.split(' ')){if((c+' '+w).trim().length>n&&c){L.push(c);c=w}else c=(c+' '+w).trim()}
 if(c)L.push(c);return L}

function base(d:Card){
 let y=0
 const raw=d.it.map(t=>{const l=wrap(t,29),h=l.length*LH+14,n={l,y,h};y+=h+8;return n})
 const root=wrap(d.q,13),rh=root.length*16+20,used=y-8,H=Math.max(used,rh,110),off=(H-used)/2
 return{root:{x:RX,y:H/2-rh/2,w:RW,h:rh,l:root} as Box,nodes:raw.map(n=>({x:NX,y:n.y+off,w:NW,h:n.h,l:n.l})) as Box[]}
}

/** Géométrie unique partagée par l'affichage, le PNG et le SVG : les trois restent identiques.
 *  `o` = décalages choisis par l'utilisateur en déplaçant les nœuds (clé 'r' = racine). */
export function geo(d:Card,o:Off={}){
 const b=base(d),mv=(k:string,a:Box):Box=>{const s=o[k];return s?{...a,x:a.x+s.x,y:a.y+s.y}:a}
 const root=mv('r',b.root),nodes=b.nodes.map((n,i)=>mv(String(i),n))
 const ln=nodes.map(n=>{const L=n.x+n.w/2<root.x+root.w/2
  return{x1:L?root.x:root.x+root.w,y1:root.y+root.h/2,x2:L?n.x+n.w:n.x,y2:n.y+n.h/2}})
 const links=ln.map(l=>{const m=(l.x1+l.x2)/2;return`M${l.x1} ${l.y1}C${m} ${l.y1} ${m} ${l.y2} ${l.x2} ${l.y2}`})
 const all=[root,...nodes],x0=Math.min(...all.map(a=>a.x)),y0=Math.min(...all.map(a=>a.y))
 const x1=Math.max(...all.map(a=>a.x+a.w)),y1=Math.max(...all.map(a=>a.y+a.h))
 return{root,nodes,ln,links,bb:{x:x0,y:y0,w:x1-x0,h:y1-y0}}
}

function Shapes({g,calm,live}:{g:Geo;calm:boolean|null;live?:boolean}){
 const r=g.root,cls='mm-g'+(live?' live':'')
 return <>
  {g.links.map((p,i)=><motion.path key={i} className="mm-l" d={p} initial={calm?false:{pathLength:0}} animate={{pathLength:1}} transition={{delay:.1+i*.05,duration:.4}}/>)}
  {g.nodes.map((n,i)=><motion.g key={i} data-k={i} className={cls} initial={calm?false:{opacity:0}} animate={{opacity:1}} transition={{delay:.25+i*.05}}>
   <rect className="mm-n" x={n.x} y={n.y} width={n.w} height={n.h} rx="10"/>
   <text className="mm-t" fontSize="12">{n.l.map((s,k)=><tspan key={k} x={n.x+10} y={n.y+7+k*LH+11}>{s}</tspan>)}</text>
  </motion.g>)}
  <g data-k="r" className={cls}>
   <rect className="mm-r" x={r.x} y={r.y} width={r.w} height={r.h} rx="12"/>
   <text className="mm-rt" fontSize="13" textAnchor="middle">{r.l.map((s,k)=><tspan key={k} x={r.x+r.w/2} y={r.y+10+k*16+12}>{s}</tspan>)}</text>
  </g>
 </>
}

/** Aperçu compact (face arrière de la carte). */
export default function MindMap({d}:{d:Card}){
 const g=useMemo(()=>geo(d),[d]),calm=useReducedMotion(),b=g.bb
 return <svg viewBox={`${b.x-4} ${b.y-4} ${b.w+8} ${b.h+8}`} width="100%" role="img" aria-label={`Carte mentale : ${d.q}`}><Shapes g={g} calm={calm}/></svg>
}

/** Visionneuse plein écran : déplacement, zoom (molette / pincement / boutons), nœuds déplaçables, export. */
export function MindMapViewer({d,onClose,onHome}:{d:Card;onClose:()=>void;onHome:()=>void}){
 const calm=useReducedMotion()
 const [off,setOff]=useState<Off>({}),g=useMemo(()=>geo(d,off),[d,off])
 const [t,setT]=useState({x:0,y:0,k:1}),[menu,setMenu]=useState(false),[toast,setToast]=useState(''),[hint,setHint]=useState(true)
 const box=useRef<HTMLDivElement>(null),hdr=useRef<HTMLElement>(null),tb=useRef<HTMLDivElement>(null)
 const gr=useRef(g),touched=useRef(false),tm=useRef(0),mr=useRef(false),kb=useRef<(e:KeyboardEvent)=>void>()
 const ps=useRef(new Map<number,{x:number;y:number}>()),dr=useRef<string|null>(null)
 gr.current=g;mr.current=menu

 const fit=useCallback(()=>{const el=box.current;if(!el)return
  const b=gr.current.bb,W=el.clientWidth,H=el.clientHeight,top=(hdr.current?.offsetHeight??72)+8,bot=H-(tb.current?.offsetTop??H-96)+8
  const k=clamp(Math.min((W-40)/b.w,(H-top-bot)/b.h),.25,2.4)
  setT({k,x:W/2-(b.x+b.w/2)*k,y:top+(H-top-bot)/2-(b.y+b.h/2)*k})},[])
 useLayoutEffect(()=>{fit();const ro=new ResizeObserver(()=>{if(!touched.current)fit()});ro.observe(box.current!);return()=>ro.disconnect()},[fit])
 const refit=()=>{touched.current=false;fit()}
 const zoomAt=useCallback((cx:number,cy:number,f:number)=>setT(s=>{const k=clamp(s.k*f,.25,4),r=k/s.k;return{k,x:cx-(cx-s.x)*r,y:cy-(cy-s.y)*r}}),[])
 const zoomC=(f:number)=>{const el=box.current!;touched.current=true;zoomAt(el.clientWidth/2,el.clientHeight/2,f)}

 useEffect(()=>{const el=box.current!
  const f=(e:WheelEvent)=>{e.preventDefault();touched.current=true;const b=el.getBoundingClientRect()
   zoomAt(e.clientX-b.left,e.clientY-b.top,Math.exp(-e.deltaY*(e.ctrlKey?.01:.0015)))}
  el.addEventListener('wheel',f,{passive:false});return()=>el.removeEventListener('wheel',f)},[zoomAt])
 kb.current=e=>{if(e.key==='Escape')mr.current?setMenu(false):onClose()
  else if(e.key==='+'||e.key==='=')zoomC(1.25);else if(e.key==='-')zoomC(.8);else if(e.key==='0')refit()}
 useEffect(()=>{const f=(e:KeyboardEvent)=>kb.current?.(e);addEventListener('keydown',f);return()=>removeEventListener('keydown',f)},[])
 useEffect(()=>()=>clearTimeout(tm.current),[])

 const down=(e:React.PointerEvent<HTMLDivElement>)=>{
  touched.current=true;setHint(false);setMenu(false)
  e.currentTarget.setPointerCapture(e.pointerId)
  ps.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
  dr.current=ps.current.size===1?((e.target as Element).closest('[data-k]')?.getAttribute('data-k')??null):null}
 const move=(e:React.PointerEvent<HTMLDivElement>)=>{
  const p=ps.current.get(e.pointerId);if(!p)return
  const n={x:e.clientX,y:e.clientY}
  if(ps.current.size===1){const dx=n.x-p.x,dy=n.y-p.y,k=dr.current
   if(k!==null)setOff(o=>({...o,[k]:{x:(o[k]?.x??0)+dx/t.k,y:(o[k]?.y??0)+dy/t.k}}))
   else setT(s=>({...s,x:s.x+dx,y:s.y+dy}))
  }else if(ps.current.size===2){
   const [a,b]=[...ps.current.values()],pc={x:(a.x+b.x)/2,y:(a.y+b.y)/2},pd=Math.hypot(a.x-b.x,a.y-b.y)
   ps.current.set(e.pointerId,n)
   const [a2,b2]=[...ps.current.values()],nc={x:(a2.x+b2.x)/2,y:(a2.y+b2.y)/2},nd=Math.hypot(a2.x-b2.x,a2.y-b2.y)
   const r=box.current!.getBoundingClientRect()
   setT(s=>{const k=clamp(s.k*(nd/(pd||1)),.25,4),wx=(pc.x-r.left-s.x)/s.k,wy=(pc.y-r.top-s.y)/s.k
    return{k,x:nc.x-r.left-wx*k,y:nc.y-r.top-wy*k}})
   return}
  ps.current.set(e.pointerId,n)}
 const up=(e:React.PointerEvent<HTMLDivElement>)=>{ps.current.delete(e.pointerId);dr.current=null
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}

 const flash=(m:string)=>{setToast(m);clearTimeout(tm.current);tm.current=window.setTimeout(()=>setToast(''),2200)}
 const run=async(f:'png'|'svg')=>{setMenu(false)
  try{await(f==='png'?exportPng:exportSvg)(d,off);flash(f==='png'?'Image PNG enregistrée':'Fichier SVG enregistré')}catch{flash('Export impossible')}}
 const moved=Object.keys(off).length>0

 return <motion.div className="mv" role="dialog" aria-modal="true" aria-label={`Carte mentale : ${d.q}`}
  initial={calm?false:{opacity:0,scale:.985}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:.2}}>
  <div className="bgfx" aria-hidden="true"><i/><i/><i/></div>
  <div className="mv-cv" ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
   onDoubleClick={e=>{if(!(e.target as Element).closest('[data-k]'))refit()}}>
   <svg width="100%" height="100%" aria-hidden="true">
    <defs><pattern id="mv-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" className="mv-dot"/></pattern></defs>
    <g transform={`translate(${t.x} ${t.y}) scale(${t.k})`}>
     <rect x="-4000" y="-4000" width="8000" height="8000" fill="url(#mv-dots)"/>
     <Shapes g={g} calm={calm} live/>
    </g>
   </svg>
  </div>
  <ul className="sr">{d.it.map((s,i)=><li key={i}>{s}</li>)}</ul>
  <header className="mv-top" ref={hdr}>
   <button className="ib" onClick={onClose} aria-label="Fermer la carte" autoFocus><Icon n="back"/></button>
   <div className="mv-ti"><small>Q{d.id} · carte mentale · {d.it.length} nœuds</small><b>{d.q}</b></div>
   <button className="pill" onClick={onHome}><Icon n="home" s={18}/><span>Accueil</span></button>
  </header>
  <AnimatePresence>{hint&&<motion.p className="mv-hint" exit={{opacity:0}}>Glisse · pince pour zoomer · déplace un nœud</motion.p>}</AnimatePresence>
  <div className="mv-tb" ref={tb} role="toolbar" aria-label="Contrôles de la carte">
   <button className="tb" onClick={()=>zoomC(.8)} aria-label="Zoom arrière"><Icon n="minus"/></button>
   <button className="zv" onClick={refit} aria-label="Ajuster à l'écran">{Math.round(t.k*100)}%</button>
   <button className="tb" onClick={()=>zoomC(1.25)} aria-label="Zoom avant"><Icon n="plus"/></button>
   <i className="sep"/>
   <button className="tb" onClick={refit} aria-label="Recentrer la carte"><Icon n="fit"/></button>
   {moved&&<button className="tb" onClick={()=>{setOff({});setTimeout(refit,0)}} aria-label="Réinitialiser la disposition"><Icon n="flip" s={20}/></button>}
   <i className="sep"/>
   <button className="tb pri" aria-haspopup="menu" aria-expanded={menu} onClick={()=>{setHint(false);setMenu(m=>!m)}}><Icon n="download" s={18}/><span>Exporter</span></button>
  </div>
  <AnimatePresence>{menu&&<motion.div className="mv-menu" role="menu" aria-label="Export de la carte"
   initial={calm?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} transition={{duration:.16}}>
   <small>Exporter la carte</small>
   <button className="mi" role="menuitem" onClick={()=>run('png')}><span className="ext">PNG</span><span className="tx"><b>Image</b><em>Prête à partager</em></span></button>
   <button className="mi" role="menuitem" onClick={()=>run('svg')}><span className="ext">SVG</span><span className="tx"><b>Vectoriel</b><em>Net à toute taille</em></span></button>
  </motion.div>}</AnimatePresence>
  <AnimatePresence>{toast&&<motion.div className="mv-toast" role="status" initial={calm?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>{toast}</motion.div>}</AnimatePresence>
 </motion.div>
}

/* ---------- Exports : dessinés depuis la même géométrie (positions des nœuds déplacés incluses) ---------- */
const col=()=>{const cs=getComputedStyle(document.documentElement),v=(k:string)=>cs.getPropertyValue(k).trim()
 return{bg:v('--bg'),surf:v('--surf'),edge:v('--edge'),m:v('--m'),t:v('--t'),ink:v('--ink'),on:v('--on')}}
const FF='Figtree,system-ui,sans-serif',PX=28,FT=30
const rr=(x:CanvasRenderingContext2D,a:number,b:number,w:number,h:number,r:number)=>{x.beginPath();x.moveTo(a+r,b)
 x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
function save(b:Blob,name:string){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}

export async function exportPng(d:Card,o:Off={}){
 await document.fonts?.ready
 const g=geo(d,o),c=col(),w=g.bb.w+PX*2,h=g.bb.h+PX*2+FT,S=Math.min(3,8192/Math.max(w,h))
 const cv=document.createElement('canvas');cv.width=Math.round(w*S);cv.height=Math.round(h*S)
 const x=cv.getContext('2d')!;x.scale(S,S);x.fillStyle=c.bg;x.fillRect(0,0,w,h)
 x.fillStyle=c.m;x.textAlign='left';x.font=`600 11px ${FF}`;x.fillText(`l'interne · Q${d.id}`,PX,h-PX*.55)
 x.translate(PX-g.bb.x,PX-g.bb.y)
 x.lineWidth=1.5;x.strokeStyle=c.m;x.globalAlpha=.55
 g.ln.forEach(l=>{const m=(l.x1+l.x2)/2;x.beginPath();x.moveTo(l.x1,l.y1);x.bezierCurveTo(m,l.y1,m,l.y2,l.x2,l.y2);x.stroke()})
 x.globalAlpha=1;x.lineWidth=1;x.strokeStyle=c.edge
 g.nodes.forEach(n=>{rr(x,n.x,n.y,n.w,n.h,10);x.fillStyle=c.surf;x.fill();x.stroke()
  x.fillStyle=c.t;x.font=`500 12px ${FF}`;x.textAlign='left';n.l.forEach((s,k)=>x.fillText(s,n.x+10,n.y+7+k*LH+11))})
 const r=g.root;rr(x,r.x,r.y,r.w,r.h,12);x.fillStyle=c.ink;x.fill()
 x.fillStyle=c.on;x.textAlign='center';x.font=`600 13px ${FF}`;r.l.forEach((s,k)=>x.fillText(s,r.x+r.w/2,r.y+10+k*16+12))
 const blob=await new Promise<Blob|null>(res=>cv.toBlob(res,'image/png'))
 if(!blob)throw new Error('png')
 save(blob,`carte-q${d.id}.png`)
}

const esc=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
export async function exportSvg(d:Card,o:Off={}){
 await document.fonts?.ready
 const g=geo(d,o),c=col(),w=g.bb.w+PX*2,h=g.bb.h+PX*2+FT
 let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FF}">`
 s+=`<rect width="${w}" height="${h}" fill="${c.bg}"/>`
 s+=`<text x="${PX}" y="${h-PX*.55}" font-size="11" font-weight="600" fill="${c.m}">l'interne · Q${d.id}</text>`
 s+=`<g transform="translate(${PX-g.bb.x} ${PX-g.bb.y})">`
 g.links.forEach(p=>{s+=`<path d="${p}" fill="none" stroke="${c.m}" stroke-opacity=".55" stroke-width="1.5"/>`})
 g.nodes.forEach(n=>{s+=`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="10" fill="${c.surf}" stroke="${c.edge}"/>`
  s+=`<text font-size="12" font-weight="500" fill="${c.t}">${n.l.map((l,k)=>`<tspan x="${n.x+10}" y="${n.y+7+k*LH+11}">${esc(l)}</tspan>`).join('')}</text>`})
 const r=g.root
 s+=`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="12" fill="${c.ink}"/>`
 s+=`<text font-size="13" font-weight="600" text-anchor="middle" fill="${c.on}">${r.l.map((l,k)=>`<tspan x="${r.x+r.w/2}" y="${r.y+10+k*16+12}">${esc(l)}</tspan>`).join('')}</text></g></svg>`
 save(new Blob([s],{type:'image/svg+xml'}),`carte-q${d.id}.svg`)
}