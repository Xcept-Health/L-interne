import {motion} from 'framer-motion'
import type {Card} from './data'
const RX=4,RW=104,NX=150,NW=206,LH=15

function wrap(t:string,n:number){const L:string[]=[];let c=''
 for(const w of t.split(' ')){if((c+' '+w).trim().length>n&&c){L.push(c);c=w}else c=(c+' '+w).trim()}
 if(c)L.push(c);return L}

/** Mise en page partagée par l'affichage SVG et l'export PNG : les deux restent identiques. */
export function layout(d:Card){
 let y=0
 const raw=d.it.map(t=>{const l=wrap(t,29),h=l.length*LH+14,n={l,y,h};y+=h+8;return n})
 const root=wrap(d.q,13),rh=root.length*16+20,used=y-8,H=Math.max(used,rh,110),off=(H-used)/2
 return{nodes:raw.map(n=>({...n,y:n.y+off})),root,rh,H,cy:H/2}
}

export default function MindMap({d}:{d:Card}){
 const m=layout(d)
 return <svg viewBox={`0 0 360 ${m.H}`} width="100%" role="img" aria-label={`Carte mentale : ${d.q}`}>
  {m.nodes.map((n,i)=>{const c=n.y+n.h/2
   return <g key={i}>
    <motion.path className="mm-l" d={`M${RX+RW} ${m.cy}C130 ${m.cy} 130 ${c} ${NX} ${c}`} initial={{pathLength:0}} animate={{pathLength:1}} transition={{delay:.1+i*.05,duration:.4}}/>
    <motion.g initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.25+i*.05}}>
     <rect className="mm-n" x={NX} y={n.y} width={NW} height={n.h} rx="10"/>
     <text className="mm-t" fontSize="12">{n.l.map((s,k)=><tspan key={k} x={NX+10} y={n.y+7+k*LH+11}>{s}</tspan>)}</text>
    </motion.g></g>})}
  <rect className="mm-r" x={RX} y={m.cy-m.rh/2} width={RW} height={m.rh} rx="12"/>
  <text className="mm-rt" fontSize="13" textAnchor="middle">{m.root.map((s,k)=><tspan key={k} x={RX+RW/2} y={m.cy-m.rh/2+10+k*16+12}>{s}</tspan>)}</text>
 </svg>
}

/** Export PNG net (x3), dessiné directement sur canvas : pas de foreignObject, donc compatible Safari. */
export async function exportPng(d:Card){
 await document.fonts?.ready
 const m=layout(d),S=3,P=20,F=26,W=360+P*2,Ht=m.H+P*2+F
 const cs=getComputedStyle(document.documentElement),v=(k:string)=>cs.getPropertyValue(k).trim()
 const cv=document.createElement('canvas');cv.width=W*S;cv.height=Ht*S
 const c=cv.getContext('2d')!;c.scale(S,S)
 c.fillStyle=v('--bg');c.fillRect(0,0,W,Ht);c.translate(P,P)
 const ff='Figtree,system-ui,sans-serif'
 c.lineWidth=1.5;c.strokeStyle=v('--edge')
 m.nodes.forEach(n=>{const y=n.y+n.h/2;c.beginPath();c.moveTo(RX+RW,m.cy);c.bezierCurveTo(130,m.cy,130,y,NX,y);c.stroke()})
 c.lineWidth=1;c.textAlign='left'
 m.nodes.forEach(n=>{c.beginPath();c.roundRect(NX,n.y,NW,n.h,10);c.fillStyle=v('--surf');c.fill();c.stroke()
  c.fillStyle=v('--t');c.font=`500 12px ${ff}`;n.l.forEach((s,k)=>c.fillText(s,NX+10,n.y+7+k*LH+11))})
 const ry=m.cy-m.rh/2
 c.beginPath();c.roundRect(RX,ry,RW,m.rh,12);c.fillStyle=v('--ink');c.fill()
 c.fillStyle=v('--on');c.textAlign='center';c.font=`600 13px ${ff}`
 m.root.forEach((s,k)=>c.fillText(s,RX+RW/2,ry+10+k*16+12))
 c.fillStyle=v('--m');c.textAlign='left';c.font=`600 11px ${ff}`;c.fillText("l'interne",0,m.H+F-6)
 const blob=await new Promise<Blob|null>(r=>cv.toBlob(r,'image/png'))
 if(!blob)return
 const f=new File([blob],`carte-q${d.id}.png`,{type:'image/png'})
 if(navigator.canShare?.({files:[f]})){try{await navigator.share({files:[f],title:d.q});return}catch{return}}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=f.name;a.click()
 setTimeout(()=>URL.revokeObjectURL(a.href),4000)
}