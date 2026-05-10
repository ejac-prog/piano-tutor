import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext, memo } from "react";

/* ═══════════════════════════════════════════════════════════════════
   SLOTS CONTEXT — pousser top (header right) et side (sidebar) JSX
   ═══════════════════════════════════════════════════════════════════ */
const SlotsCtx = createContext({ setTop:()=>{}, setSide:()=>{}, setPiano:()=>{}, has:false });

/* ═══════════════════════════════════════════════════════════════════
   RESPONSIVE CONTEXT — un seul listener de resize partagé par toute l'app
   au lieu d'un par composant qui appelle useResponsive(). Économie : ~10
   listeners en moins en pratique.
   ═══════════════════════════════════════════════════════════════════ */
const ResponsiveCtx = createContext(null);

/* ═══════════════════════════════════════════════════════════════════
   APP CONSTANTS — magic numbers centralisés
   ═══════════════════════════════════════════════════════════════════ */
const BPM_MIN = 40;
const BPM_MAX = 120;
const BPM_STEP = 5;
const BEATS_PER_BAR = 4;
// Couleur par défaut de la main droite (mélodie)
const RIGHT_HAND_COLOR = "#e879f9";
// Délais visuels (ms) pour les surbrillances "pressed" lors de la lecture
const PRESS_FLASH_MS = 300;
const PRESS_FLASH_LONG_MS = 500;
// Convertit BPM en millisecondes par temps (noire)
const beatMs = bpm => 60000 / bpm;

/* ═══════════════════════════════════════════════════════════════════
   SONG DATA — add new songs here
   ═══════════════════════════════════════════════════════════════════ */
const SONGS = {
  zombie: {
    title: "Zombie",
    artist: "The Cranberries",
    bpm: 86,
    difficulty: "Débutant",
    color: "#6366f1",
    keys: [ // piano keys needed for this song
      {note:"C3",type:"w"},{note:"C#3",type:"b"},{note:"D3",type:"w"},{note:"D#3",type:"b"},
      {note:"E3",type:"w"},{note:"F3",type:"w"},{note:"F#3",type:"b"},{note:"G3",type:"w"},
      {note:"G#3",type:"b"},{note:"A3",type:"w"},{note:"A#3",type:"b"},{note:"B3",type:"w"},
      {note:"C4",type:"w"},{note:"C#4",type:"b"},{note:"D4",type:"w"},{note:"D#4",type:"b"},
      {note:"E4",type:"w"},
    ],
    chords: [
      { name:"Em", full:"Mi mineur", keys:["E3","G3","B3"], color:"#6366f1",
        fingers:{E3:"5",G3:"3",B3:"1"}, arp:["E3","G3","B3","G3","E3","G3","B3","G3"] },
      { name:"C", full:"Do majeur", keys:["C3","E3","G3"], color:"#06b6d4",
        fingers:{C3:"5",E3:"3",G3:"1"}, arp:["C3","E3","G3","E3","C3","E3","G3","E3"] },
      { name:"G", full:"Sol majeur", keys:["G3","B3","D4"], color:"#10b981",
        fingers:{G3:"5",B3:"3",D4:"1"}, arp:["G3","B3","D4","B3","G3","B3","D4","B3"] },
      { name:"D", full:"Ré majeur", keys:["D3","F#3","A3"], color:"#f59e0b",
        fingers:{D3:"5","F#3":"3",A3:"1"}, arp:["D3","F#3","A3","F#3","D3","F#3","A3","F#3"] },
    ],
    riff: [
      {note:"E4",dur:1},{note:"E4",dur:1},{note:"D4",dur:1},{note:"E4",dur:2},
      {note:"_",dur:1},{note:"E4",dur:1},{note:"D4",dur:1},{note:"B3",dur:2},
      {note:"_",dur:1},{note:"E4",dur:1},{note:"D4",dur:1},{note:"B3",dur:1},
      {note:"A3",dur:2},{note:"B3",dur:2},
    ],
    riffNotes: ["A3","B3","D4","E4"],
    melody: {
      verse: { label:"Couplet",
        notes:[{note:"E4",dur:1},{note:"E4",dur:1},{note:"E4",dur:1},{note:"E4",dur:1},{note:"D4",dur:1},{note:"D4",dur:2},{note:"E4",dur:1},{note:"_",dur:1},{note:"E4",dur:1},{note:"E4",dur:1},{note:"D4",dur:1},{note:"D4",dur:1},{note:"E4",dur:2},{note:"E4",dur:1}] },
      chorus: { label:"Refrain",
        notes:[{note:"E4",dur:1},{note:"D4",dur:1},{note:"B3",dur:2},{note:"_",dur:1},{note:"E4",dur:1},{note:"D4",dur:1},{note:"B3",dur:2},{note:"_",dur:1},{note:"E4",dur:1},{note:"E4",dur:1},{note:"D4",dur:1},{note:"D4",dur:1},{note:"C4",dur:1},{note:"B3",dur:2}] },
    },
    melodyNotes: ["B3","C4","D4","E4"],
    melFingers: {A3:"1",B3:"2",C4:"3",D4:"4",E4:"5"},
    melPerChord: [["E4","D4","B3","B3"],["E4","D4","B3","B3"],["E4","E4","D4","D4"],["E4","E4","D4","C4"]],
    structure: [
      {section:"intro",label:"Intro",reps:1},{section:"verse",label:"Couplet 1",reps:2},
      {section:"chorus",label:"Refrain",reps:2},{section:"verse",label:"Couplet 2",reps:2},
      {section:"chorus",label:"Refrain",reps:2},{section:"outro",label:"Outro",reps:1},
    ],
    lessons: [
      {t:"Les 4 accords",s:"Main gauche, blocs",icon:"①",wk:"Sem. 1",
       goals:["Trouver chaque accord sans hésiter","Enchaîner Em → C → G → D","Tenir 60 bpm"],
       tip:"Garde les doigts proches des touches. Le moins de mouvement possible."},
      {t:"Arpèges",s:"Main gauche, décomposé",icon:"②",wk:"Sem. 1-2",
       goals:["Jouer l'arpège de Em en boucle","Enchaîner les 4 arpèges","Tenir 60 bpm en arpèges"],
       tip:"Le pattern est toujours pareil : bas-milieu-haut-milieu."},
      {t:"Riff d'intro",s:"Main droite, le hook",icon:"③",wk:"Sem. 2",
       goals:["Jouer le riff lentement","Le jouer à 60 bpm","L'enchaîner 4x sans erreur"],
       tip:"C'est ce riff qui fait reconnaître la chanson dès les premières secondes."},
      {t:"La mélodie",s:"Main droite, couplet + refrain",icon:"④",wk:"Sem. 2",
       goals:["Jouer le couplet","Jouer le refrain","Enchaîner les deux sans pause"],
       tip:"Pouce sur la, index sur si, majeur sur do, annulaire sur ré, auriculaire sur mi."},
      {t:"Les deux mains",s:"Coordination lente",icon:"⑤",wk:"Sem. 3",
       goals:["Accord + 2 notes de mélodie","2 accords avec mélodie à 40 bpm","Boucle complète à 50 bpm"],
       tip:"Plaque l'accord, garde-le enfoncé, puis ajoute UNE note de mélodie."},
      {t:"Tempo réel",s:"Montée vers 86 bpm",icon:"⑥",wk:"Sem. 3-4",
       goals:["Boucle complète à 70 bpm","Nuances : refrain plus fort","Jouer sans regarder"],
       tip:"Monte de 5 bpm quand tu enchaînes 3 boucles sans erreur."},
      {t:"Performance",s:"La chanson au complet",icon:"⑦",wk:"Sem. 4",
       goals:["Enchaîner intro → couplet → refrain","Jouer la structure complète","Le faire devant tes amis"],
       tip:"Suis le guide. Intro, couplet, refrain, couplet, refrain, outro."},
    ],
  },
  thousandYears: {
    title: "A Thousand Years",
    artist: "Christina Perri",
    bpm: 70,
    difficulty: "Débutant",
    color: "#ec4899",
    keys: [
      {note:"C3",type:"w"},{note:"C#3",type:"b"},{note:"D3",type:"w"},{note:"D#3",type:"b"},
      {note:"E3",type:"w"},{note:"F3",type:"w"},{note:"F#3",type:"b"},{note:"G3",type:"w"},
      {note:"G#3",type:"b"},{note:"A3",type:"w"},{note:"A#3",type:"b"},{note:"B3",type:"w"},
      {note:"C4",type:"w"},{note:"C#4",type:"b"},{note:"D4",type:"w"},{note:"D#4",type:"b"},
      {note:"E4",type:"w"},{note:"F4",type:"w"},{note:"F#4",type:"b"},{note:"G4",type:"w"},
      {note:"G#4",type:"b"},{note:"A4",type:"w"},{note:"A#4",type:"b"},{note:"B4",type:"w"},
      {note:"C5",type:"w"},
    ],
    chords: [
      { name:"C", full:"Do majeur", keys:["C3","E3","G3"], color:"#ec4899",
        fingers:{C3:"5",E3:"3",G3:"1"}, arp:["C3","E3","G3","E3","C3","E3","G3","E3"] },
      { name:"G", full:"Sol majeur", keys:["G3","B3","D4"], color:"#06b6d4",
        fingers:{G3:"5",B3:"3",D4:"1"}, arp:["G3","B3","D4","B3","G3","B3","D4","B3"] },
      { name:"Am", full:"La mineur", keys:["A3","C4","E4"], color:"#a78bfa",
        fingers:{A3:"5",C4:"3",E4:"1"}, arp:["A3","C4","E4","C4","A3","C4","E4","C4"] },
      { name:"F", full:"Fa majeur", keys:["F3","A3","C4"], color:"#f59e0b",
        fingers:{F3:"5",A3:"3",C4:"1"}, arp:["F3","A3","C4","A3","F3","A3","C4","A3"] },
    ],
    riff: [
      {note:"C4",dur:1},{note:"E4",dur:1},{note:"G4",dur:1},{note:"E4",dur:1},
      {note:"C4",dur:1},{note:"E4",dur:1},{note:"G4",dur:2},
      {note:"D4",dur:1},{note:"G4",dur:1},{note:"B4",dur:1},{note:"G4",dur:1},
      {note:"D4",dur:1},{note:"G4",dur:1},{note:"B4",dur:2},
    ],
    riffNotes: ["C4","D4","E4","G4","B4"],
    melody: {
      verse: { label:"Couplet",
        notes:[{note:"G4",dur:1},{note:"G4",dur:1},{note:"A4",dur:1},{note:"B4",dur:1},{note:"B4",dur:1},{note:"C5",dur:1},{note:"B4",dur:1},{note:"A4",dur:1},{note:"G4",dur:1},{note:"A4",dur:1},{note:"B4",dur:1},{note:"C5",dur:1},{note:"C5",dur:1},{note:"B4",dur:1},{note:"A4",dur:1},{note:"G4",dur:2}] },
      chorus: { label:"Refrain",
        notes:[{note:"G4",dur:1},{note:"B4",dur:1},{note:"A4",dur:1},{note:"G4",dur:1},{note:"A4",dur:1},{note:"B4",dur:1},{note:"C5",dur:1},{note:"B4",dur:1},{note:"A4",dur:1},{note:"G4",dur:2},{note:"_",dur:1},{note:"G4",dur:1},{note:"B4",dur:1},{note:"A4",dur:1},{note:"G4",dur:1},{note:"A4",dur:1},{note:"B4",dur:1},{note:"C5",dur:1},{note:"B4",dur:1},{note:"A4",dur:1},{note:"G4",dur:2}] },
    },
    melodyNotes: ["G4","A4","B4","C5"],
    melFingers: {G4:"1",A4:"2",B4:"3",C5:"4"},
    melPerChord: [["G4","G4","A4","B4"],["B4","C5","B4","A4"],["G4","A4","B4","C5"],["C5","B4","A4","G4"]],
    structure: [
      {section:"intro",label:"Intro",reps:1},{section:"verse",label:"Couplet 1",reps:2},
      {section:"chorus",label:"Refrain",reps:2},{section:"verse",label:"Couplet 2",reps:2},
      {section:"chorus",label:"Refrain",reps:2},{section:"outro",label:"Outro",reps:1},
    ],
    lessons: [
      {t:"Les 4 accords",s:"Main gauche, blocs",icon:"①",wk:"Sem. 1",
       goals:["Trouver chaque accord sans hésiter","Enchaîner C → G → Am → F","Tenir 60 bpm"],
       tip:"Les 4 accords les plus joués au monde. Doigts proches des touches, mouvement minimal."},
      {t:"Arpèges",s:"Main gauche, décomposé",icon:"②",wk:"Sem. 1-2",
       goals:["Jouer l'arpège de C en boucle","Enchaîner les 4 arpèges","Tenir 60 bpm en arpèges"],
       tip:"Pattern bas-milieu-haut-milieu, comme une vague qui monte et redescend."},
      {t:"Intro qui roule",s:"Main droite, le hook",icon:"③",wk:"Sem. 2",
       goals:["Jouer l'arpège ascendant lentement","Le jouer à 60 bpm","Le boucler 4x sans erreur"],
       tip:"C'est le motif qu'on entend dans Twilight. Joue-le doux, comme une boîte à musique."},
      {t:"La mélodie",s:"Main droite, couplet + refrain",icon:"④",wk:"Sem. 2",
       goals:["Jouer le couplet","Jouer le refrain","Enchaîner les deux sans pause"],
       tip:"Pouce sur sol, index sur la, majeur sur si, annulaire sur do."},
      {t:"Les deux mains",s:"Coordination lente",icon:"⑤",wk:"Sem. 3",
       goals:["Accord + 2 notes de mélodie","2 accords avec mélodie à 40 bpm","Boucle complète à 50 bpm"],
       tip:"Plaque l'accord, garde-le enfoncé, puis ajoute UNE note de mélodie."},
      {t:"Tempo réel",s:"Montée vers 70 bpm",icon:"⑥",wk:"Sem. 3-4",
       goals:["Boucle complète à 60 bpm","Nuances : refrain plus chargé","Jouer sans regarder"],
       tip:"C'est une ballade : laisse respirer entre les phrases, ne te précipite pas."},
      {t:"Performance",s:"La chanson au complet",icon:"⑦",wk:"Sem. 4",
       goals:["Enchaîner intro → couplet → refrain","Jouer la structure complète","Le faire devant tes amis"],
       tip:"Suis le guide. Intro, couplet, refrain, couplet, refrain, outro."},
    ],
  },
};

