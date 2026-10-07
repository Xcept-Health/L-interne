import {useEffect,useRef} from 'react'

/** Réseau 3D (nœuds + liens) qui s'assemble, évoquant une carte mentale.
 *  Three.js est chargé à la demande : aucun poids au premier affichage. */
export default function Splash3D(){
 const box=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  const el=box.current!;let off=false,dispose=()=>{}
  import('three').then(({WebGLRenderer,Scene,PerspectiveCamera,BufferGeometry,BufferAttribute,Points,PointsMaterial,LineSegments,LineBasicMaterial,Group,CanvasTexture,Vector3})=>{
   if(off)return
   let r:InstanceType<typeof WebGLRenderer>
   try{r=new WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'})}catch{return}
   r.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(r.domElement);el.classList.add('live')
   const calm=matchMedia('(prefers-reduced-motion: reduce)').matches
   const sc=new Scene(),cam=new PerspectiveCamera(40,1,.1,20);cam.position.z=4.6
   const N=72,tg:InstanceType<typeof Vector3>[]=[],st:InstanceType<typeof Vector3>[]=[]
   for(let i=0;i<N;i++){const k=Math.acos(1-2*(i+.5)/N),a=Math.PI*(1+Math.sqrt(5))*i
    tg.push(new Vector3(Math.sin(k)*Math.cos(a),Math.cos(k),Math.sin(k)*Math.sin(a)).multiplyScalar(1.25))
    st.push(new Vector3((Math.random()-.5)*6,(Math.random()-.5)*6,(Math.random()-.5)*6))}
   const E:[number,number][]=[]
   for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)if(tg[i].distanceTo(tg[j])<.62)E.push([i,j])
   const pp=new Float32Array(N*3),lp=new Float32Array(E.length*6)
   const pg=new BufferGeometry(),lg=new BufferGeometry()
   pg.setAttribute('position',new BufferAttribute(pp,3));lg.setAttribute('position',new BufferAttribute(lp,3))
   const cv=document.createElement('canvas');cv.width=cv.height=64
   const x=cv.getContext('2d')!,g0=x.createRadialGradient(32,32,0,32,32,32)
   g0.addColorStop(0,'#fff');g0.addColorStop(.45,'#fff');g0.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g0;x.fillRect(0,0,64,64)
   const tex=new CanvasTexture(cv)
   const pm=new PointsMaterial({size:.09,map:tex,transparent:true,depthWrite:false})
   const lm=new LineBasicMaterial({color:0xffffff,transparent:true,opacity:0})
   const grp=new Group();grp.add(new Points(pg,pm),new LineSegments(lg,lm));sc.add(grp)
   const t0=performance.now();let mx=0,my=0,raf=0,done=false
   const mv=(e:PointerEvent)=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5}
   addEventListener('pointermove',mv)
   const size=()=>{const w=el.clientWidth||1,h=el.clientHeight||1;r.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}
   const ro=new ResizeObserver(size);ro.observe(el);size()
   const place=(e:number)=>{
    for(let i=0;i<N;i++){const a=st[i],b=tg[i];pp[i*3]=a.x+(b.x-a.x)*e;pp[i*3+1]=a.y+(b.y-a.y)*e;pp[i*3+2]=a.z+(b.z-a.z)*e}
    E.forEach(([i,j],k)=>{lp.set(pp.subarray(i*3,i*3+3),k*6);lp.set(pp.subarray(j*3,j*3+3),k*6+3)})
    pg.attributes.position.needsUpdate=lg.attributes.position.needsUpdate=true;lm.opacity=.45*e}
   const loop=()=>{raf=requestAnimationFrame(loop);if(document.hidden)return
    if(!done){const k=Math.min(1,(performance.now()-t0)/1800);place(calm?1:1-Math.pow(1-k,3));done=k>=1||calm}
    if(!calm){grp.rotation.y+=.004;grp.rotation.x+=(my*.8-grp.rotation.x)*.05;grp.position.x+=(mx*.4-grp.position.x)*.05}
    r.render(sc,cam)}
   loop()
   dispose=()=>{cancelAnimationFrame(raf);removeEventListener('pointermove',mv);ro.disconnect()
    pg.dispose();lg.dispose();pm.dispose();lm.dispose();tex.dispose();r.dispose();r.domElement.remove()}
  })
  return()=>{off=true;dispose()}
 },[])
 return <div ref={box} className="net" aria-hidden="true"/>
}
