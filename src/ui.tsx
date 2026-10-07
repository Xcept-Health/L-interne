import {useRef,ReactNode} from 'react'
import {motion,useMotionValue,useReducedMotion,useSpring,useTransform} from 'framer-motion'
const P:Record<string,string>={
 home:'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
 cards:'M4 7h12v13H4zM8 3h12v13',
 user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
 sun:'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4 4l1.5 1.5M18.5 18.5L20 20M1 12h2M21 12h2M4 20l1.5-1.5M18.5 5.5L20 4',
 moon:'M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z',
 star:'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
 back:'M15 5l-7 7 7 7',
 flip:'M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5',
 lock:'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
 check:'M5 12l5 5L20 7',
 close:'M6 6l12 12M18 6L6 18',
 help:'M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17.5v.01',
 list:'M4 6h16M4 12h16M4 18h16',
 download:'M12 4v11M7 11l5 5 5-5M5 20h14',
 branch:'M5 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 5a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 19a2 2 0 1 0 4 0a2 2 0 1 0-4 0M8.8 11L15.2 6M8.8 13L15.2 18'}
export const Icon=({n,s=22}:{n:string;s?:number})=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]}/></svg>

/** Carte avec légère inclinaison. Désactivée si l'utilisateur préfère moins de mouvement.
 *  Si onClick est fourni, la carte se comporte comme un bouton (clavier inclus). */
export function Tilt({children,className='',onClick,disabled=false,pressed}:{children:ReactNode;className?:string;onClick?:()=>void;disabled?:boolean;pressed?:boolean}){
 const r=useRef<HTMLDivElement>(null),calm=useReducedMotion()
 const mx=useMotionValue(0),my=useMotionValue(0)
 const sx=useSpring(mx,{stiffness:200,damping:22}),sy=useSpring(my,{stiffness:200,damping:22})
 const rx=useTransform(sy,[-.5,.5],[4,-4]),ry=useTransform(sx,[-.5,.5],[-4,4])
 const mv=(e:React.PointerEvent)=>{const b=r.current!.getBoundingClientRect();mx.set((e.clientX-b.left)/b.width-.5);my.set((e.clientY-b.top)/b.height-.5)}
 const rs=()=>{mx.set(0);my.set(0)}
 const act=!!onClick&&!disabled
 const key=(e:React.KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onClick?.()}}
 return <div style={{perspective:800}}><motion.div ref={r} className={className}
  onClick={act?onClick:undefined} role={onClick?'button':undefined} tabIndex={act?0:undefined}
  aria-disabled={disabled||undefined} aria-pressed={pressed} onKeyDown={act?key:undefined}
  onPointerMove={calm?undefined:mv} onPointerLeave={rs} onPointerUp={rs}
  whileTap={calm||disabled?undefined:{scale:.98}}
  style={calm?undefined:{rotateX:rx,rotateY:ry,transformStyle:'preserve-3d'}}>{children}</motion.div></div>
}