/* ═══════════════════════════════════════════════════════════════════
   CORE UTILS
   ═══════════════════════════════════════════════════════════════════ */
const NFR={C:"Do","C#":"Do#",D:"Ré","D#":"Ré#",E:"Mi",F:"Fa","F#":"Fa#",G:"Sol","G#":"Sol#",A:"La","A#":"La#",B:"Si"};
const FREQ={C3:130.81,"C#3":138.59,D3:146.83,"D#3":155.56,E3:164.81,F3:174.61,"F#3":185,G3:196,"G#3":207.65,A3:220,"A#3":233.08,B3:246.94,C4:261.63,"C#4":277.18,D4:293.66,"D#4":311.13,E4:329.63,F4:349.23,"F#4":369.99,G4:392,"G#4":415.30,A4:440,"A#4":466.16,B4:493.88,C5:523.25};
const fr=n=>NFR[n.replace(/\d/,"")]||n;
// Construit un hand map à partir d'une liste de notes et d'une lettre de main ("L" ou "R")
const handsOf=(notes,h)=>{const o={};notes.forEach(n=>{o[n]=h});return o};
// Combine deux hand maps (utilisé en L5 pour fusionner main gauche + main droite)
const mergeHands=(a,b)=>({...a,...b});
const MIDI_NAMES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const midiToName=m=>`${MIDI_NAMES[m%12]}${Math.floor(m/12)-1}`;
const ALL_NOTES=[];
for(let o=2;o<=6;o++) MIDI_NAMES.forEach((n,i)=>{const midi=(o+1)*12+i;ALL_NOTES.push({name:`${n}${o}`,freq:440*Math.pow(2,(midi-69)/12)})});

/* ═══════════════════════════════════════════════════════════════════
   RESPONSIVE HOOK — iPad vs phone
   ═══════════════════════════════════════════════════════════════════ */
// Calcule l'objet responsive à partir de width/height. Pure, sans state.
function computeResponsive(w,h){
  const ipad=w>=700;
  const landscape=ipad && w>h;
  const pianoH=landscape?Math.min(240,Math.floor(h*0.34)):(ipad?240:170);
  const pianoMaxW=landscape?Math.min(w-48,1200):(ipad?680:540);
  return{
    ipad, landscape, w, h,
    piano:{h:pianoH, maxW:pianoMaxW},
    font:{xs:ipad?11:8, sm:ipad?13:10, md:ipad?16:13, lg:ipad?20:16, xl:ipad?26:20, xxl:ipad?32:24},
    btn:{min:ipad?44:26, play:ipad?52:42, lg:ipad?56:48},
    gap:ipad?10:6, pad:ipad?18:12, rad:ipad?12:10,
    finger:{w:ipad?28:21,f:ipad?13:10},
    tab:{p:ipad?"10px 8px":"6px 2px",f:ipad?9:6,icon:ipad?16:12},
  };
}

// Hook SOURCE : à appeler UNE SEULE FOIS au sommet de l'arbre (PianoTutor).
// Pose les listeners resize/orientation et retourne un objet R stable.
function useResponsiveSource(){
  const[s,setS]=useState(()=>typeof window!=="undefined"?{w:window.innerWidth,h:window.innerHeight}:{w:400,h:800});
  useEffect(()=>{
    const h=()=>setS({w:window.innerWidth,h:window.innerHeight});
    window.addEventListener("resize",h);
    window.addEventListener("orientationchange",h);
    return()=>{
      window.removeEventListener("resize",h);
      window.removeEventListener("orientationchange",h);
    };
  },[]);
  return useMemo(()=>computeResponsive(s.w,s.h),[s.w,s.h]);
}

// Hook CONSOMMATEUR : lit le ResponsiveCtx. Si pas de provider (test, ou
// composant utilisé hors arbre), fallback sur les dimensions courantes.
function useResponsive(){
  const ctx=useContext(ResponsiveCtx);
  if(ctx) return ctx;
  // Fallback : calcul one-shot sans listener (pour cas exceptionnels)
  if(typeof window==="undefined") return computeResponsive(400,800);
  return computeResponsive(window.innerWidth,window.innerHeight);
}

/* ═══════════════════════════════════════════════════════════════════
   AUDIO ENGINE
   - Attack ramp 6ms (gain 0 → v) : élimine le click d'attaque
   - Release courte (note 0.55s, chord 0.75s) : évite la superposition
     des résidus sur le beat suivant à 86 bpm (beat = 698ms)
   - Active sur même fréquence : fade-out 30ms de l'ancien avant
     d'attaquer le nouveau, pour neutraliser les battements quand on
     rejoue rapidement la même note (cause principale du "son bizarre
     une fois sur deux")
   - getCtx avec resume synchrone garanti par unlock() qui doit être
     appelé sur le premier geste utilisateur
   ═══════════════════════════════════════════════════════════════════ */
const NOTE_ATTACK = 0.006;
const NOTE_RELEASE = 0.55;
const CHORD_RELEASE = 0.75;
const FADE_OLD_MS = 0.03; // fade-out d'une note remplacée
function useAudio(){
  const ctx=useRef(null);const unlocked=useRef(false);const pool=useRef([]);const silentEl=useRef(null);
  // Réf vers la fonction pitch.pause(ms) — appelée automatiquement à chaque note jouée
  // pour suspendre la détection micro et neutraliser le larsen acoustique.
  const pitchPause=useRef(null);
  const setPitchPause=useCallback(fn=>{pitchPause.current=fn},[]);
  const getCtx=useCallback(()=>{if(!ctx.current)ctx.current=new(window.AudioContext||window.webkitAudioContext)();return ctx.current},[]);
  const unlock=useCallback(()=>{
    const c=getCtx();if(c.state==="suspended")c.resume();
    if(unlocked.current)return;
    // Oscillateur silencieux pour débloquer le AudioContext sur iOS
    const o=c.createOscillator(),g=c.createGain();g.gain.value=0;
    o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.001);
    // Contournement du switch silencieux iOS : un <audio> HTML5 silencieux en boucle
    // bascule la catégorie audio iOS de "ambient" vers "playback", ce qui permet au
    // son de jouer même quand l'iPad est en mode silencieux (switch latéral activé).
    if(!silentEl.current){
      try{
        // Génère un WAV strictement silencieux (50 ms, 8 kHz mono 16-bit) en runtime
        const sr=8000,ns=400,buf=new ArrayBuffer(44+ns*2),v=new DataView(buf);
        v.setUint32(0,0x46464952,true);v.setUint32(4,36+ns*2,true);v.setUint32(8,0x45564157,true);
        v.setUint32(12,0x20746d66,true);v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
        v.setUint32(24,sr,true);v.setUint32(28,sr*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
        v.setUint32(36,0x61746164,true);v.setUint32(40,ns*2,true);
        const url=URL.createObjectURL(new Blob([buf],{type:"audio/wav"}));
        const a=document.createElement("audio");
        a.setAttribute("playsinline","");a.setAttribute("webkit-playsinline","");
        a.loop=true;a.preload="auto";a.volume=1;a.src=url;
        const p=a.play();if(p&&p.catch)p.catch(()=>{});
        silentEl.current=a;
      }catch(e){}
    }
    unlocked.current=true;
  },[getCtx]);
  // Fade-out rapide d'un oscillateur déjà actif sur la même note (évite battements)
  const fadeOldByNote=useCallback((noteName,c)=>{
    const t=c.currentTime;
    pool.current.forEach(x=>{
      if(x.note===noteName&&!x.releasing){
        x.releasing=true;
        try{
          x.g.gain.cancelScheduledValues(t);
          x.g.gain.setValueAtTime(x.g.gain.value,t);
          x.g.gain.linearRampToValueAtTime(0,t+FADE_OLD_MS);
          x.o.stop(t+FADE_OLD_MS+0.005);
        }catch(e){}
      }
    });
  },[]);
  // Cleanup de garde-fou : si le pool dépasse une taille raisonnable
  // (ne devrait plus arriver avec la release courte), purge en douceur.
  const cleanup=useCallback(()=>{
    while(pool.current.length>10){
      const x=pool.current.shift();
      try{
        const t=x.o.context.currentTime;
        x.g.gain.cancelScheduledValues(t);
        x.g.gain.setValueAtTime(x.g.gain.value,t);
        x.g.gain.linearRampToValueAtTime(0,t+FADE_OLD_MS);
        x.o.stop(t+FADE_OLD_MS+0.005);
      }catch(e){}
    }
  },[]);
  const note=useCallback((n,v=0.3)=>{
    if(pitchPause.current)pitchPause.current(700);
    const c=getCtx();if(c.state==="suspended")c.resume();
    cleanup();
    fadeOldByNote(n,c);
    const t=c.currentTime;
    const o=c.createOscillator(),g=c.createGain();
    o.type="triangle";o.frequency.value=FREQ[n]||261;
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(v,t+NOTE_ATTACK);
    g.gain.exponentialRampToValueAtTime(.001,t+NOTE_RELEASE);
    o.connect(g);g.connect(c.destination);
    o.start(t);o.stop(t+NOTE_RELEASE+0.02);
    const item={o,g,note:n,releasing:false};
    pool.current.push(item);
    o.onended=()=>{try{o.disconnect();g.disconnect()}catch(e){}pool.current=pool.current.filter(x=>x!==item)};
  },[getCtx,cleanup,fadeOldByNote]);
  const chord=useCallback(keys=>{
    if(pitchPause.current)pitchPause.current(900);
    const c=getCtx();if(c.state==="suspended")c.resume();
    cleanup();
    const t=c.currentTime;
    keys.forEach(k=>{
      fadeOldByNote(k,c);
      const o=c.createOscillator(),g=c.createGain();
      o.type="triangle";o.frequency.value=FREQ[k]||261;
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(.2,t+NOTE_ATTACK);
      g.gain.exponentialRampToValueAtTime(.001,t+CHORD_RELEASE);
      o.connect(g);g.connect(c.destination);
      o.start(t);o.stop(t+CHORD_RELEASE+0.02);
      const item={o,g,note:k,releasing:false};
      pool.current.push(item);
      o.onended=()=>{try{o.disconnect();g.disconnect()}catch(e){}pool.current=pool.current.filter(x=>x!==item)};
    });
  },[getCtx,cleanup,fadeOldByNote]);
  // Retour stabilisé : les 4 fonctions étant des useCallback stables, useMemo
  // retourne toujours le MÊME objet. Crucial : sans ce useMemo, l'objet est recréé
  // à chaque render de PianoTutor (par ex. quand pitch.detected change toutes les
  // 40ms), ce qui invalide toute deps `[a, ...]` dans les useEffect des leçons et
  // les fait redéclencher en boucle. En L2 et L6, ça créait un brouhaha continu
  // car chaque redéclenchement appelait a.note/a.chord au render de PianoTutor.
  return useMemo(()=>({unlock,note,chord,setPitchPause}),[unlock,note,chord,setPitchPause]);
}

/* ═══════════════════════════════════════════════════════════════════
   MIDI
   ═══════════════════════════════════════════════════════════════════ */
function useMIDI(){
  const[supported]=useState(()=>!!navigator.requestMIDIAccess);
  const[connected,setConnected]=useState(false);const[deviceName,setDeviceName]=useState(null);
  const[error,setError]=useState(null);const[activeNotes,setActiveNotes]=useState(new Set());
  const accessRef=useRef(null);const cbRef=useRef(null);
  const onMsg=useCallback(e=>{const[st,nn,vel]=e.data;const cmd=st&0xf0;const name=midiToName(nn);
    if(cmd===0x90&&vel>0){setActiveNotes(p=>{const s=new Set(p);s.add(name);return s});if(cbRef.current)cbRef.current(name,"on",vel)}
    else if(cmd===0x80||(cmd===0x90&&vel===0)){setActiveNotes(p=>{const s=new Set(p);s.delete(name);return s});if(cbRef.current)cbRef.current(name,"off",0)}},[]);
  const bind=useCallback(a=>{const ins=Array.from(a.inputs.values());ins.forEach(i=>{i.onmidimessage=onMsg});
    if(ins.length>0){setConnected(true);setDeviceName(ins[0].name||"Appareil MIDI")}else{setConnected(false);setDeviceName(null)}},[onMsg]);
  const start=useCallback(async()=>{if(!supported){setError("MIDI non supporté");return}try{setError(null);
    const a=await navigator.requestMIDIAccess({sysex:false});accessRef.current=a;bind(a);a.onstatechange=()=>bind(a)}catch(e){setError("Accès MIDI refusé")}},[supported,bind]);
  const stop=useCallback(()=>{if(accessRef.current){Array.from(accessRef.current.inputs.values()).forEach(i=>{i.onmidimessage=null});accessRef.current.onstatechange=null}
    setConnected(false);setDeviceName(null);setActiveNotes(new Set())},[]);
  const onNote=useCallback(cb=>{cbRef.current=cb},[]);
  useEffect(()=>()=>stop(),[stop]);
  return{supported,connected,deviceName,error,activeNotes,start,stop,onNote};
}

