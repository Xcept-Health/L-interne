import {useEffect,useRef} from 'react'

/* Bouton « retour » du téléphone / du navigateur.
 * Chaque écran « enfant » (détail d'un calcul, d'une mesure, carte mentale, onglet hors Accueil)
 * s'inscrit dans l'historique : le retour système le ferme au lieu de quitter l'application
 * (ce qui donnait un écran vide). Fermé depuis l'interface, il retire son entrée d'historique. */
interface L{close:()=>void}
const stack:L[]=[]
let skip=0,pending=0,bound=false
function bind(){
 if(bound)return;bound=true
 addEventListener('popstate',()=>{
  if(skip>0){skip--;return}
  stack.pop()?.close()})}

export function useBackLayer(open:boolean,close:()=>void){
 const cb=useRef(close);cb.current=close
 useEffect(()=>{
  if(!open)return
  bind()
  const l:L={close:()=>cb.current()}
  try{history.pushState({iv:1},'')}catch{return}
  stack.push(l)
  return()=>{
   const i=stack.indexOf(l)
   if(i<0)return            // déjà retiré par le bouton retour système
   stack.splice(i,1);pending++
   queueMicrotask(()=>{     // plusieurs écrans fermés ensemble : un seul saut en arrière
    if(pending<=0)return
    const n=pending;pending=0;skip+=n
    try{history.go(-n)}catch{skip-=n}})}
 },[open])}