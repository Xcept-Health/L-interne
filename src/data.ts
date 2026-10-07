export interface Card{id:number;q:string;it:string[]}
const RAW=`Éléments des soins après avortement::Traitement d'urgence|Planification familiale|Counseling|Lien avec les autres services de SR|Implication de la communauté
Éléments du score d'APGAR::Fréquence cardiaque|Respiration|Tonus musculaire|Réactivité|Coloration
Conseils à une fille de 14 ans venue pour un avortement provoqué::S'enquérir des raisons|La dissuader en expliquant les risques|L'informer du cadre légal (⚠ vérifier avec ton cours)
Éléments de l'épaule négligée::Présentation de l'épaule|Femme en travail depuis longtemps|Membranes rompues|Utérus rétracté|Fœtus mort
3 complications de la présentation du siège::Rétention de la tête dernière|Relèvement des bras|Arrêt de la progression
Conditions d'accouchement de la face::Déflexion maximale de la tête|Menton en avant, calé sous la symphyse|Engagement par le diamètre sous-mento-bregmatique|Rotation en avant et haute
Contraception d'urgence::DIU|Pilule du lendemain|RU 486
Complications du paludisme pendant la grossesse::0–6 mois : aggravation des signes, anémie, avortement, MFIU|6–9 mois : accouchement prématuré, hémorragie, palu congénital, dystocie dynamique|Post-partum : ↓ lochies, ↓ montée laiteuse, infection puerpérale
Étiologies de l'hémorragie de la délivrance::Rétention de débris placentaires|Atonie utérine|Inversion utérine|Afibrinogénémie
SONU de base::Antibiotiques|Ocytociques|Anticonvulsivants|Extraction manuelle du placenta|l'internen utérine|Réanimation du nouveau-né|AVB instrumental (forceps, ventouse)
SONU complet::SONU de base|Transfusion sanguine|Césarienne|Laparotomie (rupture utérine, GEU, pelvipéritonite)
CAT devant un stérilet infecté::Retirer le stérilet|Traiter l'infection|Proposer une autre méthode
Complications de la RPM::Chorioamniotite|Embolie amniotique|Procidence du cordon|Présentation vicieuse
Avantages du lait maternel::Température stable|Adapté à chaque enfant|Frais, vivant|Économique|Nutritif|Facile à digérer|Limite la gravité des diarrhées|Relation mère-enfant|Anticorps adaptés|↓ allergies|Espacement naturel des naissances
Vaccins autorisés pendant la grossesse::Antigrippal|Polio injectable|Typhim Vi|VAT|Hépatite B|Antiméningococcique
Traitement de la cervicite à trichomonas::Patiente + partenaire(s)|Métronidazole 2 g en dose unique
Forme histologique du cancer du col::Carcinome épidermoïde (spinocellulaire)
HRP vs placenta prævia::PP : saignement indolore, ATCD de saignements, après rapports/TV, rouge, pas d'HTA, choc proportionnel, présentation normale, utérus souple, BDCF perçus|HRP : douleur intense, premier saignement, sans prodrome, noirâtre, HTA/toxémie, choc disproportionné, fœtus difficile à palper, utérus de bois, BDCF absents
Facteurs de risque du cancer du col::Rapports multiples|Rapports précoces|Bas niveau socio-économique|Grande multiparité|Infections cervicales (HPV, herpès)|Dysplasie cervicale
Classification FIGO du cancer du col::0 : in situ|I : micro-invasif (Ia histologique, Ib clinique)|II : vagin et paramètres (IIa 2/3 sup. du vagin ; IIb paramètres)|III : IIIa au-delà des 2/3 sup. du vagin ; IIIb paramètres ± atteinte urinaire|IV : IVa vessie/rectum ; IVb métastases
Indications de césarienne::Absolues : bassin limite/asymétrique, PP recouvrant, HRP fœtus vivant, procidence battante, SFA à petite dilatation, front/épaule/face enclavée|Relatives : échec épreuve du travail, échec ttt HRP/PP/toxémie, macrosomie primipare, HTA, diabète, cardiopathie décompensée|De sécurité : grossesse précieuse, sauvetage maternel, post-mortem
Contraception chez une femme HTA::Exclure les œstroprogestatifs|Méthode naturelle|Méthode de barrière|Progestatif seul|DIU
Indications de la césarienne prophylactique::Utérus doublement cicatriciel, SFC, PP|Drépanocytaire avec crises répétées|ATCD obstétricaux chargés
Procidence vs procubitus::Procidence : cordon devant la présentation, membranes rompues|Procubitus : idem, membranes intactes
Grossesse molaire : définition et surveillance::Dégénérescence kystique des villosités (hyperplasie + dystrophie)|Clinique : saignements, involution utérine|Écho : kystes lutéiniques|βHCG : hebdo 6 sem → mensuel 3 mois → trimestriel 9 mois → semestriel 1 an
Examen du sein::Inspection : volume, parité, symétrie, coloration|Palpation bilatérale comparative : nodule, écoulement, aires ganglionnaires|Pression des mamelons
Signes de rupture utérine::Douleur brutale en coup de poignard puis accalmie|Sensation d'eau chaude abdominale|Choc|Fœtus palpé sous la peau|BDCF absents
Conduite devant un hydramnios::Ponction abdominale répétée 100–200 cc|Rupture large des membranes|Position de Trendelenburg
Étiologies des ruptures utérines::Maternelles : multiparité, manœuvre abortive, obstacle prævia, déchirure du col|Fœtales : présentations vicieuses, hydrocéphalie, macrosomie|Iatrogènes : utérotoniques non contrôlés
Complications de la délivrance::Rétention placentaire|Hémorragie de la délivrance|Inversion utérine|Placenta accreta
Boîte de césarienne::Lame de bistouri|Porte-aiguilles et fils|Pince à peau|Pince de Kocher|Pince de Farabeuf|Pince à cœur|Pince à disséquer|Ciseaux|Valve sous-pubienne
Calendrier des CPN::CPN1 : 12–16 SA|CPN2 : 20–24 SA|CPN3 : 28–32 SA|CPN4 : 36 SA
Composantes des CPN::Dépistage et PEC des maladies préexistantes/complications|Prévention|Promotion de la santé|Préparation à l'accouchement
3 indications de césarienne dans le PP::PP recouvrant|PP non recouvrant avec hémorragie persistante|Hémorragie importante (sauvetage maternel)
Complications de l'HTA gravidique::Éclampsie|HRP|HELLP|Coagulopathies|AVC|Décès maternel|Mort fœtale|Prématurité|RCIU
Épreuve du travail::Tentative raisonnable d'AVB en présentation céphalique
Épreuve utérine::Tentative d'AVB sur utérus cicatriciel
Classification TNM du sein::T : T0 aucune, Tis in situ, T1 ≤2 cm, T2 2–5 cm, T3 >5 cm, T4 paroi/peau (a paroi, b peau, c les deux, d inflammatoire)|N : N0 aucune, N1 axillaire mobile, N2 axillaire fixée, N3 mammaire interne|M : M0 pas de métastase, M1 à distance
Définition de l'engagement::Franchissement du détroit supérieur par le plus grand diamètre de la présentation|TV : signe de Farabeuf|Palpation : ⚠ incomplet dans la source
Surveillance des suites de couches::Immédiate : globe de sécurité, TA, T°, pouls, traitement|H6 : état général, globe, saignements, périnée, pansement si césarienne, mollets, nouveau-né
Étiologies du placenta prævia::Synéchies|ATCD d'endométrite|Grossesses multiples|Ablation de myome intracavitaire|Fibrome|Malformation utérine
Complications des kystes ovariens::Torsion|Infection|Compression des organes voisins|Rupture hémorragique
Accouchement du siège::Conditions : dilatation complète, contact avec le périnée, épisiotomie, syntocinon, efforts sur contractions, abstention jusqu'à la pointe de l'omoplate, pédiatre présent|Vermelin : expectative|Bracht : renversement progressif, dos vers le ventre maternel|Mauriceau : tête dernière retenue|Lovset : bras relevés, rotations (⚠ vérifier le sens avec ton cours)
Complications des fibromes::Hémorragies|Compression|Accidents thromboemboliques|Avortements|RPM|PP|Endométrite
Algies pelviennes::Aiguës : GEU, menace d'avortement, rupture kystique, endométrite|Chroniques : endométriose, dysménorrhée, dystrophie ovarienne
Signes de prérupture::Rétraction accentuée|Utérus dur|Signe de Bandl-Frommel|Utérus en sablier|Hypercinésie|Dilatation stationnaire|Choc
Signes de GEU rompue::Douleur diffuse irradiant lombes, épigastre, épaules|Choc|Irritation péritonéale (cri du Douglas, de l'ombilic, météorisme)|Culdocentèse : sang noirâtre incoagulable
Étiologies des hémorragies du 1er trimestre::GEU|Grossesse molaire|Avortement|Cancer du col|Polype du col|Cervicite
Étiologies des hémorragies du 3e trimestre::HRP|Placenta prævia|Rupture utérine|⚠ la source répète ici la liste du T1 (à vérifier)
3 modifications du col en travail::Formation et ampliation du segment inférieur|Effacement et dilatation|Modification du pôle inférieur de l'œuf
Éléments de la GATPA::Exclure un autre enfant|Ocytocine 10 UI IM|Pince sur le cordon|Attendre une contraction|Traction contrôlée + refoulement de l'utérus|Massage utérin|Examen du placenta|Examen de la filière génitale
Repères des présentations::Sommet : occiput|Bregma : grande fontanelle|Face : menton|Front : racine du nez|Épaule : acromion|Siège : sacrum
Soins systématiques du nouveau-né::Pansement ombilical / clamp de Bard|Désobstruction buccale et VAS|Examen neurologique|Collyre aseptique|Vitamine K1|Mensurations (PN, PC, PT, taille)`
export const GYNECO:Card[]=RAW.split('\n').map((l,i)=>{const[q,r]=l.split('::');return{id:i+1,q,it:r.split('|')}})
export interface Module{key:string;name:string;sub:string;emoji:string;hue:string;cards?:Card[]}
export const MODULES:Module[]=[
{key:'gyneco',name:'Gynécologie-Obstétrique',sub:'Cliniques & urgences',emoji:'🫶',hue:'#e5546b',cards:GYNECO},
{key:'cardio',name:'Cardiologie',sub:'Bientôt',emoji:'🫀',hue:'#d94a3a'},
{key:'pedia',name:'Pédiatrie',sub:'Bientôt',emoji:'🧸',hue:'#e0a31a'},
{key:'chir',name:'Chirurgie',sub:'Bientôt',emoji:'🩺',hue:'#3b82c4'},
{key:'urg',name:'Urgences',sub:'Bientôt',emoji:'🚑',hue:'#7a5bd6'},
{key:'infec',name:'Infectieux',sub:'Bientôt',emoji:'🦠',hue:'#1f9d6b'}]