/* ═══════════════════════════════════════════════════════════════════
   PITCH DETECTION (optimisé batterie)
   - setInterval 25Hz au lieu de requestAnimationFrame 60Hz : ~2x moins
     d'analyses, 60% d'économie CPU sur cette boucle.
   - fftSize 2048 (vs 4096) : autocorrélation 4x plus rapide, suffisant
     pour la plage piano 60-2000Hz.
   - Dedup des re-renders : si la note détectée est identique à la
     précédente, on ne déclenche pas setState (pas de re-render React).
   - pause(ms) : suspend la détection pendant N ms. Appelé automatiquement
     par useAudio à chaque a.note/a.chord pour neutraliser le larsen
     acoustique (le micro qui capte le son de l'iPad lui-même).
   - Page Visibility API : détection coupée quand l'onglet est en arrière-
     plan, économise pendant les pauses.
   ═══════════════════════════════════════════════════════════════════ */
function usePitch(){
  const mc=useRef(null);const an=useRef(null);const st=useRef(null);const bf=useRef(null);const iv=useRef(null);
  const suspendUntil=useRef(0);const lastNote=useRef(null);
  const[listening,setL]=useState(false);const[detected,setD]=useState(null);const[micError,setE]=useState(null);const cbRef=useRef(null);
  const noteFromFreq=f=>{if(f<60||f>2000)return null;let best=null,bd=Infinity;
    ALL_NOTES.forEach(n=>{const d=Math.abs(Math.log2(f/n.freq)*12);if(d<bd){bd=d;best={...n,cents:Math.round(Math.log2(f/n.freq)*1200)}}});return bd<1.5?best:null};
  const autoC=(buf,sr)=>{let rms=0;for(let i=0;i<buf.length;i++)rms+=buf[i]*buf[i];rms=Math.sqrt(rms/buf.length);if(rms<.01)return-1;
    let s=0,e=buf.length-1;for(let i=0;i<buf.length/2;i++){if(Math.abs(buf[i])>.2){s=i;break}}
    for(let i=buf.length-1;i>=buf.length/2;i--){if(Math.abs(buf[i])>.2){e=i;break}}
    const t=buf.slice(s,e);if(t.length<2)return-1;const c=new Array(Math.floor(t.length/2));
    for(let l=0;l<c.length;l++){let sum=0;for(let i=0;i<c.length;i++)sum+=t[i]*(t[i+l]||0);c[l]=sum}
    let d=0;while(c[d]>c[d+1]&&d<c.length-1)d++;let mv=-1,mp=-1;
    for(let i=d;i<c.length;i++){if(c[i]>mv){mv=c[i];mp=i}}if(mp<0)return-1;
    const y1=c[mp-1]||0,y2=c[mp],y3=c[mp+1]||0;const sh=(y3-y1)/(2*(2*y2-y1-y3));return sr/(mp+(isNaN(sh)?0:sh))};
  // Une seule analyse par tick. Si on est en pause (audio joue), skip total.
  // Si onglet caché, skip aussi pour économiser.
  const detect=useCallback(()=>{
    if(!an.current||!bf.current)return;
    if(document.hidden)return;
    if(performance.now()<suspendUntil.current){
      // Pendant la suspension on ne fait RIEN, pas même un setD(null).
      // On efface la note précédente une seule fois pour signaler visuellement la pause.
      if(lastNote.current!==null){lastNote.current=null;setD(null)}
      return;
    }
    an.current.getFloatTimeDomainData(bf.current);
    const f=autoC(bf.current,mc.current.sampleRate);
    if(f>0){
      const n=noteFromFreq(f);
      if(n){
        // Dedup : si la note a changé (ou que le décalage cents > 5), on push, sinon non.
        if(lastNote.current!==n.name){
          lastNote.current=n.name;
          setD({note:n.name,freq:Math.round(f),cents:n.cents,frName:fr(n.name)});
          if(cbRef.current)cbRef.current(n.name);
        }
        return;
      }
    }
    if(lastNote.current!==null){lastNote.current=null;setD(null)}
  },[]);
  const start=useCallback(async()=>{try{setE(null);const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    st.current=s;mc.current=new(window.AudioContext||window.webkitAudioContext)();const src=mc.current.createMediaStreamSource(s);
    an.current=mc.current.createAnalyser();an.current.fftSize=2048;src.connect(an.current);bf.current=new Float32Array(an.current.fftSize);
    setL(true);clearInterval(iv.current);iv.current=setInterval(detect,40)}catch(e){setE("Accès micro refusé")}},[detect]);
  const stop=useCallback(()=>{clearInterval(iv.current);iv.current=null;if(st.current)st.current.getTracks().forEach(t=>t.stop());
    if(mc.current)mc.current.close();st.current=null;mc.current=null;an.current=null;bf.current=null;lastNote.current=null;setL(false);setD(null)},[]);
  // Suspendre la détection pendant ms millisecondes. Utilisé par useAudio pour éviter
  // que le micro capte le son joué par l'iPad lui-même (anti-larsen).
  const pause=useCallback(ms=>{suspendUntil.current=Math.max(suspendUntil.current,performance.now()+ms)},[]);
  const onNote=useCallback(cb=>{cbRef.current=cb},[]);
  useEffect(()=>()=>{clearInterval(iv.current);if(st.current)st.current.getTracks().forEach(t=>t.stop());if(mc.current)try{mc.current.close()}catch(e){}},[]);
  return{listening,detected,micError,start,stop,onNote,pause};
}

/* ═══════════════════════════════════════════════════════════════════
   SAFE INTERVAL HOOK — auto-cleanup on unmount
   ═══════════════════════════════════════════════════════════════════ */
function useInterval(cb,ms,active){
  const saved=useRef(cb);
  useEffect(()=>{saved.current=cb});
  const id=useRef(null);
  useEffect(()=>{if(!active||ms==null){clearInterval(id.current);return}
    id.current=setInterval(()=>saved.current(),ms);return()=>clearInterval(id.current)},[ms,active]);
  return()=>clearInterval(id.current);
}

/* ═══════════════════════════════════════════════════════════════════
   PIANO
   ═══════════════════════════════════════════════════════════════════ */
// Piano memoïsé : ne rerender que quand ses props changent réellement.
// C'est le composant le plus lourd (50+ touches avec gradients, doigtés).
const Piano = memo(function Piano({keys,hl,hl2,fm,c1,c2,pressed,onClick,detectedNote,midiNotes,hands,R}){
  const ws=keys.filter(k=>k.type==="w"),bs=keys.filter(k=>k.type==="b");
  const bPos={};let wi=0;
  keys.forEach(k=>{if(k.type==="b")bPos[k.note]=wi-1;else wi++});
  const ww=100/ws.length;
  // Coloration : priorité à hl2 (main droite) sur hl (main gauche). Cohérent avec
  // mergeHands qui priorise R quand une note appartient aux deux mains. Sur G par
  // exemple, B3 est plaqué main G mais aussi joué main D dans la mélodie : on
  // l'affiche en couleur main D pour que le label "D2" s'aligne avec la couleur.
  const clr=n=>{if(hl2&&hl2.has(n))return c2||"#e879f9";if(hl&&hl.has(n))return c1;return null};
  const isDet=n=>(detectedNote&&detectedNote===n)||(midiNotes&&midiNotes.has(n));
  // Construit le label de doigté : G3 / D2 si la main est connue, sinon juste le numéro
  const fingerLabel=n=>{const f=fm[n];if(!f)return null;
    const h=hands&&hands[n];if(h==="L")return"G"+f;if(h==="R")return"D"+f;return f};
  const inner=(
    <div style={{position:"relative",width:"100%",maxWidth:R.piano.maxW,height:R.piano.h,margin:"0 auto"}}>
      <div style={{display:"flex",gap:2,height:"100%",position:"relative",zIndex:1}}>
        {ws.map(k=>{const cl=clr(k.note),pr=pressed.has(k.note),det=isDet(k.note);const lbl=fingerLabel(k.note);return(
          <div key={k.note} onClick={()=>onClick(k.note)} style={{
            flex:1,borderRadius:`0 0 ${R.rad}px ${R.rad}px`,cursor:"pointer",transition:"all .12s",
            position:"relative",display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",paddingBottom:R.pad-4,
            background:det?"#22c55e":pr?(cl||"#94a3b8"):cl?`linear-gradient(180deg,${cl}44,${cl}22)`:"linear-gradient(180deg,#f8fafc,#e2e8f0)",
            border:det?"2px solid #22c55e":cl?`2px solid ${cl}`:"1px solid #cbd5e1",
            boxShadow:det?"0 0 16px rgba(34,197,94,.5)":cl?`0 0 10px ${cl}33`:"0 2px 4px rgba(0,0,0,.1)",
          }}>
            {cl&&lbl&&<div style={{position:"absolute",top:R.pad,minWidth:R.finger.w,height:R.finger.w,padding:"0 4px",borderRadius:R.finger.w/2,background:det?"#22c55e":cl,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:R.finger.f,fontWeight:700,letterSpacing:"-0.5px"}}>{lbl}</div>}
            <div style={{fontSize:R.font.xs,fontWeight:600,color:det?"#22c55e":cl||"#94a3b8"}}>{fr(k.note)}</div>
          </div>);})}
      </div>
      {bs.map(k=>{const p=bPos[k.note];if(p===undefined)return null;const cl=clr(k.note),pr=pressed.has(k.note),det=isDet(k.note);const lbl=fingerLabel(k.note);return(
        <div key={k.note} onClick={()=>onClick(k.note)} style={{
          position:"absolute",top:0,zIndex:2,left:`${(p+1)*ww-ww*.3}%`,width:`${ww*.6}%`,height:"55%",
          borderRadius:`0 0 ${R.rad-4}px ${R.rad-4}px`,cursor:"pointer",transition:"all .12s",
          display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",paddingBottom:5,
          background:det?"#22c55e":pr?(cl||"#64748b"):cl?`linear-gradient(180deg,${cl},${cl}cc)`:"linear-gradient(180deg,#334155,#1e293b)",
          border:det?"2px solid #22c55e":cl?`2px solid ${cl}`:"1px solid #0f172a",
          boxShadow:det?"0 0 14px rgba(34,197,94,.6)":cl?`0 0 10px ${cl}55`:"0 3px 6px rgba(0,0,0,.4)",
        }}>
          {cl&&lbl&&<div style={{position:"absolute",top:R.pad-4,minWidth:R.finger.w-4,height:R.finger.w-4,padding:"0 3px",borderRadius:(R.finger.w-4)/2,background:det?"#166534":"#fff",color:det?"#fff":cl,display:"flex",alignItems:"center",justifyContent:"center",fontSize:R.finger.f-2,fontWeight:700,letterSpacing:"-0.5px"}}>{lbl}</div>}
          <div style={{fontSize:R.font.xs-2,fontWeight:600,color:det?"#fff":cl?"#fff":"#64748b"}}>{fr(k.note)}</div>
        </div>);})}
    </div>);
  // Le piano retourne juste son inner. Le wrapper (flex-shrink:0 en paysage,
  // inline en portrait) est géré par le parent PianoTutor.
  return inner;
});

