import {ReactNode,useState} from 'react'
import {motion} from 'framer-motion'
import {MODULES} from './data'
import {Icon} from './ui'
import * as C from './calcdata'
import type {Tone,Doc} from './calcdata'

/* ====== Briques d'interface ====== */
function Num({l,u,v,on,ph}:{l:string;u?:string;v:string;on:(s:string)=>void;ph?:string}){
 return <label className="fld nf">{l}<span className="inw"><input inputMode="decimal" autoComplete="off" value={v} placeholder={ph} onChange={e=>on(e.target.value)}/>{u&&<em>{u}</em>}</span></label>}
function Day({l,v,on}:{l:string;v:string;on:(s:string)=>void}){
 return <label className="fld">{l}<input type="date" value={v} onChange={e=>on(e.target.value)}/></label>}
function Pills<T extends string>({l,v,on,o}:{l?:string;v:T;on:(t:T)=>void;o:[T,string][]}){
 return <div className="fld">{l}<div className="pills">{o.map(([k,t])=><button key={k} type="button" className={v===k?'on':''} aria-pressed={v===k} onClick={()=>on(k)}>{t}</button>)}</div></div>}
function Res({k,big,unit,line}:{k:string;big:string;unit?:string;line?:string}){
 return <div className="res" aria-live="polite"><span className="rk">{k}</span><div className="rv">{big}{unit&&<small>{unit}</small>}</div>{line&&<p>{line}</p>}</div>}
function Verdict({tone,t,children}:{tone:Tone;t:string;children?:ReactNode}){
 return <div className={'vd t-'+tone}><b>{t}</b>{children&&<p>{children}</p>}</div>}
