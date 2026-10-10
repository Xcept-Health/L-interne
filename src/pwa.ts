import {useEffect,useState} from 'react'

/** Enregistre le service worker (production seulement) et demande à protéger les données locales de l'effacement automatique. */
export function registerSW(){
 const prod=(import.meta as unknown as {env?:{PROD?:boolean}}).env?.PROD
 if(!prod||!('serviceWorker' in navigator))return
 addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js').catch(()=>{})
  try{navigator.storage?.persist?.()}catch{}})}

/** true si l'appareil a du réseau (indicatif : « connecté » ne garantit pas que le réseau fonctionne). */
export function useOnline(){
 const [on,setOn]=useState(()=>navigator.onLine)
 useEffect(()=>{
  const u=()=>setOn(true),d=()=>setOn(false)
  addEventListener('online',u);addEventListener('offline',d)
  return()=>{removeEventListener('online',u);removeEventListener('offline',d)}},[])
 return on}

interface BIP extends Event{prompt():Promise<void>}
/** Installation sur l'écran d'accueil. `can` = le navigateur propose l'installation ; `done` = déjà installée. */
export function useInstall(){
 const [ev,setEv]=useState<BIP|null>(null)
 const [done,setDone]=useState(()=>matchMedia('(display-mode: standalone)').matches)
 useEffect(()=>{
  const a=(e:Event)=>{e.preventDefault();setEv(e as BIP)}
  const b=()=>{setDone(true);setEv(null)}
  addEventListener('beforeinstallprompt',a);addEventListener('appinstalled',b)
  return()=>{removeEventListener('beforeinstallprompt',a);removeEventListener('appinstalled',b)}},[])
 return {can:!!ev&&!done,done,install:async()=>{if(!ev)return;await ev.prompt();setEv(null)}}}