/* ═══════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */
function Btn({children,onClick,disabled,style:s={}}){const R=useResponsive();
  return <button onClick={onClick} disabled={disabled} style={{minWidth:R.btn.min,minHeight:R.btn.min,borderRadius:R.rad-2,border:"1px solid #334155",background:"transparent",color:"#94a3b8",cursor:disabled?"default":"pointer",fontSize:R.font.sm,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",fontWeight:600,padding:"4px 8px",...s}}>{children}</button>}

/* ───────────────────────────────────────────────────────────────────
   LessonControls : panneau unifié de contrôles (tempo + écouter/pratiquer)
   Utilisé dans la colonne droite (paysage) ou en bas du contenu (portrait).
   ─────────────────────────────────────────────────────────────────── */
function LessonControls({R,color,bpm,setBpm,minBpm=40,maxBpm=120,onListen,onPractice,onStop,isPracticing,beat,extra}){
  return(
    <div style={{padding:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)",display:"flex",flexDirection:"column",gap:R.gap+2}}>
      {bpm!==undefined&&(
        <div>
          <div style={{fontSize:R.font.xs,color:"#64748b",letterSpacing:1.5,textTransform:"uppercase",marginBottom:R.gap-2,fontWeight:600}}>Tempo</div>
          <div style={{display:"flex",alignItems:"center",gap:R.gap+2,justifyContent:"center"}}>
            <Btn onClick={()=>setBpm(Math.max(minBpm,bpm-5))} style={{minHeight:R.btn.min,minWidth:R.btn.min,padding:"4px 10px",fontSize:R.font.lg,fontWeight:700}}>−</Btn>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:60}}>
              <span style={{fontSize:R.font.xl,fontWeight:700,color:"#e2e8f0",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{bpm}</span>
              <span style={{fontSize:R.font.xs-1,color:"#64748b",letterSpacing:1}}>BPM</span>
            </div>
            <Btn onClick={()=>setBpm(Math.min(maxBpm,bpm+5))} style={{minHeight:R.btn.min,minWidth:R.btn.min,padding:"4px 10px",fontSize:R.font.lg,fontWeight:700}}>+</Btn>
          </div>
        </div>
      )}
      {(onListen||onPractice||onStop)&&(
        <div style={{display:"flex",flexDirection:"column",gap:R.gap}}>
          {onListen&&!isPracticing&&(
            <button onClick={onListen} style={{padding:`${R.ipad?12:9}px ${R.pad}px`,borderRadius:R.rad-2,border:`1.5px solid ${color}`,background:`${color}22`,color,fontFamily:"inherit",fontSize:R.font.sm+1,fontWeight:700,cursor:"pointer",minHeight:R.btn.min,letterSpacing:.5}}>▶ Écouter</button>
          )}
          {onPractice&&!isPracticing&&(
            <button onClick={onPractice} style={{padding:`${R.ipad?12:9}px ${R.pad}px`,borderRadius:R.rad-2,border:"1.5px solid #10b981",background:"#10b98122",color:"#10b981",fontFamily:"inherit",fontSize:R.font.sm+1,fontWeight:700,cursor:"pointer",minHeight:R.btn.min,letterSpacing:.5}}>↻ Pratiquer</button>
          )}
          {isPracticing&&onStop&&(
            <button onClick={onStop} style={{padding:`${R.ipad?12:9}px ${R.pad}px`,borderRadius:R.rad-2,border:"1.5px solid #ef4444",background:"#ef444422",color:"#ef4444",fontFamily:"inherit",fontSize:R.font.sm+1,fontWeight:700,cursor:"pointer",minHeight:R.btn.min,letterSpacing:.5}}>■ Arrêter</button>
          )}
        </div>
      )}
      {isPracticing&&beat!==undefined&&(
        <div style={{display:"flex",gap:R.gap,justifyContent:"center",paddingTop:2}}>
          {[0,1,2,3].map(b=><div key={b} style={{width:11,height:11,borderRadius:"50%",background:b===beat?color:"rgba(255,255,255,.12)",boxShadow:b===beat?`0 0 8px ${color}66`:"none",transition:"all .1s"}}/>)}
        </div>
      )}
      {extra}
    </div>
  );
}

// SeqVizCompact : juste l'affichage de la séquence, sans boutons (utilisé quand
// les boutons sont dans LessonControls dans la colonne droite).
function SeqVizCompact({notes,idx,color,R}){
  return(<div style={{padding:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginTop:R.pad}}>
    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
      {notes.map((n,i)=>(<div key={i} style={{padding:`${R.ipad?5:3}px ${R.ipad?8:5}px`,borderRadius:R.rad-4,minWidth:R.ipad?36:24,textAlign:"center",
        background:i===idx?`${color}33`:n.note==="_"?"transparent":"rgba(255,255,255,.04)",
        border:i===idx?`1px solid ${color}`:"1px solid transparent",transition:"all .1s"}}>
        <div style={{fontSize:R.font.sm,fontWeight:700,color:n.note==="_"?"#334155":color}}>{n.note==="_"?"·":fr(n.note)}</div>
        {n.ly&&<div style={{fontSize:R.font.xs,color:"#94a3b8"}}>{n.ly}</div>}</div>))}
    </div>
  </div>);
}

/* ───────────────────────────────────────────────────────────────────
   SeqStrip : "partition" placée en HAUT du contenu de leçon.
   Affiche la séquence des éléments à jouer, position courante
   surlignée. Items : { label, sub?, color?, dim? }.
   - label : grand texte (ex "Em" ou "Mi")
   - sub : petit texte (ex "Mi mineur" ou "doigt 5")
   - color : couleur de l'accent quand actif (sinon défaut)
   - dim : grise l'item si true (ex pas encore atteint)
   ─────────────────────────────────────────────────────────────────── */
function SeqStrip({items,activeIdx,R,defaultColor="#818cf8",onItemClick}){
  const isClickable=typeof onItemClick==="function";
  return(
    <div style={{padding:`${R.gap+2}px ${R.gap+4}px`,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginBottom:R.gap+2}}>
      <div style={{display:"flex",gap:R.gap,overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none",WebkitOverflowScrolling:"touch"}}>
        {items.map((it,i)=>{const ac=i===activeIdx;const col=it.color||defaultColor;
          const baseStyle={
            flexShrink:0,padding:`${R.ipad?6:4}px ${R.ipad?12:8}px`,borderRadius:R.rad-4,
            background:it.done?"rgba(16,185,129,.08)":ac?`${col}26`:"rgba(255,255,255,.03)",
            border:ac?`1.5px solid ${col}`:it.done?"1px solid rgba(16,185,129,.3)":"1px solid rgba(255,255,255,.06)",
            opacity:it.dim?.4:1,
            transition:"background .15s, border-color .15s",
            minWidth:R.ipad?44:32,textAlign:"center",
            cursor:isClickable?"pointer":"default",
            fontFamily:"inherit"
          };
          const inner=<>
            <div style={{fontSize:R.font.sm,fontWeight:700,color:it.done?"#34d399":ac?col:"#cbd5e1",lineHeight:1.1,letterSpacing:.3}}>{it.done?"✓ ":""}{it.label}</div>
            {it.sub&&<div style={{fontSize:R.font.xs,color:"#64748b",marginTop:1}}>{it.sub}</div>}
          </>;
          return isClickable
            ? <button key={i} onClick={()=>onItemClick(i)} style={baseStyle}>{inner}</button>
            : <div key={i} style={baseStyle}>{inner}</div>;
        })}
      </div>
    </div>
  );
}

function InputWidget({pitch,midi,expected,R}){
  const[mode,setMode]=useState("off");
  const toggleMic=()=>{if(mode==="midi")midi.stop();if(mode==="mic"){pitch.stop();setMode("off")}else{pitch.start();setMode("mic")}};
  const toggleMidi=()=>{if(mode==="mic")pitch.stop();if(mode==="midi"){midi.stop();setMode("off")}else{midi.start();setMode("midi")}};
  const det=mode==="mic"?pitch.detected:null;
  const midiAct=mode==="midi"?Array.from(midi.activeNotes):[];
  const lastM=midiAct.length>0?midiAct[midiAct.length-1]:null;
  const dispNote=mode==="mic"?det?.frName:(lastM?fr(lastM):null);
  const dispRaw=mode==="mic"?det?.note:lastM;
  const match=dispRaw&&expected&&dispRaw===expected;
  const close=dispRaw&&expected&&!match&&dispRaw.replace(/\d/,"")===expected.replace(/\d/,"");

  // ─── Variante compacte (paysage) : intégrée dans le header ───
  if(R.landscape){
    if(mode==="off"){
      return(
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <button onClick={toggleMic} title="Activer le micro" style={{padding:"6px 12px",borderRadius:R.rad-2,fontFamily:"inherit",fontSize:R.font.xs+1,fontWeight:600,cursor:"pointer",minHeight:32,
            border:"1px dashed #475569",background:"rgba(255,255,255,.03)",color:"#cbd5e1",display:"flex",alignItems:"center",gap:5}}>🎤 Micro</button>
          {midi.supported&&<button onClick={toggleMidi} title="Activer le MIDI" style={{padding:"6px 12px",borderRadius:R.rad-2,fontFamily:"inherit",fontSize:R.font.xs+1,fontWeight:600,cursor:"pointer",minHeight:32,
            border:"1px dashed #475569",background:"rgba(255,255,255,.03)",color:"#cbd5e1",display:"flex",alignItems:"center",gap:5}}>🎹 MIDI</button>}
        </div>);
    }
    // Mode actif : 1 ligne compacte avec note détectée + attendue + état
    return(
      <div style={{display:"flex",alignItems:"center",gap:R.gap+2,padding:"5px 10px",borderRadius:R.rad-2,
        background:match?"rgba(34,197,94,.12)":dispNote?"rgba(251,191,36,.08)":"rgba(255,255,255,.04)",
        border:match?"1px solid rgba(34,197,94,.4)":dispNote?"1px solid rgba(251,191,36,.25)":"1px solid rgba(255,255,255,.1)",minHeight:32}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px rgba(34,197,94,.6)",animation:"pulse 1.5s infinite",flexShrink:0}}/>
        <span style={{fontSize:R.font.xs,color:"#94a3b8",fontWeight:600}}>{mode==="mic"?"🎤":"🎹"}</span>
        {expected&&(
          <div style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{fontSize:R.font.xs,color:"#64748b"}}>attendu</span>
            <span style={{fontSize:R.font.sm+1,fontWeight:700,color:"#818cf8"}}>{fr(expected)}</span>
          </div>
        )}
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:R.font.xs,color:"#64748b"}}>joué</span>
          <span style={{fontSize:R.font.sm+1,fontWeight:700,color:dispNote?(match?"#22c55e":close?"#fbbf24":"#f87171"):"#475569",minWidth:24,textAlign:"center"}}>{dispNote||"–"}</span>
          {dispNote&&expected&&<span style={{fontSize:R.font.sm}}>{match?"✓":close?"≈":"✗"}</span>}
        </div>
        <button onClick={()=>{if(mode==="mic")pitch.stop();if(mode==="midi")midi.stop();setMode("off")}} style={{marginLeft:4,padding:"3px 8px",borderRadius:R.rad-4,fontFamily:"inherit",fontSize:R.font.xs,fontWeight:600,cursor:"pointer",
          border:"1px solid #334155",background:"transparent",color:"#94a3b8",minHeight:26}}>×</button>
      </div>);
  }

  // ─── Variante portrait (panneau complet, comme avant) ───
  if(mode==="off") return(
    <div style={{display:"flex",gap:R.gap,marginBottom:R.pad}}>
      <button onClick={toggleMic} style={{flex:1,padding:R.pad,borderRadius:R.rad,cursor:"pointer",fontFamily:"inherit",
        border:"1px dashed #334155",background:"rgba(255,255,255,.02)",color:"#94a3b8",fontSize:R.font.sm,fontWeight:600,
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,minHeight:R.btn.min}}>
        🎤 Micro</button>
      {midi.supported&&<button onClick={toggleMidi} style={{flex:1,padding:R.pad,borderRadius:R.rad,cursor:"pointer",fontFamily:"inherit",
        border:"1px dashed #334155",background:"rgba(255,255,255,.02)",color:"#94a3b8",fontSize:R.font.sm,fontWeight:600,
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,minHeight:R.btn.min}}>
        🎹 MIDI</button>}
    </div>);
  return(
    <div style={{padding:R.pad,borderRadius:R.rad,marginBottom:R.pad,transition:"all .2s",
      background:match?"rgba(34,197,94,.1)":dispNote?"rgba(251,191,36,.06)":"rgba(255,255,255,.03)",
      border:match?"1px solid rgba(34,197,94,.3)":dispNote?"1px solid rgba(251,191,36,.2)":"1px solid rgba(255,255,255,.08)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:R.gap+2}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px rgba(34,197,94,.6)",animation:"pulse 1.5s infinite"}}/>
          <span style={{fontSize:R.font.xs,color:"#94a3b8"}}>{mode==="mic"?"Micro actif":midi.connected?`MIDI : ${midi.deviceName}`:"MIDI : en attente..."}</span></div>
        <div style={{display:"flex",gap:4}}>
          {mode==="mic"&&midi.supported&&<Btn onClick={()=>{pitch.stop();midi.start();setMode("midi")}} style={{fontSize:R.font.xs,padding:"3px 10px"}}>→ MIDI</Btn>}
          {mode==="midi"&&<Btn onClick={()=>{midi.stop();pitch.start();setMode("mic")}} style={{fontSize:R.font.xs,padding:"3px 10px"}}>→ Micro</Btn>}
          <Btn onClick={()=>{if(mode==="mic")pitch.stop();if(mode==="midi")midi.stop();setMode("off")}} style={{fontSize:R.font.xs,padding:"3px 10px"}}>Couper</Btn></div></div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:R.ipad?24:16}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:R.font.xs,color:"#64748b"}}>Détecté</div>
          <div style={{fontSize:R.font.xxl,fontWeight:700,color:dispNote?(match?"#22c55e":close?"#fbbf24":"#f87171"):"#334155",transition:"all .15s"}}>{dispNote||"..."}</div>
          {mode==="mic"&&det&&<div style={{fontSize:R.font.xs,color:"#475569"}}>{det.freq} Hz {det.cents>0?"+":""}{det.cents}¢</div>}
        </div>
        {expected&&<div style={{textAlign:"center"}}>
          <div style={{fontSize:R.font.xs,color:"#64748b"}}>Attendu</div>
          <div style={{fontSize:R.font.xxl,fontWeight:700,color:"#818cf8"}}>{fr(expected)}</div></div>}
        {dispNote&&expected&&<div style={{fontSize:R.font.xl}}>{match?"✅":close?"🟡":"❌"}</div>}
      </div>
      {mode==="midi"&&!midi.connected&&!midi.error&&<div style={{fontSize:R.font.xs,color:"#fbbf24",textAlign:"center",marginTop:6}}>Branche ton piano USB</div>}
      {midi.error&&<div style={{fontSize:R.font.xs,color:"#ef4444",textAlign:"center",marginTop:6}}>{midi.error}</div>}
      {pitch.micError&&<div style={{fontSize:R.font.xs,color:"#ef4444",textAlign:"center",marginTop:6}}>{pitch.micError}</div>}
    </div>);
}

/* ───────────────────────────────────────────────────────────────────
   useSlots : helper pour pousser top (header right), side (sidebar)
   et piano (bas du layout) depuis une leçon. Le cleanup utilise un
   updater fonctionnel pour ne nettoyer QUE si le slot contient encore
   notre JSX (sinon une leçon qui se démonte effacerait les slots de
   la suivante).
   ─────────────────────────────────────────────────────────────────── */
function useSlots(top,side,piano){
  const{setTop,setSide,setPiano}=useContext(SlotsCtx);
  useEffect(()=>{setTop(top);return()=>setTop(p=>p===top?null:p)},[top,setTop]);
  useEffect(()=>{setSide(side);return()=>setSide(p=>p===side?null:p)},[side,setSide]);
  useEffect(()=>{setPiano(piano);return()=>setPiano(p=>p===piano?null:p)},[piano,setPiano]);
}

/* ═══════════════════════════════════════════════════════════════════
   LESSONS — using refs for interval state (fixes closure bugs)
   ═══════════════════════════════════════════════════════════════════ */
function ChordBtns({chords,ci,setCi,unlock,R}){
  return(<div style={{display:"flex",gap:R.gap,justifyContent:"center",marginBottom:R.pad,flexWrap:"wrap"}}>
    {chords.map((c,i)=><button key={c.name} onClick={()=>{setCi(i);unlock()}} style={{
      padding:`${R.ipad?10:7}px ${R.ipad?18:14}px`,borderRadius:R.rad,border:`2px solid ${i===ci?c.color:"transparent"}`,
      background:i===ci?`${c.color}22`:"rgba(255,255,255,.04)",color:i===ci?c.color:"#94a3b8",
      fontSize:R.font.md+2,fontWeight:700,cursor:"pointer",fontFamily:"inherit",minWidth:R.ipad?72:58,minHeight:R.btn.min,
    }}><div>{c.name}</div><div style={{fontSize:R.font.xs,fontWeight:400,opacity:.7}}>{c.full}</div></button>)}
  </div>);
}

function ProgBar({chords,ci,R}){
  return(<div style={{display:"flex",justifyContent:"center",gap:R.ipad?6:4,marginTop:R.pad}}>
    {chords.map((c,i)=><div key={c.name} style={{display:"flex",alignItems:"center",gap:R.ipad?6:4}}>
      <div style={{padding:`${R.ipad?7:5}px ${R.ipad?14:10}px`,borderRadius:R.rad-4,fontSize:R.font.md,fontWeight:700,
        background:i===ci?`${c.color}22`:"transparent",border:i===ci?`1px solid ${c.color}44`:"1px solid transparent",
        color:i===ci?c.color:"#475569",transition:"all .3s"}}>{c.name}</div>
      {i<chords.length-1&&<span style={{color:"#334155",fontSize:R.font.sm}}>→</span>}</div>)}
    <span style={{color:"#334155",fontSize:R.font.sm,marginLeft:2}}>↺</span>
  </div>);
}

/* ───────────────────────────────────────────────────────────────────
   HandsStrip : encart unifié "Main G / Main D" utilisé dans toutes
   les leçons. Chaque section (left ou right) peut être :
   - compacte : { label, name, sub } → ex: "MAIN G / Em / Mi · Sol · Si"
   - en notes : { label, notes, fingers? activeIdx? } → cellules avec
     doigtés (apprentissage) ou position courante (défilement).
   - labelColor optionnel pour distinguer la couleur du titre de
     celle des notes (ex: "MAIN D" en violet pastel mais notes en rose).
   ─────────────────────────────────────────────────────────────────── */
function HandSection({section,R}){
  if(!section)return null;
  const labelColor=section.labelColor||section.color||"#a78bfa";
  const mainColor=section.color||"#a78bfa";
  const titleStyle={fontSize:R.font.xs,color:labelColor,letterSpacing:1,textTransform:"uppercase",fontWeight:600,marginBottom:2,textAlign:"center"};
  // Mode notes : cellules par note, avec doigté ou position en sub
  if(section.notes&&section.notes.length>0){
    const hasActive=section.activeIdx!==undefined&&section.activeIdx>=0;
    return(
      <div>
        <div style={titleStyle}>{section.label}</div>
        <div style={{display:"flex",justifyContent:"center",gap:R.ipad?14:8}}>
          {section.notes.map((n,i)=>{
            const isActive=hasActive&&i===section.activeIdx;
            return(
              <div key={i} style={{
                textAlign:"center",
                opacity:hasActive&&!isActive?.5:1,
                transform:hasActive&&isActive?"scale(1.15)":"none",
                transition:"all .15s"
              }}>
                <div style={{fontSize:R.font.lg,fontWeight:700,color:mainColor,lineHeight:1}}>{fr(n)}</div>
                <div style={{fontSize:R.font.xs,color:"#64748b",marginTop:2}}>
                  {section.fingers?`doigt ${section.fingers[n]||"?"}`:`t${i+1}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  // Mode compact : nom + sub
  return(
    <div style={{textAlign:"center",flexShrink:0}}>
      <div style={titleStyle}>{section.label}</div>
      <div style={{fontSize:R.font.lg,fontWeight:700,color:mainColor,lineHeight:1}}>{section.name}</div>
      {section.sub&&<div style={{fontSize:R.font.xs,color:"#64748b",marginTop:2}}>{section.sub}</div>}
    </div>
  );
}

function HandsStrip({left,right,R}){
  if(!left&&!right)return null;
  return(
    <div style={{marginTop:R.gap+2,marginBottom:R.gap+2,padding:`${R.gap+2}px ${R.pad}px`,borderRadius:R.rad-4,background:"rgba(232,121,249,.06)",border:"1px solid rgba(232,121,249,.2)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:R.ipad?28:14}}>
        <HandSection section={left} R={R}/>
        {left&&right&&(<div style={{width:1,height:R.ipad?52:36,background:"rgba(255,255,255,.1)",flexShrink:0}}/>)}
        <HandSection section={right} R={R}/>
      </div>
    </div>
  );
}

// L1 — Block chords
function L1({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[ci,setCi]=useState(0);
  const[pr,setPr]=useState(new Set());
  const[looping,setLoop]=useState(false);
  const[bpm,setBpm]=useState(60);
  const[bt,setBt]=useState(0);
  const ciRef=useRef(ci);
  useEffect(()=>{ciRef.current=ci},[ci]);
  const ch=song.chords[ci];

  // Avancement automatique pendant le mode "Pratiquer" (boucle infinie)
  useInterval(()=>setBt(b=>{
    if(b+1>=BEATS_PER_BAR){
      setCi(c=>{const n=(c+1)%song.chords.length;ciRef.current=n;return n});
      return 0;
    }
    return b+1;
  }),beatMs(bpm),looping);
  useEffect(()=>{
    if(!looping||bt!==0)return;
    const c=song.chords[ciRef.current];
    a.chord(c.keys);
    setPr(new Set(c.keys));
    const id=setTimeout(()=>setPr(new Set()),PRESS_FLASH_LONG_MS);
    return()=>clearTimeout(id);
  },[bt,looping,a,song.chords]);

  // Handlers stables : useCallback évite la recréation à chaque render et
  // permet aux useMemo en aval d'avoir des deps fiables.
  const onListen=useCallback(()=>{
    a.unlock();a.chord(ch.keys);
    setPr(new Set(ch.keys));
    setTimeout(()=>setPr(new Set()),PRESS_FLASH_LONG_MS);
  },[a,ch.keys]);
  const onPractice=useCallback(()=>{
    a.unlock();setLoop(true);setCi(0);ciRef.current=0;setBt(0);
  },[a]);
  const onStop=useCallback(()=>setLoop(false),[]);
  const onPianoClick=useCallback(n=>{
    a.unlock();a.note(n);
    setPr(new Set([n]));
    setTimeout(()=>setPr(new Set()),PRESS_FLASH_MS);
  },[a]);

  const top=useMemo(()=><InputWidget pitch={pitch} midi={midi} expected={ch.keys[0]} R={R}/>,[pitch,midi,ch.keys,R]);
  const side=useMemo(()=><LessonControls R={R} color={ch.color} bpm={bpm} setBpm={setBpm} onListen={onListen} onPractice={onPractice} onStop={onStop} isPracticing={looping} beat={bt}/>,[R,ch.color,bpm,looping,bt,onListen,onPractice,onStop]);
  const pianoJsx=useMemo(()=><Piano keys={song.keys} hl={new Set(ch.keys)} fm={ch.fingers} hands={handsOf(ch.keys,"L")} c1={ch.color} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={onPianoClick}/>,[song.keys,ch.keys,ch.fingers,ch.color,pr,detNote,midiNotes,R,onPianoClick]);
  useSlots(top,side,R.landscape?pianoJsx:null);

  return(<div>
    <ChordBtns chords={song.chords} ci={ci} setCi={setCi} unlock={a.unlock} R={R}/>
    {!R.landscape&&pianoJsx}
    <HandsStrip left={{label:`Main G : ${ch.name}`,notes:ch.keys,fingers:ch.fingers,color:ch.color}} R={R}/>
  </div>);
}

// L2 — Arpeggios
function L2({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[ci,setCi]=useState(0);
  const[pr,setPr]=useState(new Set());
  const[idx,setIdx]=useState(-1);
  const[looping,setLoop]=useState(false);
  const[bpm,setBpm]=useState(60);
  const[bt,setBt]=useState(0);
  const[arpPlaying,setArpP]=useState(false);
  const arRef=useRef(null);
  const ciRef=useRef(ci);
  useEffect(()=>{ciRef.current=ci},[ci]);
  const ch=song.chords[ci];

  // Lecture en boucle de l'arpège de l'accord courant ("Écouter")
  const playArp=useCallback(()=>{
    a.unlock();
    let i=0;
    const stepMs=beatMs(bpm)/2; // double-croches : 8 notes = 1 mesure 4/4
    clearInterval(arRef.current);
    setArpP(true);
    const step=()=>{
      const nn=song.chords[ciRef.current].arp;
      if(i>=nn.length) i=0;
      a.note(nn[i],.28);
      setIdx(i);
      setPr(new Set([nn[i]]));
      i++;
    };
    step();
    arRef.current=setInterval(step,stepMs);
  },[a,bpm,song.chords]);
  const stopArp=useCallback(()=>{
    clearInterval(arRef.current);
    setIdx(-1);setPr(new Set());setArpP(false);
  },[]);

  // Mode "Pratiquer" : enchaîne tous les accords en arpèges (boucle infinie)
  useEffect(()=>{
    if(!looping){setBt(0);setIdx(-1);setPr(new Set());return}
    let ni=0,chi=0;
    const stepMs=beatMs(bpm)/2;
    // Joue la première note immédiatement, puis cadence avec setInterval
    const step=()=>{
      const c=song.chords[chi];
      if(ni>=c.arp.length){
        ni=0;
        chi=(chi+1)%song.chords.length;
        setCi(chi);ciRef.current=chi;
      }
      a.note(song.chords[chi].arp[ni],.25);
      setPr(new Set([song.chords[chi].arp[ni]]));
      setIdx(ni);
      setBt(Math.floor(ni/2));
      ni++;
    };
    step();
    const id=setInterval(step,stepMs);
    return()=>clearInterval(id);
  },[looping,bpm,a,song.chords]);
  useEffect(()=>()=>clearInterval(arRef.current),[]);

  const onListen=useCallback(()=>{stopArp();playArp()},[stopArp,playArp]);
  const onPractice=useCallback(()=>{
    a.unlock();stopArp();setCi(0);ciRef.current=0;setBt(0);setLoop(true);
  },[a,stopArp]);
  const onStop=useCallback(()=>{stopArp();setLoop(false)},[stopArp]);
  const onPianoClick=useCallback(n=>{
    a.unlock();a.note(n);
    setPr(new Set([n]));
    setTimeout(()=>setPr(new Set()),PRESS_FLASH_MS);
  },[a]);
  const onChordChange=useCallback(i=>{setCi(i);ciRef.current=i;stopArp()},[stopArp]);

  const top=useMemo(()=><InputWidget pitch={pitch} midi={midi} expected={ch.arp[idx>=0?idx:0]} R={R}/>,[pitch,midi,ch.arp,idx,R]);
  const side=useMemo(()=><LessonControls R={R} color={ch.color} bpm={bpm} setBpm={setBpm} onListen={onListen} onPractice={onPractice} onStop={onStop} isPracticing={looping||arpPlaying} beat={looping?bt:undefined}/>,[R,ch.color,bpm,looping,arpPlaying,bt,onListen,onPractice,onStop]);
  const pianoJsx=useMemo(()=><Piano keys={song.keys} hl={new Set(ch.keys)} fm={ch.fingers} hands={handsOf(ch.keys,"L")} c1={ch.color} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={onPianoClick}/>,[song.keys,ch.keys,ch.fingers,ch.color,pr,detNote,midiNotes,R,onPianoClick]);
  useSlots(top,side,R.landscape?pianoJsx:null);

  return(<div>
    <ChordBtns chords={song.chords} ci={ci} setCi={onChordChange} unlock={a.unlock} R={R}/>
    <SeqVizCompact notes={ch.arp.map(n=>({note:n,dur:1}))} idx={idx} color={ch.color} R={R}/>
    {!R.landscape&&pianoJsx}
    <HandsStrip left={{label:"Main G",name:ch.name,sub:ch.keys.map(fr).join(" · "),color:ch.color}} R={R}/>
  </div>);
}

// L3 — Intro riff
const L3_DEFAULT_BPM = 65;
const L3_COLOR = "#f87171";
function L3({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[idx,setIdx]=useState(-1);
  const[pr,setPr]=useState(new Set());
  const[playing,setP]=useState(false);
  const[,setLoopMode]=useState(false);
  const r=useRef(null);
  const loopRef=useRef(false);
  const cur=song.riff[idx>=0?idx:0]?.note;

  const playOnce=useCallback(()=>{
    a.unlock();
    loopRef.current=false;setLoopMode(false);
    let i=0;
    const stepMs=beatMs(L3_DEFAULT_BPM)*0.5; // double-croches
    clearInterval(r.current);
    setP(true);
    const step=()=>{
      if(i>=song.riff.length){
        if(loopRef.current) i=0;
        else{
          clearInterval(r.current);
          setIdx(-1);setPr(new Set());setP(false);
          return;
        }
      }
      const n=song.riff[i];
      setIdx(i);
      if(n.note!=="_"){a.note(n.note,.35);setPr(new Set([n.note]))}
      else setPr(new Set());
      i++;
    };
    step();
    r.current=setInterval(step,stepMs);
  },[a,song.riff]);
  const playLoop=useCallback(()=>{
    a.unlock();
    loopRef.current=true;setLoopMode(true);
    playOnce();
    loopRef.current=true;
  },[playOnce]);
  const stop=useCallback(()=>{
    loopRef.current=false;
    clearInterval(r.current);
    setIdx(-1);setPr(new Set());setP(false);setLoopMode(false);
  },[]);
  useEffect(()=>()=>clearInterval(r.current),[]);

  const onPianoClick=useCallback(n=>{
    a.unlock();a.note(n);
    setPr(new Set([n]));
    setTimeout(()=>setPr(new Set()),PRESS_FLASH_MS);
  },[a]);

  const top=useMemo(()=><InputWidget pitch={pitch} midi={midi} expected={cur!=="_"?cur:null} R={R}/>,[pitch,midi,cur,R]);
  const side=useMemo(()=><LessonControls R={R} color={L3_COLOR} onListen={playOnce} onPractice={playLoop} onStop={stop} isPracticing={playing}/>,[R,playing,playOnce,playLoop,stop]);
  const pianoJsx=useMemo(()=><Piano keys={song.keys} hl={new Set(song.riffNotes)} fm={song.melFingers} hands={handsOf(song.riffNotes,"R")} c1={L3_COLOR} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={onPianoClick}/>,[song.keys,song.riffNotes,song.melFingers,pr,detNote,midiNotes,R,onPianoClick]);
  useSlots(top,side,R.landscape?pianoJsx:null);

  return(<div>
    <SeqVizCompact notes={song.riff} idx={idx} color={L3_COLOR} R={R}/>
    {!R.landscape&&pianoJsx}
    <HandsStrip right={{label:"Main D : riff",notes:song.riffNotes,fingers:song.melFingers,color:L3_COLOR,labelColor:"#a78bfa"}} R={R}/>
  </div>);
}

// L4 — Melody
const L4_DEFAULT_BPM = 70;
function L4({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const secs=Object.keys(song.melody);
  const[sec,setSec]=useState(secs[0]);
  const[idx,setIdx]=useState(-1);
  const[pr,setPr]=useState(new Set());
  const[playing,setP]=useState(false);
  const r=useRef(null);
  const loopRef=useRef(false);
  const m=song.melody[sec];
  const cur=m.notes[idx>=0?idx:0]?.note;

  const playOnce=useCallback(()=>{
    a.unlock();
    loopRef.current=false;
    let i=0;
    const stepMs=beatMs(L4_DEFAULT_BPM)*0.5;
    clearInterval(r.current);
    setP(true);
    const step=()=>{
      if(i>=m.notes.length){
        if(loopRef.current) i=0;
        else{
          clearInterval(r.current);
          setIdx(-1);setPr(new Set());setP(false);
          return;
        }
      }
      const n=m.notes[i];
      setIdx(i);
      if(n.note!=="_"){a.note(n.note,.35);setPr(new Set([n.note]))}
      else setPr(new Set());
      i++;
    };
    step();
    r.current=setInterval(step,stepMs);
  },[a,m.notes]);
  const playLoop=useCallback(()=>{
    loopRef.current=true;playOnce();loopRef.current=true;
  },[playOnce]);
  const stop=useCallback(()=>{
    loopRef.current=false;
    clearInterval(r.current);
    setIdx(-1);setPr(new Set());setP(false);
  },[]);
  useEffect(()=>()=>clearInterval(r.current),[]);

  const onPianoClick=useCallback(n=>{
    a.unlock();a.note(n);
    setPr(new Set([n]));
    setTimeout(()=>setPr(new Set()),PRESS_FLASH_MS);
  },[a]);
  const onSecChange=useCallback(k=>{setSec(k);setIdx(-1);stop()},[stop]);

  const top=useMemo(()=><InputWidget pitch={pitch} midi={midi} expected={cur!=="_"?cur:null} R={R}/>,[pitch,midi,cur,R]);
  const side=useMemo(()=><LessonControls R={R} color={RIGHT_HAND_COLOR} onListen={playOnce} onPractice={playLoop} onStop={stop} isPracticing={playing}/>,[R,playing,playOnce,playLoop,stop]);
  const pianoJsx=useMemo(()=><Piano keys={song.keys} hl={new Set(song.melodyNotes)} fm={song.melFingers} hands={handsOf(song.melodyNotes,"R")} c1={RIGHT_HAND_COLOR} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={onPianoClick}/>,[song.keys,song.melodyNotes,song.melFingers,pr,detNote,midiNotes,R,onPianoClick]);
  useSlots(top,side,R.landscape?pianoJsx:null);

  return(<div>
    <div style={{display:"flex",gap:R.gap+2,justifyContent:"center",marginBottom:R.pad}}>
      {secs.map(k=><button key={k} onClick={()=>onSecChange(k)} style={{padding:`${R.ipad?10:7}px ${R.ipad?20:16}px`,borderRadius:R.rad,fontSize:R.font.sm+1,fontFamily:"inherit",fontWeight:600,minHeight:R.btn.min,border:sec===k?`1px solid ${RIGHT_HAND_COLOR}`:"1px solid #334155",background:sec===k?`${RIGHT_HAND_COLOR}22`:"transparent",color:sec===k?RIGHT_HAND_COLOR:"#94a3b8",cursor:"pointer"}}>{song.melody[k].label}</button>)}</div>
    <SeqVizCompact notes={m.notes} idx={idx} color={RIGHT_HAND_COLOR} R={R}/>
    {!R.landscape&&pianoJsx}
    <HandsStrip right={{label:"Main D : mélodie",notes:song.melodyNotes,fingers:song.melFingers,color:RIGHT_HAND_COLOR,labelColor:"#a78bfa"}} R={R}/>
  </div>);
}

// L5 — Both hands
const L5_STEP_MS = 600;
function L5({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[ci,setCi]=useState(0);
  const[step,setStep]=useState(0);
  const[pr,setPr]=useState(new Set());
  const[playingAll,setPlayingAll]=useState(false);
  const seqRef=useRef(null);
  const ch=song.chords[ci];
  const melN=song.melPerChord[ci];

  // Étapes : 1 plaqué d'accord (main G) + 4 notes de mélodie (main D)
  const steps=useMemo(()=>[
    {t:"chord",l:`Plaque ${ch.name}`,k:ch.keys,hand:"L"},
    ...melN.map((n,i)=>({t:"note",l:`Note ${i+1} : ${fr(n)}`,k:[n],hand:"R"}))
  ],[ch.name,ch.keys,melN]);
  const cur=steps[Math.min(step,steps.length-1)];
  const mf=useMemo(()=>({...ch.fingers,...song.melFingers}),[ch.fingers,song.melFingers]);
  const handsCombined=useMemo(()=>mergeHands(handsOf(ch.keys,"L"),handsOf(melN,"R")),[ch.keys,melN]);
  const handLabel=cur.hand==="L"?"Main gauche":"Main droite";
  const handColor=cur.hand==="L"?ch.color:RIGHT_HAND_COLOR;

  // "Écouter cette étape" : joue uniquement l'étape courante
  const playStep=useCallback(()=>{
    a.unlock();
    if(cur.t==="chord") a.chord(cur.k);
    else cur.k.forEach(n=>a.note(n));
    setPr(new Set(cur.k));
    setTimeout(()=>setPr(new Set()),400);
  },[a,cur.t,cur.k]);
  // "Tout écouter" : enchaîne accord + 4 notes mélodie en séquence
  const playAll=useCallback(()=>{
    a.unlock();
    clearInterval(seqRef.current);
    setPlayingAll(true);
    let i=0;
    setStep(0);
    a.chord(steps[0].k);
    setPr(new Set(steps[0].k));
    setTimeout(()=>setPr(new Set()),350);
    seqRef.current=setInterval(()=>{
      i++;
      if(i>=steps.length){
        clearInterval(seqRef.current);
        setPlayingAll(false);
        setPr(new Set());
        return;
      }
      setStep(i);
      const s=steps[i];
      if(s.t==="chord") a.chord(s.k);
      else s.k.forEach(n=>a.note(n));
      setPr(new Set(s.k));
      setTimeout(()=>setPr(new Set()),350);
    },L5_STEP_MS);
  },[a,steps]);
  const stopAll=useCallback(()=>{
    clearInterval(seqRef.current);
    setPlayingAll(false);
    setPr(new Set());
  },[]);
  useEffect(()=>()=>clearInterval(seqRef.current),[]);

  const onPianoClick=useCallback(n=>{
    a.unlock();a.note(n);
    setPr(new Set([n]));
    setTimeout(()=>setPr(new Set()),PRESS_FLASH_MS);
  },[a]);
  const onChordChange=useCallback(i=>{setCi(i);setStep(0);stopAll()},[stopAll]);

  const top=useMemo(()=><InputWidget pitch={pitch} midi={midi} expected={cur.k[0]} R={R}/>,[pitch,midi,cur.k,R]);
  const side=useMemo(()=><LessonControls R={R} color={handColor} onListen={playStep} onPractice={playAll} onStop={stopAll} isPracticing={playingAll}
    extra={
      <div style={{padding:`${R.gap+2}px ${R.gap+4}px`,borderRadius:R.rad-4,background:"rgba(255,255,255,.03)",fontSize:R.font.xs+1,color:"#94a3b8",lineHeight:1.6,textAlign:"center"}}>
        <span style={{display:"inline-block",width:12,height:12,borderRadius:3,background:ch.color,verticalAlign:"middle",marginRight:5}}/><b style={{color:ch.color}}>G</b> main gauche
        <span style={{margin:"0 10px",color:"#475569"}}>•</span>
        <span style={{display:"inline-block",width:12,height:12,borderRadius:3,background:RIGHT_HAND_COLOR,verticalAlign:"middle",marginRight:5}}/><b style={{color:RIGHT_HAND_COLOR}}>D</b> main droite
      </div>
    }
  />,[R,handColor,playingAll,ch.color,playStep,playAll,stopAll]);
  const pianoJsx=useMemo(()=><Piano keys={song.keys} hl={new Set(ch.keys)} hl2={new Set(melN)} fm={mf} hands={handsCombined} c1={ch.color} c2={RIGHT_HAND_COLOR} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={onPianoClick}/>,[song.keys,ch.keys,melN,mf,handsCombined,ch.color,pr,detNote,midiNotes,R,onPianoClick]);
  useSlots(top,side,R.landscape?pianoJsx:null);

  return(<div>
    <ChordBtns chords={song.chords} ci={ci} setCi={onChordChange} unlock={a.unlock} R={R}/>
    <div style={{textAlign:"center",marginBottom:R.pad,padding:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)"}}>
      {/* Indicateur GRAND de la main active à cette étape */}
      <div style={{display:"inline-flex",alignItems:"center",gap:R.gap+2,padding:`${R.ipad?6:4}px ${R.pad}px`,borderRadius:R.rad,
        background:`${handColor}1a`,border:`1px solid ${handColor}55`,marginBottom:R.gap+2}}>
        <div style={{width:R.ipad?28:22,height:R.ipad?28:22,borderRadius:6,background:handColor,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:R.ipad?16:13,fontWeight:800,letterSpacing:"-1px"}}>{cur.hand==="L"?"G":"D"}</div>
        <div style={{fontSize:R.font.md,fontWeight:700,color:handColor,letterSpacing:1,textTransform:"uppercase"}}>{handLabel}</div>
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:R.gap}}>
        {steps.map((s,i)=><div key={i} style={{width:R.ipad?12:8,height:R.ipad?12:8,borderRadius:"50%",
          background:i===step?(s.hand==="L"?ch.color:RIGHT_HAND_COLOR):i<step?"#10b981":"rgba(255,255,255,.1)"}}/>)}</div>
      <div style={{fontSize:R.font.md,fontWeight:700,color:"#e2e8f0"}}>{cur.l}</div>
      <div style={{display:"flex",gap:R.gap,justifyContent:"center",marginTop:R.gap+2}}>
        <Btn onClick={()=>setStep(Math.max(0,step-1))} style={{opacity:step===0?.3:1}}>← Précédent</Btn>
        <Btn onClick={()=>setStep(Math.min(steps.length-1,step+1))} style={{opacity:step>=steps.length-1?.3:1}}>Suivant →</Btn>
      </div>
    </div>
    {!R.landscape&&pianoJsx}
    <HandsStrip 
      left={{label:"Main G",name:ch.name,sub:ch.keys.map(fr).join(" · "),color:ch.color}}
      right={{label:"Main D",notes:melN,activeIdx:step>=1?step-1:-1,color:RIGHT_HAND_COLOR,labelColor:"#a78bfa"}}
      R={R}/>
  </div>);
}

// L6 — Tempo
function L6({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[bpm,setBpm]=useState(70);
  const[run,setRun]=useState(false);
  const[ci,setCi]=useState(0);
  const[bt,setBt]=useState(0);
  const[pr,setPr]=useState(new Set());
  const[listenOnce,setListenOnce]=useState(false);
  const ciRef=useRef(0);
  useEffect(()=>{ciRef.current=ci},[ci]);
  const ch=song.chords[ci];
  const melN=song.melPerChord[ci];
  // Doigtés et hand-map combinés (main G + main D)
  const mfCombined=useMemo(()=>({...ch.fingers,...song.melFingers}),[ch.fingers,song.melFingers]);
  const handsCombined=useMemo(()=>mergeHands(handsOf(ch.keys,"L"),handsOf(melN,"R")),[ch.keys,melN]);

  // Tic-toc des temps : t=0 plaque l'accord (G) + 1re note de mélodie (D);
  // t=1,2,3 jouent les notes de mélodie restantes.
  useInterval(()=>setBt(b=>{
    if(b+1>=BEATS_PER_BAR){
      setCi(c=>{
        const n=(c+1)%song.chords.length;
        ciRef.current=n;
        // Si "Écouter" (1 cycle) : on s'arrête en revenant au début
        if(listenOnce&&n===0){setRun(false);setListenOnce(false)}
        return n;
      });
      return 0;
    }
    return b+1;
  }),beatMs(bpm),run);
  useEffect(()=>{
    if(!run) return;
    const cci=ciRef.current;
    const c=song.chords[cci];
    const mn=song.melPerChord[cci];
    if(bt===0){
      a.chord(c.keys);
      if(mn[0]) a.note(mn[0],.25);
      setPr(new Set([...c.keys,mn[0]].filter(Boolean)));
    } else if(mn[bt]){
      a.note(mn[bt],.25);
      setPr(new Set([mn[bt]]));
    }
    setTimeout(()=>setPr(new Set()),200);
  },[bt,run,a,song.chords,song.melPerChord]);
  const pct=bpm>=song.bpm?100:Math.round((bpm-BPM_MIN)/(song.bpm-BPM_MIN)*100);

  const onListen=useCallback(()=>{
    a.unlock();setCi(0);ciRef.current=0;setBt(0);setListenOnce(true);setRun(true);
  },[a]);
  const onPractice=useCallback(()=>{
    a.unlock();setCi(0);ciRef.current=0;setBt(0);setListenOnce(false);setRun(true);
  },[a]);
  const onStop=useCallback(()=>{setRun(false);setListenOnce(false)},[]);
  const onPianoClick=useCallback(n=>{
    a.unlock();a.note(n);
    setPr(new Set([n]));
    setTimeout(()=>setPr(new Set()),PRESS_FLASH_MS);
  },[a]);

  const top=useMemo(()=><InputWidget pitch={pitch} midi={midi} expected={ch.keys[0]} R={R}/>,[pitch,midi,ch.keys,R]);
  const side=useMemo(()=><LessonControls R={R} color={ch.color} bpm={bpm} setBpm={setBpm} onListen={onListen} onPractice={onPractice} onStop={onStop} isPracticing={run} beat={bt}
    extra={
      <div>
        <div style={{fontSize:R.font.xs,color:"#64748b",letterSpacing:1.5,textTransform:"uppercase",marginBottom:R.gap-2,fontWeight:600}}>Objectif {song.bpm} bpm</div>
        <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,.08)",overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,borderRadius:3,background:pct>=100?"linear-gradient(90deg,#10b981,#34d399)":"linear-gradient(90deg,#f59e0b,#fbbf24)",transition:"width .3s"}}/>
        </div>
        <div style={{fontSize:R.font.xs,color:pct>=100?"#34d399":"#fbbf24",marginTop:4,textAlign:"right",fontWeight:600}}>{pct}%</div>
      </div>
    }
  />,[R,ch.color,bpm,run,bt,pct,song.bpm,onListen,onPractice,onStop]);
  const pianoJsx=useMemo(()=><Piano keys={song.keys} hl={new Set(ch.keys)} hl2={new Set(melN)} fm={mfCombined} hands={handsCombined} c1={ch.color} c2={RIGHT_HAND_COLOR} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={onPianoClick}/>,[song.keys,ch.keys,melN,mfCombined,handsCombined,ch.color,pr,detNote,midiNotes,R,onPianoClick]);
  useSlots(top,side,R.landscape?pianoJsx:null);

  return(<div>
    {/* Partition : enchaînement des 4 accords avec position courante (niveau structure) */}
    <SeqStrip R={R} activeIdx={ci} items={song.chords.map(c=>({label:c.name,sub:c.full,color:c.color}))}/>
    {!R.landscape&&pianoJsx}
    {/* Aperçu deux mains : accord (main G) + 4 notes mélodie (main D) avec position */}
    <HandsStrip 
      left={{label:"Main G",name:ch.name,sub:ch.keys.map(fr).join(" · "),color:ch.color}}
      right={{label:"Main D",notes:melN,activeIdx:run?bt:-1,color:RIGHT_HAND_COLOR,labelColor:"#a78bfa"}}
      R={R}/>
  </div>);
}

// L7 — Full performance (fixed section advancement)
const L7_SECTION_COLOR = "#a855f7";
function L7({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[run,setRun]=useState(false);
  const[pr,setPr]=useState(new Set());
  // Refs pour TOUT l'état muté dans l'intervalle (évite les bugs de closure)
  const state=useRef({si:0,ci:0,rep:0,bt:0});
  const[display,setDisplay]=useState({si:0,ci:0,bt:0});
  // Jump token : incrémenté à chaque saut de section pour forcer la recréation
  // de l'intervalle (timing propre, pas de phase qui traîne)
  const[jump,setJump]=useState(0);
  const ch=song.chords[display.ci];
  const melN=song.melPerChord[display.ci];
  const mfCombined=useMemo(()=>({...ch.fingers,...song.melFingers}),[ch.fingers,song.melFingers]);
  const handsCombined=useMemo(()=>mergeHands(handsOf(ch.keys,"L"),handsOf(melN,"R")),[ch.keys,melN]);

  useEffect(()=>{
    if(!run) return;
    const ms=beatMs(song.bpm);
    // 1 beat = 1 noire. À chaque beat on joue la note de mélodie correspondante (main D)
    // et au beat 0 on plaque l'accord (main G). 4 beats par accord, on cycle ensuite ;
    // quand tous les accords sont parcourus on incrémente la répétition, et quand
    // toutes les répétitions de la section sont faites on passe à la section suivante.
    const id=setInterval(()=>{
      const s=state.current;
      s.bt++;
      if(s.bt>=BEATS_PER_BAR){
        s.bt=0;
        s.ci=(s.ci+1)%song.chords.length;
        if(s.ci===0){
          s.rep++;
          if(s.rep>=song.structure[s.si].reps){
            s.rep=0;s.si++;
            if(s.si>=song.structure.length){setRun(false);return}
          }
        }
      }
      const c=song.chords[s.ci];
      const mn=song.melPerChord[s.ci];
      if(s.bt===0){
        a.chord(c.keys);
        if(mn[0]) a.note(mn[0],.25);
        setPr(new Set([...c.keys,mn[0]].filter(Boolean)));
      } else if(mn[s.bt]){
        a.note(mn[s.bt],.25);
        setPr(new Set([mn[s.bt]]));
      }
      setTimeout(()=>setPr(new Set()),180);
      setDisplay({si:s.si,ci:s.ci,bt:s.bt});
    },ms);
    // Premier beat immédiat avec accord + 1re note de mélodie courants
    const s0=state.current;
    const c0=song.chords[s0.ci];
    const mn0=song.melPerChord[s0.ci];
    a.chord(c0.keys);
    if(mn0[0]) a.note(mn0[0],.25);
    setPr(new Set([...c0.keys,mn0[0]].filter(Boolean)));
    setTimeout(()=>setPr(new Set()),180);
    return()=>clearInterval(id);
  },[run,jump,a,song.bpm,song.chords,song.structure,song.melPerChord]);

  const reset=useCallback(()=>{
    setRun(false);
    state.current={si:0,ci:0,rep:0,bt:0};
    setDisplay({si:0,ci:0,bt:0});
  },[]);
  const jumpTo=useCallback(i=>{
    a.unlock();
    state.current={si:i,ci:0,rep:0,bt:0};
    setDisplay({si:i,ci:0,bt:0});
    if(run) setJump(j=>j+1);
    else setRun(true);
  },[a,run]);
  const finished=!run&&state.current.si>=song.structure.length;

  const onPractice=useCallback(()=>{
    a.unlock();reset();
    setTimeout(()=>setRun(true),0);
  },[a,reset]);
  const onStop=useCallback(()=>setRun(false),[]);
  const onPianoClick=useCallback(n=>{
    a.unlock();a.note(n);
    setPr(new Set([n]));
    setTimeout(()=>setPr(new Set()),PRESS_FLASH_MS);
  },[a]);

  const top=useMemo(()=><InputWidget pitch={pitch} midi={midi} expected={ch.keys[0]} R={R}/>,[pitch,midi,ch.keys,R]);
  const side=useMemo(()=><LessonControls R={R} color={ch.color} onPractice={onPractice} onStop={onStop} isPracticing={run} beat={display.bt}
    extra={
      <>
        {!run&&display.si>0&&!finished&&<button onClick={reset} style={{padding:`${R.ipad?10:8}px ${R.pad}px`,borderRadius:R.rad-2,border:"1px solid #334155",background:"transparent",color:"#94a3b8",fontFamily:"inherit",fontSize:R.font.sm,fontWeight:600,cursor:"pointer",minHeight:R.btn.min}}>↺ Reprendre du début</button>}
        {finished&&<div style={{padding:R.pad,borderRadius:R.rad,background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.3)",textAlign:"center"}}>
          <div style={{fontSize:R.font.md,fontWeight:700,color:"#34d399"}}>Pari gagné.</div>
          <div style={{fontSize:R.font.xs+1,color:"#64748b",marginTop:4}}>{song.title} à {song.bpm} bpm.</div></div>}
      </>
    }
  />,[R,ch.color,run,display.bt,display.si,finished,song.title,song.bpm,onPractice,onStop,reset]);
  const pianoJsx=useMemo(()=><Piano keys={song.keys} hl={new Set(ch.keys)} hl2={new Set(melN)} fm={mfCombined} hands={handsCombined} c1={ch.color} c2={RIGHT_HAND_COLOR} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={onPianoClick}/>,[song.keys,ch.keys,melN,mfCombined,handsCombined,ch.color,pr,detNote,midiNotes,R,onPianoClick]);
  useSlots(top,side,R.landscape?pianoJsx:null);

  return(<div>
    {/* Partition : sections de la chanson, cliquable pour démarrer à n'importe quelle section */}
    <SeqStrip R={R} activeIdx={display.si} onItemClick={jumpTo} items={song.structure.map((s,i)=>({
      label:s.label,sub:s.reps>1?`x${s.reps}`:null,color:L7_SECTION_COLOR,done:i<display.si
    }))}/>
    <div style={{fontSize:R.font.xs,color:"#64748b",marginBottom:R.gap+2,fontStyle:"italic",textAlign:"center"}}>Tape une section pour démarrer ici</div>
    {/* Cycle des 4 accords pour repère pendant la performance */}
    <ProgBar chords={song.chords} ci={display.ci} R={R}/>
    {!R.landscape&&pianoJsx}
    {/* Aperçu deux mains qui défile avec l'avancée de la chanson */}
    <HandsStrip 
      left={{label:"Main G",name:ch.name,sub:ch.keys.map(fr).join(" · "),color:ch.color}}
      right={{label:"Main D",notes:melN,activeIdx:run?display.bt:-1,color:RIGHT_HAND_COLOR,labelColor:"#a78bfa"}}
      R={R}/>
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════
   TIMER
   ═══════════════════════════════════════════════════════════════════ */
function Timer({R,compact}){
  const[on,setOn]=useState(false);const[sec,setSec]=useState(0);const[total,setTotal]=useState(0);
  useEffect(()=>{if(on){const id=setInterval(()=>setSec(s=>s+1),1000);return()=>clearInterval(id)}},[on]);
  const toggle=()=>{if(on){setTotal(t=>t+sec);setSec(0)}setOn(!on)};
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  if(compact){
    // Variante compacte : tout sur une ligne, pour l'intégration dans le header en paysage
    return(
      <div style={{display:"flex",alignItems:"center",gap:R.gap,padding:`6px ${R.gap+4}px`,borderRadius:R.rad-2,
        background:on?"rgba(16,185,129,.08)":"rgba(255,255,255,.03)",border:on?"1px solid rgba(16,185,129,.2)":"1px solid rgba(255,255,255,.06)"}}>
        <div style={{fontSize:R.font.xs,color:"#64748b"}}>Pratique</div>
        <div style={{fontSize:R.font.md,fontWeight:700,color:on?"#34d399":"#94a3b8",fontVariantNumeric:"tabular-nums",minWidth:46}}>{fmt(sec)}</div>
        <button onClick={toggle} style={{minHeight:30,minWidth:30,padding:"2px 8px",borderRadius:R.rad-4,fontFamily:"inherit",fontSize:R.font.xs,fontWeight:600,cursor:"pointer",
          border:on?"1px solid #ef444455":"1px solid #10b98155",background:on?"#ef444422":"#10b98122",color:on?"#ef4444":"#10b981"}}>{on?"❚❚":"▶"}</button>
        {total>0&&<div style={{fontSize:R.font.xs,color:"#64748b"}}>{Math.floor((total+sec)/60)} min</div>}
      </div>);
  }
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:R.gap*2,padding:`${R.ipad?10:8}px ${R.pad}px`,borderRadius:R.rad,
      background:on?"rgba(16,185,129,.08)":"rgba(255,255,255,.03)",border:on?"1px solid rgba(16,185,129,.2)":"1px solid rgba(255,255,255,.06)",marginBottom:R.pad}}>
      <div style={{fontSize:R.font.xs,color:"#64748b"}}>Pratique</div>
      <div style={{fontSize:R.font.lg,fontWeight:700,color:on?"#34d399":"#94a3b8",fontVariantNumeric:"tabular-nums",minWidth:52}}>{fmt(sec)}</div>
      <Btn onClick={toggle} style={{border:on?"1px solid #ef444455":"1px solid #10b98155",background:on?"#ef444422":"#10b98122",color:on?"#ef4444":"#10b981",padding:"6px 14px"}}>{on?"Pause":"Start"}</Btn>
      {total>0&&<div style={{fontSize:R.font.xs,color:"#64748b"}}>Total : {Math.floor((total+sec)/60)} min</div>}
    </div>);
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════════ */
const LESSON_COMPONENTS=[L1,L2,L3,L4,L5,L6,L7];

export default function PianoTutor(){
  const songKeys=Object.keys(SONGS);
  const[songId,setSongId]=useState(songKeys[0]);
  const[les,setLes]=useState(0);const[done,setDone]=useState(new Set());
  const au=useAudio();const pitch=usePitch();const midi=useMIDI();const R=useResponsiveSource();
  const song=SONGS[songId];const L=song.lessons[les];
  const[detNote,setDetNote]=useState(null);const dt=useRef();
  // Slots : top (header right) et side (sous le tip dans la colonne droite)
  const[topJsx,setTopJsx]=useState(null);
  const[sideJsx,setSideJsx]=useState(null);
  const[pianoJsx,setPianoJsx]=useState(null);
  const slotsValue=useMemo(()=>({setTop:setTopJsx,setSide:setSideJsx,setPiano:setPianoJsx,has:true}),[]);

  useEffect(()=>{pitch.onNote(n=>{setDetNote(n);clearTimeout(dt.current);dt.current=setTimeout(()=>setDetNote(null),400)})},[pitch.onNote]);
  useEffect(()=>{midi.onNote((n,t)=>{if(t==="on"){setDetNote(n);clearTimeout(dt.current);dt.current=setTimeout(()=>setDetNote(null),600)}})},[midi.onNote]);
  // Anti-larsen : à chaque a.note/a.chord, useAudio appellera pitch.pause(900-1100ms)
  // pour suspendre la détection micro et empêcher l'iPad de capter son propre son.
  useEffect(()=>{au.setPitchPause(pitch.pause)},[au,pitch.pause]);

  const tog=i=>setDone(p=>{const s=new Set(p);const k=`${songId}-${les}-${i}`;s.has(k)?s.delete(k):s.add(k);return s});
  const LessonComp=LESSON_COMPONENTS[les];

  // Couleur de l'accent de la leçon active (utilisée pour onglet sélectionné)
  const lessonColors=["#6366f1","#06b6d4","#f87171","#e879f9","#10b981","#f59e0b","#a855f7"];
  const lesColor=lessonColors[les]||"#6366f1";

  // Bloc d'en-tête de leçon (objectifs + tip)
  const lessonHeader=(
    <div style={{padding:R.landscape?R.gap+4:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginBottom:R.landscape?0:R.pad}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
        <div><div style={{fontSize:R.landscape?R.font.sm+1:R.font.md,fontWeight:700,color:"#e2e8f0"}}>{L.t}</div><div style={{fontSize:R.font.xs+1,color:"#64748b"}}>{L.s}</div></div>
        <div style={{fontSize:R.font.xs,color:"#475569"}}>{L.wk}</div></div>
      <div style={{marginTop:R.gap}}>
        {L.goals.map((g,i)=>{const d=done.has(`${songId}-${les}-${i}`);return(
          <div key={i} onClick={()=>tog(i)} style={{display:"flex",alignItems:"center",gap:R.gap,padding:`${R.landscape?2:(R.ipad?5:3)}px 0`,cursor:"pointer"}}>
            <div style={{width:R.landscape?16:(R.ipad?18:14),height:R.landscape?16:(R.ipad?18:14),borderRadius:4,flexShrink:0,border:d?"none":"1.5px solid #475569",background:d?"#10b981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:R.font.xs,color:"#fff"}}>{d&&"✓"}</div>
            <div style={{fontSize:R.landscape?R.font.xs+1:R.font.sm,color:d?"#64748b":"#cbd5e1",textDecoration:d?"line-through":"none",lineHeight:1.3}}>{g}</div></div>)})}</div>
      <div style={{marginTop:R.gap+2,padding:`${R.landscape?6:(R.ipad?8:5)}px ${R.gap+4}px`,borderRadius:R.rad-4,background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.2)",fontSize:R.landscape?R.font.xs+1:R.font.sm,color:"#fcd34d",lineHeight:1.5}}>{L.tip}</div>
    </div>);

  // Bloc de leçon active (key force le remount = nettoie tous les intervals)
  const lessonContent=<LessonComp key={`${songId}-${les}`} song={song} R={R} a={au} pitch={pitch} midi={midi} detNote={detNote} midiNotes={midi.activeNotes}/>;

  return(
    <ResponsiveCtx.Provider value={R}>
    <SlotsCtx.Provider value={slotsValue}>
    <div style={R.landscape?{
      // Paysage : page bloquée à 100dvh, AUCUN scroll de page possible.
      // Layout flex column : header → onglets → grille leçon (flex:1) → piano (flex-shrink:0)
      // Safe-area-insets pour respecter notch / dynamic island / indicateur home iPad.
      height:"100dvh",overflow:"hidden",background:"linear-gradient(180deg,#0a0a14,#12121f 40%,#161625)",
      color:"#e2e8f0",fontFamily:"'JetBrains Mono','SF Mono','Fira Code',monospace",
      display:"flex",flexDirection:"column",
      padding:"max(8px,env(safe-area-inset-top)) max(24px,env(safe-area-inset-right)) 0 max(24px,env(safe-area-inset-left))",
      maxWidth:1280,margin:"0 auto"
    }:{
      minHeight:"100vh",background:"linear-gradient(180deg,#0a0a14,#12121f 40%,#161625)",color:"#e2e8f0",
      fontFamily:"'JetBrains Mono','SF Mono','Fira Code',monospace",
      padding:`max(${R.ipad?20:14}px,env(safe-area-inset-top)) max(${R.ipad?24:12}px,env(safe-area-inset-right)) max(${R.ipad?20:14}px,env(safe-area-inset-bottom)) max(${R.ipad?24:12}px,env(safe-area-inset-left))`,
      maxWidth:R.ipad?780:600,margin:"0 auto"
    }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        button:active,[role="button"]:active{transform:scale(.97);transition:transform .08s ease-out}
        button{transition:transform .15s ease-out,background .15s,border-color .15s,color .15s,opacity .15s}
        button:focus-visible{outline:2px solid #818cf8;outline-offset:2px}
        @media (prefers-reduced-motion:reduce){button:active{transform:none}}
      `}</style>

      {R.landscape ? (
        // En paysage : header sur 1 ligne, titre à gauche, Timer + topJsx (Micro/MIDI) à droite
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:R.pad,flexShrink:0,marginBottom:R.gap+2}}>
          <div style={{display:"flex",alignItems:"baseline",gap:R.pad,minWidth:0,flex:"0 1 auto"}}>
            <h1 style={{fontSize:R.font.md+1,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#cbd5e1",margin:0,whiteSpace:"nowrap"}}>{song.title}</h1>
            <p style={{fontSize:R.font.xs+1,color:"#64748b",margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{song.artist}</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:R.gap+2,flexShrink:0}}>
            {songKeys.length>1&&<div style={{display:"flex",gap:R.gap}}>
              {songKeys.map(k=><button key={k} onClick={()=>{setSongId(k);setLes(0)}} style={{
                padding:"6px 12px",borderRadius:R.rad-2,fontSize:R.font.xs,fontFamily:"inherit",fontWeight:600,cursor:"pointer",minHeight:32,
                border:k===songId?`1px solid ${SONGS[k].color}`:"1px solid #334155",background:k===songId?`${SONGS[k].color}22`:"transparent",
                color:k===songId?SONGS[k].color:"#94a3b8"}}>{SONGS[k].title}</button>)}</div>}
            <Timer R={R} compact={true}/>
            <div style={{minWidth:0,maxWidth:340}}>{topJsx}</div>
          </div>
        </div>
      ) : (
        // En portrait, layout classique
        <>
          <div style={{textAlign:"center",marginBottom:R.pad}}>
            <h1 style={{fontSize:R.font.lg+2,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#cbd5e1",margin:0}}>{song.title}</h1>
            <p style={{fontSize:R.font.xs+1,color:"#64748b",margin:"3px 0 0"}}>{song.artist}</p>
          </div>
          {songKeys.length>1&&<div style={{display:"flex",gap:R.gap,justifyContent:"center",marginBottom:R.pad}}>
            {songKeys.map(k=><button key={k} onClick={()=>{setSongId(k);setLes(0)}} style={{
              padding:`${R.ipad?10:7}px ${R.ipad?20:14}px`,borderRadius:R.rad,fontSize:R.font.sm,fontFamily:"inherit",fontWeight:600,cursor:"pointer",minHeight:R.btn.min,
              border:k===songId?`2px solid ${SONGS[k].color}`:"1px solid #334155",background:k===songId?`${SONGS[k].color}22`:"transparent",
              color:k===songId?SONGS[k].color:"#94a3b8"}}>{SONGS[k].title}</button>)}</div>}
          <Timer R={R}/>
          {/* En portrait : topJsx (InputWidget) rendu directement sous le Timer */}
          {topJsx&&<div style={{marginBottom:R.pad}}>{topJsx}</div>}
        </>
      )}

      {/* Onglets de leçon — chaque onglet a sa couleur d'accent */}
      <div style={{display:"flex",gap:R.ipad?5:3,marginBottom:R.landscape?R.gap+2:R.pad,overflowX:"auto",paddingBottom:2,flexShrink:0}}>
        {song.lessons.map((l,i)=>{const dn=l.goals.every((_,gi)=>done.has(`${songId}-${i}-${gi}`));const ac=i===les;const c=lessonColors[i]||"#6366f1";
          return(<button key={i} onClick={()=>setLes(i)} style={{
            flex:"1 0 0",minWidth:0,padding:R.landscape?"6px 4px":R.tab.p,borderRadius:R.rad-2,cursor:"pointer",fontFamily:"inherit",textAlign:"center",
            border:ac?`1.5px solid ${c}`:"1px solid #334155",
            background:ac?`${c}22`:"rgba(255,255,255,.04)",
            transition:"all .2s",minHeight:R.landscape?38:R.btn.min}}>
            <div style={{fontSize:R.landscape?14:R.tab.icon,marginBottom:1,lineHeight:1,color:ac?c:dn?"#10b981":"#cbd5e1"}}>{dn?"✓":l.icon}</div>
            <div style={{fontSize:R.landscape?10:R.tab.f,fontWeight:700,color:ac?c:"#cbd5e1",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.2,letterSpacing:.3}}>{l.t}</div>
          </button>)})}
      </div>

      {/* Zone leçon */}
      {R.landscape ? (
        // Grille : contenu à gauche, objectifs+tip+sideJsx à droite. flex:1 et min-height:0 critiques pour
        // que le scroll interne fonctionne sans pousser le piano hors écran.
        <div style={{flex:1,minHeight:0,display:"grid",gridTemplateColumns:"1fr 300px",gap:R.pad,alignItems:"stretch",overflow:"hidden",marginBottom:R.gap}}>
          <div style={{minWidth:0,overflowY:"auto",overflowX:"hidden",paddingRight:6}}>{lessonContent}</div>
          <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:R.gap+2,paddingRight:4}}>
            {lessonHeader}
            {sideJsx}
          </div>
        </div>
      ) : (
        // Portrait : tout en flux normal
        <>
          {lessonHeader}
          {lessonContent}
          {sideJsx&&<div style={{marginTop:R.pad}}>{sideJsx}</div>}
        </>
      )}

      {/* Piano fixé en bas du flex (paysage uniquement). En portrait, le piano est rendu DANS la leçon. */}
      {R.landscape&&pianoJsx&&<div style={{flexShrink:0,padding:`6px 0 max(8px,env(safe-area-inset-bottom))`,
        background:"linear-gradient(180deg,rgba(10,10,20,0) 0%,rgba(10,10,20,.6) 100%)"}}>{pianoJsx}</div>}

      {/* Nav (cachée en paysage : les onglets servent déjà à naviguer) */}
      {!R.landscape&&<div style={{display:"flex",justifyContent:"space-between",marginTop:R.pad+4,padding:"0 2px"}}>
        <Btn onClick={()=>setLes(Math.max(0,les-1))} disabled={les===0} style={{padding:`${R.ipad?8:6}px ${R.ipad?16:12}px`,color:les===0?"#334155":"#94a3b8",opacity:les===0?.4:1}}>← Précédente</Btn>
        <Btn onClick={()=>setLes(Math.min(song.lessons.length-1,les+1))} disabled={les>=song.lessons.length-1} style={{
          padding:`${R.ipad?8:6}px ${R.ipad?16:12}px`,
          border:les>=song.lessons.length-1?"1px solid #334155":"1px solid #6366f1",
          background:les>=song.lessons.length-1?"transparent":"#6366f122",
          color:les>=song.lessons.length-1?"#334155":"#818cf8",opacity:les>=song.lessons.length-1?.4:1}}>Suivante →</Btn>
      </div>}
    </div>
    </SlotsCtx.Provider>
    </ResponsiveCtx.Provider>);
}