function KV({rows}:{rows:[string,string][]}){
 return <dl className="kv">{rows.map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>}
const Empty=({t}:{t:string})=><div className="emp">{t}</div>
type Seg={to:number;t:Tone;l:string}
function Scale({seg,min,max,v}:{seg:Seg[];min:number;max:number;v:number}){
 let p=min
 const pos=Math.min(1,Math.max(0,(v-min)/(max-min)))*100
 return <div className="sc" role="img" aria-label="Position du résultat sur l'échelle"><div className="bar">
  {seg.map(s=>{const w=s.to-p;p=s.to;return <i key={s.l} className={'t-'+s.t} style={{flex:`${w} 1 0`}}>{s.l}</i>})}
  <span className="mk" style={{left:pos+'%'}}/></div></div>}
function Choice({l,o,v,on}:{l:string;o:{p:number;t:string}[];v:number|null;on:(p:number)=>void}){
 return <fieldset className="ch"><legend>{l}</legend><div className="os">
  {o.map(x=><button key={x.t} type="button" className={'op'+(v===x.p?' on':'')} aria-pressed={v===x.p} onClick={()=>on(x.p)}><b>{x.p}</b><span>{x.t}</span></button>)}</div></fieldset>}
const Reset=({on}:{on:()=>void})=><button type="button" className="rst" onClick={on}><Icon n="flip" s={16}/>Réinitialiser</button>

/* ====== Formulaires ====== */
function GA(){
 const[m,setM]=useState<'ddr'|'echo'|'conc'>('ddr')
 const[ddr,setDdr]=useState(''),[cy,setCy]=useState('28'),[ed,setEd]=useState(''),[ew,setEw]=useState(''),[ej,setEj]=useState('0'),[cc,setCc]=useState(''),[rf,setRf]=useState(C.todayIso())
 const st=C.startOf(m,{ddr:C.pd(ddr),cy:C.num(cy),ed:C.pd(ed),ew:C.num(ew),ej:C.num(ej),cc:C.pd(cc)}),ref=C.pd(rf)
 const days=st!=null&&ref!=null?Math.round((ref-st)/C.DAY):null
 const ti=days!=null&&days>=0?C.term(days):null
 const cyBad=m==='ddr'&&ddr!==''&&(!(C.num(cy)>=21)||C.num(cy)>45)
 return <div className="frm">
  <Pills v={m} on={setM} o={[['ddr','DDR'],['echo','Écho 1er trim.'],['conc','Conception']]}/>
  {m==='ddr'&&<><Day l="Premier jour des dernières règles" v={ddr} on={setDdr}/><Num l="Durée habituelle du cycle" u="jours" v={cy} on={setCy}/></>}
  {m==='echo'&&<><Day l="Date de l'échographie" v={ed} on={setEd}/><div className="row2"><Num l="AG à l'écho" u="SA" v={ew} on={setEw} ph="ex. 9"/><Num l="+ jours" u="j" v={ej} on={setEj}/></div></>}
  {m==='conc'&&<Day l="Date de conception (ou de transfert d'embryon J0)" v={cc} on={setCc}/>}
  <Day l="Date de référence" v={rf} on={setRf}/>
  {cyBad&&<Verdict tone="wa" t="Durée de cycle inhabituelle (21 à 45 jours attendus)"/>}
  {days==null?<Empty t="Renseigne la date de départ pour obtenir l'âge gestationnel."/>
  :days<0?<Verdict tone="wa" t="La date de référence précède le début de la grossesse."/>
  :<><Res k="Âge gestationnel" big={`${Math.floor(days/7)} SA + ${days%7} j`} line={`${days} jours depuis le début de grossesse (aménorrhée)`}/>
   {ti&&<Verdict tone={ti.tone} t={ti.label}>{ti.note}</Verdict>}
   {days>301&&<Verdict tone="wa" t="Plus de 43 SA : vérifie les dates saisies."/>}
   <KV rows={[['Trimestre',C.tri(days)],['Semaines de grossesse (SG)',days>=14?C.saj(days-14,'SG'):'moins de 2 SG'],['Début de grossesse (DDR équivalente)',C.fds(st!)],['DPA',C.fds(st!+280*C.DAY)],[days<=280?'Jours jusqu\'à la DPA':'DPA dépassée de',`${Math.abs(280-days)} jours`]]}/></>}
 </div>}

function DPA(){
 const[ddr,setDdr]=useState(''),[cy,setCy]=useState('28'),[ed,setEd]=useState(''),[ew,setEw]=useState(''),[ej,setEj]=useState('0')
 const o={ddr:C.pd(ddr),cy:C.num(cy),ed:C.pd(ed),ew:C.num(ew),ej:C.num(ej),cc:null}
 const s1=C.startOf('ddr',o),s2=C.startOf('echo',o)
 const dpa1=s1!=null?s1+280*C.DAY:null,dpa2=s2!=null?s2+280*C.DAY:null
 const ag=Number.isFinite(o.ew)?o.ew*7+(Number.isFinite(o.ej)?o.ej:0):NaN
 const diff=s1!=null&&s2!=null?Math.round(Math.abs(s2-s1)/C.DAY):null
 const lim=Number.isFinite(ag)?C.thr(ag):null
 const redate=diff!=null&&lim!=null&&diff>lim
 const best=dpa2!=null&&(dpa1==null||redate)?dpa2:dpa1
 return <div className="frm">
  <Day l="Premier jour des dernières règles" v={ddr} on={setDdr}/>
  <Num l="Durée habituelle du cycle" u="jours" v={cy} on={setCy}/>
  <h3 className="lh">Échographie précoce (facultatif)</h3>
  <Day l="Date de l'échographie" v={ed} on={setEd}/>
  <div className="row2"><Num l="AG à l'écho" u="SA" v={ew} on={setEw} ph="ex. 9"/><Num l="+ jours" u="j" v={ej} on={setEj}/></div>
  {best==null?<Empty t="Saisis la DDR (ou une échographie) pour obtenir la date prévue d'accouchement."/>
  :<><Res k={dpa1!=null&&dpa2!=null?(redate?'DPA retenue (écho)':'DPA retenue (DDR)'):dpa1!=null?'DPA selon la DDR':'DPA selon l\'écho'} big={C.fds(best)} line={C.fd(best).split(' ')[0]}/>
   {diff!=null&&lim!=null&&(redate
    ?<Verdict tone="wa" t={`Discordance de ${diff} j (seuil ${lim} j) : retenir la DPA de l'écho`}>L'écart dépasse le seuil ACOG pour cet âge gestationnel : on redate la grossesse sur l'échographie.</Verdict>
    :<Verdict tone="ok" t={`Concordance : écart de ${diff} j (seuil ${lim} j)`}>La DDR est confirmée par l'écho : on conserve la DPA de la DDR.</Verdict>)}
   {Number.isFinite(ag)&&ag>195&&<Verdict tone="in" t="Après 28 SA, la datation échographique est peu précise."/>}
   <KV rows={[...(dpa1!=null?[['DPA (DDR)',C.fds(dpa1)] as [string,string]]:[]),...(dpa2!=null?[['DPA (écho)',C.fds(dpa2)] as [string,string]]:[]),...(diff!=null?[['Écart',`${diff} jours`] as [string,string]]:[])]}/></>}
 </div>}

function IMC(){
 const[w,setW]=useState(''),[h,setH]=useState(''),[u,setU]=useState<'cm'|'m'>('cm')
 const kg=C.num(w),t=C.num(h)/(u==='cm'?100:1),ok=kg>0&&t>0
 const odd=ok&&(kg<20||kg>300||t<.5||t>2.5)
 const i=ok?kg/(t*t):NaN,c=ok?C.imcCat(i):null
 return <div className="frm">
  <Num l="Poids" u="kg" v={w} on={setW} ph="ex. 62"/>
  <Num l="Taille" u={u} v={h} on={setH} ph={u==='cm'?'ex. 165':'ex. 1,65'}/>
  <Pills v={u} on={setU} o={[['cm','Centimètres'],['m','Mètres']]}/>
  {!ok||!c?<Empty t="Saisis le poids et la taille pour calculer l'IMC."/>
  :<>{odd&&<Verdict tone="wa" t="Valeur inhabituelle : vérifie le poids et la taille."/>}
   <Res k="Indice de masse corporelle" big={C.fx(i)} unit="kg/m²"/>
   <Scale min={15} max={40} v={i} seg={[{to:18.5,t:'in',l:'<18,5'},{to:25,t:'ok',l:'18,5–25'},{to:30,t:'wa',l:'25–30'},{to:35,t:'ko',l:'30–35'},{to:40,t:'ko',l:'35+'}]}/>
   <Verdict tone={c.tone} t={c.k}>Classification OMS. Pendant la grossesse, utilise l'IMC d'avant la grossesse.</Verdict>
   <KV rows={[['Poids pour un IMC de 18,5 à 24,9',`${C.fx(18.5*t*t)} – ${C.fx(24.9*t*t)} kg`]]}/></>}
 </div>}

const AP=[
 {k:'Fréquence cardiaque',o:['Absente','< 100 / min','≥ 100 / min']},
 {k:'Respiration',o:['Absente','Lente, irrégulière','Cri vigoureux']},
 {k:'Tonus musculaire',o:['Flasque','Légère flexion des extrémités','Mouvements actifs']},
 {k:'Réactivité à la stimulation',o:['Aucune','Grimace','Cri, toux ou éternuement']},
 {k:'Coloration',o:['Pâle ou bleue','Corps rose, extrémités bleues','Entièrement rose']}]
type Tm='1'|'5'|'10'
const blank=():Record<Tm,(number|null)[]>=>({'1':[null,null,null,null,null],'5':[null,null,null,null,null],'10':[null,null,null,null,null]})
const tot=(a:(number|null)[])=>a.every(x=>x!=null)?(a as number[]).reduce((s,x)=>s+x,0):null
function Apgar(){
 const[sc,setSc]=useState(blank),[t,setT]=useState<Tm>('1')
 const set=(i:number,p:number)=>setSc(s=>({...s,[t]:s[t].map((x,k)=>k===i?p:x)}))
 const T=tot(sc[t]),lab=(k:Tm)=>{const v=tot(sc[k]);return`${k} min · ${v==null?'—':v}`}
 return <div className="frm">
  <Pills v={t} on={setT} o={(['1','5','10'] as Tm[]).map(k=>[k,lab(k)] as [Tm,string])}/>
  {AP.map((c,i)=><Choice key={c.k} l={c.k} v={sc[t][i]} on={p=>set(i,p)} o={c.o.map((x,p)=>({p,t:x}))}/>)}
  {T==null?<Empty t={`Note les 5 critères pour obtenir le score à ${t} min.`}/>
  :<><Res k={`Apgar à ${t} min`} big={String(T)} unit="/ 10"/>
   <Scale min={-.5} max={10.5} v={T} seg={[{to:3.5,t:'ko',l:'0–3'},{to:6.5,t:'wa',l:'4–6'},{to:10.5,t:'ok',l:'7–10'}]}/>
   <Verdict tone={T>=7?'ok':T>=4?'wa':'ko'} t={T>=7?'Bonne adaptation':T>=4?'Dépression modérée':'Dépression sévère'}>{T>=7?'Surveillance et soins de routine.':T>=4?'Stimulation, surveillance rapprochée, soutien selon la clinique.':'Réanimation néonatale selon le protocole, sans attendre le score.'}</Verdict></>}
  <Reset on={()=>setSc(blank())}/>
 </div>}

const BI=[
 {k:'Dilatation',o:[{p:0,t:'Fermé (0 cm)'},{p:1,t:'1 – 2 cm'},{p:2,t:'3 – 4 cm'},{p:3,t:'≥ 5 cm'}]},
 {k:'Effacement',o:[{p:0,t:'0 – 30 %'},{p:1,t:'40 – 50 %'},{p:2,t:'60 – 70 %'},{p:3,t:'≥ 80 %'}]},
 {k:'Consistance du col',o:[{p:0,t:'Ferme'},{p:1,t:'Moyenne'},{p:2,t:'Molle'}]},
 {k:'Position du col',o:[{p:0,t:'Postérieur'},{p:1,t:'Intermédiaire'},{p:2,t:'Antérieur'}]},
 {k:'Présentation fœtale',o:[{p:0,t:'Haute, mobile (−3)'},{p:1,t:'Amorcée (−2)'},{p:2,t:'Appliquée, fixée (−1, 0)'},{p:3,t:'Engagée (+1, +2)'}]}]
function Bishop(){
 const[s,setS]=useState<(number|null)[]>([null,null,null,null,null])
 const T=tot(s)
 return <div className="frm">
  {BI.map((c,i)=><Choice key={c.k} l={c.k} o={c.o} v={s[i]} on={p=>setS(a=>a.map((x,k)=>k===i?p:x))}/>)}
  {T==null?<Empty t="Renseigne les 5 critères pour obtenir le score de Bishop."/>
  :<><Res k="Score de Bishop" big={String(T)} unit="/ 13"/>
   <Scale min={-.5} max={13.5} v={T} seg={[{to:5.5,t:'wa',l:'0–5'},{to:7.5,t:'in',l:'6–7'},{to:13.5,t:'ok',l:'8–13'}]}/>
   <Verdict tone={T>=8?'ok':T>=6?'in':'wa'} t={T>=8?'Col favorable':T>=6?'Col intermédiaire':'Col défavorable'}>{T>=8?'Le déclenchement a de bonnes chances de succès, proches d\'un travail spontané.':T>=6?'À discuter selon le protocole du service.':'Envisager une maturation cervicale avant l\'ocytocine. Seuil à vérifier avec ton protocole.'}</Verdict></>}
  <Reset on={()=>setS([null,null,null,null,null])}/>
 </div>}

function Choc(){
 const[a,setA]=useState(''),[b,setB]=useState('')
 const fc=C.num(a),ps=C.num(b),ok=fc>0&&ps>0,si=ok?fc/ps:NaN
 const odd=ok&&(fc<20||fc>250||ps<40||ps>300)
 const v:[Tone,string,string]=si<.7?['in','Indice bas','Habituel hors grossesse (0,5–0,7). Interprète avec la clinique.']
  :si<.9?['ok','Plage attendue en obstétrique','Pas de signe hémodynamique d\'alerte à cet instant. Répète la mesure en cas de saignement.']
  :si<1?['wa','Alerte','Surveillance rapprochée, recherche d\'une hémorragie, application du protocole du service.']
  :['ko','État de choc probable','Prise en charge urgente selon le protocole du service.']
 return <div className="frm">
  <Num l="Fréquence cardiaque" u="bpm" v={a} on={setA} ph="ex. 100"/>
  <Num l="Pression artérielle systolique" u="mmHg" v={b} on={setB} ph="ex. 110"/>
  {!ok?<Empty t="Saisis la FC et la PAS pour calculer l'indice de choc."/>
  :<>{odd&&<Verdict tone="wa" t="Valeur inhabituelle : vérifie la saisie."/>}
   <Res k="Indice de choc obstétrical" big={C.fx(si,2)}/>
   <Scale min={.5} max={1.5} v={si} seg={[{to:.7,t:'in',l:'<0,7'},{to:.9,t:'ok',l:'0,7–0,9'},{to:1,t:'wa',l:'0,9–1'},{to:1.5,t:'ko',l:'≥ 1'}]}/>
   <Verdict tone={v[0]} t={v[1]}>{v[2]}</Verdict></>}
 </div>}

function PP(){
 const[p0,setP0]=useState(''),[p1,setP1]=useState(''),[h,setH]=useState(''),[w,setW]=useState(''),[d,setD]=useState('0')
 const a=C.num(p0),b=C.num(p1),t=C.num(h)/100,sa=C.num(w),j=Number.isFinite(C.num(d))?C.num(d):0
 const imc=a>0&&t>0?a/(t*t):NaN,cat=Number.isFinite(imc)?C.imcCat(imc):null
 const gain=a>0&&b>0?b-a:NaN,wk=sa+j/7
 const ex=cat&&Number.isFinite(wk)&&wk>=0&&wk<=42?C.expected(wk,cat.iom):null
 const sg=(n:number)=>`${n>=0?'+':'−'}${C.fx(Math.abs(n))} kg`
 const io=cat?C.IOM[cat.iom]:null
 return <div className="frm">
  <Num l="Poids de référence (avant la grossesse ou avant 14 SA)" u="kg" v={p0} on={setP0}/>
  <Num l="Taille" u="cm" v={h} on={setH} ph="ex. 165"/>
  <Num l="Poids actuel" u="kg" v={p1} on={setP1}/>
  <div className="row2"><Num l="Terme actuel" u="SA" v={w} on={setW} ph="ex. 28"/><Num l="+ jours" u="j" v={d} on={setD}/></div>
  {!Number.isFinite(gain)?<Empty t="Saisis le poids de référence et le poids actuel."/>
  :<><Res k="Prise de poids" big={sg(gain)}/>
   {ex&&io?<><Verdict tone={gain<ex[0]?'wa':gain>ex[1]?'wa':'ok'} t={gain<ex[0]?'Inférieure à la fourchette attendue':gain>ex[1]?'Supérieure à la fourchette attendue':'Dans la fourchette attendue'}>{gain<ex[0]?`Il manque environ ${C.fx(ex[0]-gain)} kg par rapport au bas de la fourchette.`:gain>ex[1]?`Dépassement d'environ ${C.fx(gain-ex[1])} kg au-dessus de la fourchette.`:'Gain cohérent avec les recommandations IOM pour ce terme.'}</Verdict>
    <KV rows={[['IMC de référence',`${C.fx(imc)} kg/m² · ${cat!.k}`],['Fourchette attendue à ce jour',`${C.fx(ex[0])} à ${C.fx(ex[1])} kg`],['Gain recommandé à terme',`${C.fx(io.t[0])} à ${C.fx(io.t[1])} kg`],['Rythme aux 2e–3e trimestres',`${C.fx(io.r[0],2)} à ${C.fx(io.r[1],2)} kg/sem`]]}/></>
   :<Empty t="Ajoute la taille et le terme actuel pour comparer aux recommandations."/>}</>}
 </div>}

type Md='saj'|'j'|'m'
function Conv(){
 const[md,setMd]=useState<Md>('saj'),[base,setBase]=useState<'SA'|'SG'>('SA'),[mt,setMt]=useState<'civ'|'lun'>('civ')
 const[w,setW]=useState(''),[d,setD]=useState('0'),[j,setJ]=useState(''),[m,setM]=useState('')
 const L=mt==='civ'?30.4375:28,off=base==='SG'?14:0
 let D=NaN
 if(md==='saj'){const x=C.num(w);if(x>=0)D=Math.round(x*7+(Number.isFinite(C.num(d))?C.num(d):0))}
 else if(md==='j')D=Math.round(C.num(j))
 else{const x=C.num(m);if(x>=0)D=Math.round(x*L+off)}
 if(md==='saj'&&base==='SG'&&Number.isFinite(D))D+=14
 if(md==='j'&&base==='SG'&&Number.isFinite(D))D+=14
 const ok=Number.isFinite(D)&&D>=0&&D<=315
 const mo=ok?(D-off)/L:NaN
 return <div className="frm">
  <Pills l="Je saisis" v={md} on={setMd} o={[['saj','Semaines + jours'],['j','Jours'],['m','Mois']]}/>
  <Pills l="Âge compté en" v={base} on={setBase} o={[['SA','SA (aménorrhée)'],['SG','SG (conception)']]}/>
  <Pills l="Type de mois" v={mt} on={setMt} o={[['civ','Civils (30,44 j)'],['lun','Lunaires (28 j)']]}/>
  {md==='saj'&&<div className="row2"><Num l="Semaines" u={base} v={w} on={setW} ph="ex. 28"/><Num l="+ jours" u="j" v={d} on={setD}/></div>}
  {md==='j'&&<Num l="Jours" u="j" v={j} on={setJ} ph="ex. 199"/>}
  {md==='m'&&<Num l="Mois" u="mois" v={m} on={setM} ph="ex. 6,5"/>}
  {!ok?<Empty t="Saisis une valeur entre 0 et 45 semaines pour convertir."/>
  :<><Res k="Équivalent en SA" big={`${Math.floor(D/7)} SA + ${D%7} j`} line={`${D} jours d'aménorrhée`}/>
   <KV rows={[['Semaines de grossesse (SG)',D>=14?C.saj(D-14,'SG'):'moins de 2 SG'],[`Mois (${mt==='civ'?'civils':'lunaires'}, base ${base})`,Number.isFinite(mo)&&mo>=0?`${C.fx(mo)} mois`:'—'],['Mois révolus',Number.isFinite(mo)&&mo>=0?`${Math.floor(mo)} (en cours : ${Math.floor(mo)+1}e mois)`:'—'],['Trimestre',C.tri(D)]]}/></>}
 </div>}

const FORMS:Record<string,()=>JSX.Element>={ga:GA,dpa:DPA,imc:IMC,apgar:Apgar,bishop:Bishop,choc:Choc,pp:PP,conv:Conv}

/* ====== Explications ====== */
function Learn({doc}:{doc:Doc}){
 return <div>
  <section className="lc"><h3 className="lh">À quoi ça sert</h3><ul>{doc.use.map(x=><li key={x}>{x}</li>)}</ul></section>
  <section className="lc"><h3 className="lh">Formule</h3><pre className="eq">{doc.eq.join('\n')}</pre>
   {doc.vars&&<ul style={{marginTop:12}}>{doc.vars.map(x=><li key={x}>{x}</li>)}</ul>}</section>
  <section className="lc"><h3 className="lh">Lire le résultat</h3>{doc.read.map(([k,v,t])=><div key={k} className={'rr t-'+t}><b>{k}</b><span>{v}</span></div>)}</section>
  <section className="lc"><h3 className="lh">Exemple</h3><div className="ex">{doc.ex}</div></section>
  <section className="lc"><h3 className="lh">Limites</h3><ul>{doc.limits.map(x=><li key={x}>{x}</li>)}</ul></section>
  <section className="lc"><h3 className="lh">Références</h3><ol className="refs">{doc.refs.map(x=><li key={x}>{x}</li>)}</ol></section>
 </div>}

/* Menu de spécialités : les disponibles d'abord, les autres verrouillées */
function SpecMenu({spec,setSpec}:{spec:string;setSpec:(k:string)=>void}){
 const[open,setOpen]=useState(false)
 const has=(k:string)=>C.CALCS.filter(c=>c.spec===k).length
 const cur=MODULES.find(m=>m.key===spec)!
 const sorted=[...MODULES].sort((a,b)=>Number(has(b.key)>0)-Number(has(a.key)>0))
 return <div className="sm" onKeyDown={e=>e.key==='Escape'&&setOpen(false)}>
  <button type="button" className="smb" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(!open)}>
   <span className="cd" aria-hidden="true">{cur.code}</span><span className="tx"><small>Spécialité</small><b>{cur.name}</b></span>
   <span className={'cv'+(open?' up':'')}><Icon n="chev" s={18}/></span></button>
  {open&&<><div className="smx" onClick={()=>setOpen(false)}/>
   <ul className="sml" role="listbox" aria-label="Spécialités">{sorted.map(m=>{const n=has(m.key)
    return <li key={m.key}><button type="button" role="option" aria-selected={spec===m.key} disabled={!n} className={'smi'+(spec===m.key?' on':'')} onClick={()=>{setSpec(m.key);setOpen(false)}}>
     <span className="cd" aria-hidden="true">{m.code}</span><b>{m.name}</b>
     <em>{n?`${n} outils`:'Verrouillé'}</em>{n?(spec===m.key&&<Icon n="check" s={18}/>):<Icon n="lock" s={16}/>}</button></li>})}</ul></>}
 </div>}

/* ====== Écrans ====== */
export default function Calc(){
 const[sel,setSel]=useState<string|null>(null),[spec,setSpec]=useState('gyneco'),[tab,setTab]=useState<'c'|'u'>('c')
 const def=C.CALCS.find(c=>c.id===sel),mod=MODULES.find(m=>m.key===(def?.spec??spec))!
 const open=(id:string)=>{setSel(id);setTab('c')}
 const disc=<p className="disc">Outil d'aide à l'apprentissage et au calcul : il ne remplace ni le jugement clinique ni les protocoles de ton service. Vérifie les seuils avec ton cours.</p>
 if(def){const F=FORMS[def.id]
  return <div className="page"><div className="top"><div><small>{mod.name}</small><h1 className="sm">{def.name}</h1></div>
   <button className="ib" onClick={()=>setSel(null)} aria-label="Retour aux calculs"><Icon n="back"/></button></div>
   <div className="cx"><div className="seg">{([['c','Calculer'],['u','Comprendre']] as ['c'|'u',string][]).map(([k,l])=>
     <button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{tab===k&&<motion.i layoutId="cseg"/>}<span>{l}</span></button>)}</div>
    <div className="cb" hidden={tab!=='c'}><F/></div>
    <div className="cb" hidden={tab!=='u'}><Learn doc={def.doc}/></div>
    {disc}</div></div>}
 const list=C.CALCS.filter(c=>c.spec===spec)
 return <div className="page"><div className="top"><div><small>Outils cliniques</small><h1>Calculs</h1></div></div>
  <div className="cx"><SpecMenu spec={spec} setSpec={setSpec}/>
   <div className="crows">{list.map((c,i)=><motion.button key={c.id} className="crow" initial={{y:12,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:.04*i}} onClick={()=>open(c.id)}>
     <span className="cd" aria-hidden="true">{c.code}</span><span className="tx"><b>{c.name}</b><small>{c.sub}</small></span><Icon n="chev" s={18}/></motion.button>)}</div>
   {disc}</div></div>
}

export function Follow(){
 return <div className="page"><div className="top"><div><small>Paramètres vitaux</small><h1>Suivi</h1></div></div>
  <div className="cx"><div className="emp"><b>Bientôt</b>
   <p>Tu pourras enregistrer les mesures sur l'appareil, sans les recopier ailleurs.</p>
   <div className="tags">{['FC','FR','Pression artérielle','Température','SpO₂','Poids','Taille','Glycémie','Observation'].map(x=><span key={x}>{x}</span>)}</div></div></div></div>
}