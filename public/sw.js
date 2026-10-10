/* L'interne : service worker (mode hors ligne).
 * - Coquille de l'app mise en cache à l'installation (page + fichiers listés dans index.html).
 * - Pages : réseau d'abord (3,5 s max), puis cache si le réseau est absent ou trop lent.
 * - Fichiers générés (assets/) : cache d'abord, ils portent un hash et ne changent jamais.
 * - Polices et reste : cache servi tout de suite, rafraîchi en arrière-plan.
 * Pour forcer une purge complète, change le numéro de VERSION. */
const VERSION='interne-v1-beta'
const SHELL=VERSION+'-shell',RUN=VERSION+'-run'
const BASE=self.registration.scope

const wait=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),ms))])

self.addEventListener('install',e=>{
 e.waitUntil((async()=>{
  const c=await caches.open(SHELL)
  const res=await fetch(BASE,{cache:'reload'})
  const html=await res.clone().text()
  await c.put(BASE,res)
  const urls=new Set([BASE+'manifest.webmanifest',BASE+'icons/icon-192.png',BASE+'icons/icon-512.png',BASE+'icons/favicon.svg'])
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){
   try{const u=new URL(m[1],BASE);if(u.origin===location.origin||u.hostname==='fonts.googleapis.com')urls.add(u.href)}catch{}}
  await Promise.all([...urls].map(async u=>{
   try{
    const cross=new URL(u).origin!==location.origin
    const r=await fetch(u,cross?{mode:'no-cors'}:undefined)
    if(r.ok||r.type==='opaque')await c.put(u,r)}catch{}}))
  await self.skipWaiting()})())})

self.addEventListener('activate',e=>{
 e.waitUntil((async()=>{
  for(const k of await caches.keys())if(!k.startsWith(VERSION))await caches.delete(k)
  await self.clients.claim()})())})

const page=async req=>{
 const c=await caches.open(SHELL)
 try{const r=await wait(fetch(req),3500);if(r.ok)c.put(BASE,r.clone());return r}
 catch{return(await c.match(BASE))||(await c.match(req))||Response.error()}}

const fresh=async(req,store)=>{
 const c=await caches.open(store),hit=await c.match(req)
 const net=fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}).catch(()=>null)
 return hit||(await net)||Response.error()}

const keep=async req=>{
 const hit=await caches.match(req)
 if(hit)return hit
 try{const r=await fetch(req);if(r.ok)(await caches.open(RUN)).put(req,r.clone());return r}
 catch{return Response.error()}}

self.addEventListener('fetch',e=>{
 const req=e.request
 if(req.method!=='GET')return
 const u=new URL(req.url)
 if(req.mode==='navigate'){e.respondWith(page(req));return}
 if(u.origin===location.origin){
  e.respondWith(u.pathname.includes('/assets/')?keep(req):fresh(req,RUN));return}
 if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com')e.respondWith(fresh(req,RUN))})
