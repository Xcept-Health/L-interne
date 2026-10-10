import type {CSSProperties} from 'react'

export interface SL{min:number;max:number;step:number;def?:number;l?:string}
const dec=(step:number)=>(String(step).split('.')[1]||'').length
export const fmtN=(n:number,d:number)=>n.toFixed(d).replace('.',',')

/** Curseur à glisser (piste en pilule, trait vertical, repères en points).
 *  `v` = valeur actuelle (null = pas encore choisie). `on` reçoit la valeur en texte, virgule française.
 *  C'est un vrai <input type="range"> : clavier (flèches), lecteurs d'écran et glisser tactile fonctionnent. */
export default function Slider({l='Ajuster',u,min,max,step,v,on,def,dots=7}:{l?:string;u?:string;min:number;max:number;step:number;v:number|null;on:(s:string)=>void;def?:number;dots?:number}){
 const d=dec(step),has=v!=null&&Number.isFinite(v)
 const cur=has?Math.min(max,Math.max(min,v as number)):(def??(min+max)/2)
 const p=(cur-min)/(max-min)
 const shown=has?String(v).replace('.',','):'—'
 return <label className={'sld'+(has?'':' idle')} style={{'--p':p} as CSSProperties}>
  <span className="sl-fill" aria-hidden="true"/>
  <span className="sl-dots" aria-hidden="true">{Array.from({length:dots},(_,i)=><i key={i}/>)}</span>
  <span className="sl-thumb" aria-hidden="true"/>
  <span className="sl-l">{l}</span>
  <span className="sl-v">{shown}{u&&has&&<small>{u}</small>}</span>
  <input type="range" min={min} max={max} step={step} value={cur} aria-label={l} aria-valuetext={has?`${shown} ${u??''}`.trim():'pas de valeur'}
   onChange={e=>on(fmtN(Number(e.target.value),d))}/>
 </label>}