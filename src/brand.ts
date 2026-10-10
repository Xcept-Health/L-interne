/** Identité de l'organisation. Modifie ces valeurs si besoin. */
export const BRAND={
    name:'Xcept-Health',
    tag:'Tout commence par une exception',
    /** Site web de l'organisation : remplace par son adresse. Tant que c'est vide, la marque ouvre le GitHub. */
    site:'https://www.Xcept-Health.comm',
    github:'https://github.com/Xcept-Health',
    huggingface:'https://huggingface.co/Xcept-Health'}
   /** Page ouverte au clic sur la marque */
   export const HOME_URL=BRAND.site||BRAND.github
   /** Liens affichés sous la marque (le site web n'apparaît que s'il est renseigné) */
   export const LINKS:[string,string][]=([
    ['Site web',BRAND.site],['GitHub',BRAND.github],['Hugging Face',BRAND.huggingface]] as [string,string][]).filter(l=>l[1])