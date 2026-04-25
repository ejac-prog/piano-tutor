import { useState, useEffect, useCallback, useRef, useMemo } from "react";

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
      verse: { label:"Couplet", sub:"\"Another head hangs lowly...\"",
        notes:[{note:"E4",dur:1,ly:"A-"},{note:"E4",dur:1,ly:"no-"},{note:"E4",dur:1,ly:"ther"},{note:"E4",dur:1,ly:"head"},{note:"D4",dur:1,ly:"hangs"},{note:"D4",dur:2,ly:"low-"},{note:"E4",dur:1,ly:"ly"},{note:"_",dur:1},{note:"E4",dur:1,ly:"child"},{note:"E4",dur:1,ly:"is"},{note:"D4",dur:1,ly:"slow-"},{note:"D4",dur:1,ly:"ly"},{note:"E4",dur:2,ly:"ta-"},{note:"E4",dur:1,ly:"ken"}] },
      chorus: { label:"Refrain", sub:"\"In your head, zombie...\"",
        notes:[{note:"E4",dur:1,ly:"In"},{note:"D4",dur:1,ly:"your"},{note:"B3",dur:2,ly:"head"},{note:"_",dur:1},{note:"E4",dur:1,ly:"in"},{note:"D4",dur:1,ly:"your"},{note:"B3",dur:2,ly:"head"},{note:"_",dur:1},{note:"E4",dur:1,ly:"zom-"},{note:"E4",dur:1,ly:"bie"},{note:"D4",dur:1,ly:"zom-"},{note:"D4",dur:1,ly:"bie"},{note:"C4",dur:1,ly:"zom-"},{note:"B3",dur:2,ly:"bie"}] },
    },
    melodyNotes: ["B3","C4","D4","E4"],
    melFingers: {E4:"1",D4:"2",C4:"3",B3:"4",A3:"5"},
    melPerChord: [["E4","E4","D4","D4"],["E4","E4","D4","E4"],["E4","D4","B3","B3"],["E4","D4","D4","C4"]],
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
       tip:"Pouce sur mi, index sur ré, majeur sur do, annulaire sur si."},
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
};

/* ═══════════════════════════════════════════════════════════════════
   CORE UTILS
   ═══════════════════════════════════════════════════════════════════ */
const NFR={C:"Do","C#":"Do#",D:"Ré","D#":"Ré#",E:"Mi",F:"Fa","F#":"Fa#",G:"Sol","G#":"Sol#",A:"La","A#":"La#",B:"Si"};
const FREQ={C3:130.81,"C#3":138.59,D3:146.83,"D#3":155.56,E3:164.81,F3:174.61,"F#3":185,G3:196,"G#3":207.65,A3:220,"A#3":233.08,B3:246.94,C4:261.63,"C#4":277.18,D4:293.66,"D#4":311.13,E4:329.63};
const fr=n=>NFR[n.replace(/\d/,"")]||n;
const MIDI_NAMES=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const midiToName=m=>`${MIDI_NAMES[m%12]}${Math.floor(m/12)-1}`;
const ALL_NOTES=[];
for(let o=2;o<=6;o++) MIDI_NAMES.forEach((n,i)=>{const midi=(o+1)*12+i;ALL_NOTES.push({name:`${n}${o}`,freq:440*Math.pow(2,(midi-69)/12)})});

/* ═══════════════════════════════════════════════════════════════════
   RESPONSIVE HOOK — iPad vs phone
   ═══════════════════════════════════════════════════════════════════ */
function useResponsive(){
  const[w,setW]=useState(typeof window!=="undefined"?window.innerWidth:400);
  useEffect(()=>{const h=()=>setW(window.innerWidth);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h)},[]);
  const ipad=w>=700;
  return{
    ipad, w,
    piano:{h:ipad?240:170, maxW:ipad?680:540},
    font:{xs:ipad?11:8, sm:ipad?13:10, md:ipad?16:13, lg:ipad?20:16, xl:ipad?26:20, xxl:ipad?32:24},
    btn:{min:ipad?44:26, play:ipad?52:42, lg:ipad?56:48},
    gap:ipad?10:6, pad:ipad?18:12, rad:ipad?12:10,
    finger:{w:ipad?28:21,f:ipad?13:10},
    tab:{p:ipad?"10px 8px":"6px 2px",f:ipad?9:6,icon:ipad?16:12},
  };
}

/* ═══════════════════════════════════════════════════════════════════
   AUDIO ENGINE
   ═══════════════════════════════════════════════════════════════════ */
function useAudio(){
  const ctx=useRef(null);const unlocked=useRef(false);const pool=useRef([]);
  const getCtx=useCallback(()=>{if(!ctx.current)ctx.current=new(window.AudioContext||window.webkitAudioContext)();return ctx.current},[]);
  const unlock=useCallback(()=>{
    const c=getCtx();if(c.state==="suspended")c.resume();
    if(unlocked.current)return;
    const o=c.createOscillator(),g=c.createGain();g.gain.value=0;
    o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.001);unlocked.current=true;
  },[getCtx]);
  const cleanup=useCallback(()=>{while(pool.current.length>14){const x=pool.current.shift();try{x.o.stop();x.o.disconnect();x.g.disconnect()}catch(e){}}},[]);
  const note=useCallback((n,v=0.3)=>{
    const c=getCtx();if(c.state==="suspended")c.resume();cleanup();
    const o=c.createOscillator(),g=c.createGain();o.type="triangle";o.frequency.value=FREQ[n]||261;
    g.gain.setValueAtTime(v,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+1);
    o.connect(g);g.connect(c.destination);o.start(c.currentTime);o.stop(c.currentTime+1);
    pool.current.push({o,g});o.onended=()=>{try{o.disconnect();g.disconnect()}catch(e){}pool.current=pool.current.filter(x=>x.o!==o)};
  },[getCtx,cleanup]);
  const chord=useCallback(keys=>{const c=getCtx();if(c.state==="suspended")c.resume();cleanup();
    keys.forEach(k=>{const o=c.createOscillator(),g=c.createGain();o.type="triangle";o.frequency.value=FREQ[k]||261;
      g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+1.1);
      o.connect(g);g.connect(c.destination);o.start(c.currentTime);o.stop(c.currentTime+1.1);
      pool.current.push({o,g});o.onended=()=>{try{o.disconnect();g.disconnect()}catch(e){}pool.current=pool.current.filter(x=>x.o!==o)};
    })},[getCtx,cleanup]);
  return{unlock,note,chord};
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
   PITCH DETECTION
   ═══════════════════════════════════════════════════════════════════ */
function usePitch(){
  const mc=useRef(null);const an=useRef(null);const st=useRef(null);const bf=useRef(null);const rf=useRef(null);
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
  const detect=useCallback(()=>{if(!an.current||!bf.current)return;an.current.getFloatTimeDomainData(bf.current);
    const f=autoC(bf.current,mc.current.sampleRate);if(f>0){const n=noteFromFreq(f);
      if(n){setD({note:n.name,freq:Math.round(f),cents:n.cents,frName:fr(n.name)});if(cbRef.current)cbRef.current(n.name)}}
    else setD(null);rf.current=requestAnimationFrame(detect)},[]);
  const start=useCallback(async()=>{try{setE(null);const s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    st.current=s;mc.current=new(window.AudioContext||window.webkitAudioContext)();const src=mc.current.createMediaStreamSource(s);
    an.current=mc.current.createAnalyser();an.current.fftSize=4096;src.connect(an.current);bf.current=new Float32Array(an.current.fftSize);
    setL(true);rf.current=requestAnimationFrame(detect)}catch(e){setE("Accès micro refusé")}},[detect]);
  const stop=useCallback(()=>{cancelAnimationFrame(rf.current);if(st.current)st.current.getTracks().forEach(t=>t.stop());
    if(mc.current)mc.current.close();st.current=null;mc.current=null;an.current=null;bf.current=null;setL(false);setD(null)},[]);
  const onNote=useCallback(cb=>{cbRef.current=cb},[]);
  useEffect(()=>()=>{cancelAnimationFrame(rf.current);if(st.current)st.current.getTracks().forEach(t=>t.stop());if(mc.current)try{mc.current.close()}catch(e){}},[]);
  return{listening,detected,micError,start,stop,onNote};
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
function Piano({keys,hl,hl2,fm,c1,c2,pressed,onClick,detectedNote,midiNotes,R}){
  const ws=keys.filter(k=>k.type==="w"),bs=keys.filter(k=>k.type==="b");
  const bPos={};let wi=0;
  keys.forEach(k=>{if(k.type==="b")bPos[k.note]=wi-1;else wi++});
  const ww=100/ws.length;
  const clr=n=>{if(hl&&hl.has(n))return c1;if(hl2&&hl2.has(n))return c2||"#e879f9";return null};
  const isDet=n=>(detectedNote&&detectedNote===n)||(midiNotes&&midiNotes.has(n));
  return(
    <div style={{position:"relative",width:"100%",maxWidth:R.piano.maxW,height:R.piano.h,margin:"0 auto"}}>
      <div style={{display:"flex",gap:2,height:"100%",position:"relative",zIndex:1}}>
        {ws.map(k=>{const cl=clr(k.note),pr=pressed.has(k.note),det=isDet(k.note);return(
          <div key={k.note} onClick={()=>onClick(k.note)} style={{
            flex:1,borderRadius:`0 0 ${R.rad}px ${R.rad}px`,cursor:"pointer",transition:"all .12s",
            position:"relative",display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",paddingBottom:R.pad-4,
            background:det?"#22c55e":pr?(cl||"#94a3b8"):cl?`linear-gradient(180deg,${cl}44,${cl}22)`:"linear-gradient(180deg,#f8fafc,#e2e8f0)",
            border:det?"2px solid #22c55e":cl?`2px solid ${cl}`:"1px solid #cbd5e1",
            boxShadow:det?"0 0 16px rgba(34,197,94,.5)":cl?`0 0 10px ${cl}33`:"0 2px 4px rgba(0,0,0,.1)",
          }}>
            {cl&&fm[k.note]&&<div style={{position:"absolute",top:R.pad,width:R.finger.w,height:R.finger.w,borderRadius:"50%",background:det?"#22c55e":cl,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:R.finger.f,fontWeight:700}}>{fm[k.note]}</div>}
            <div style={{fontSize:R.font.xs,fontWeight:600,color:det?"#22c55e":cl||"#94a3b8"}}>{fr(k.note)}</div>
          </div>);})}
      </div>
      {bs.map(k=>{const p=bPos[k.note];if(p===undefined)return null;const cl=clr(k.note),pr=pressed.has(k.note),det=isDet(k.note);return(
        <div key={k.note} onClick={()=>onClick(k.note)} style={{
          position:"absolute",top:0,zIndex:2,left:`${(p+1)*ww-ww*.3}%`,width:`${ww*.6}%`,height:"55%",
          borderRadius:`0 0 ${R.rad-4}px ${R.rad-4}px`,cursor:"pointer",transition:"all .12s",
          display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center",paddingBottom:5,
          background:det?"#22c55e":pr?(cl||"#64748b"):cl?`linear-gradient(180deg,${cl},${cl}cc)`:"linear-gradient(180deg,#334155,#1e293b)",
          border:det?"2px solid #22c55e":cl?`2px solid ${cl}`:"1px solid #0f172a",
          boxShadow:det?"0 0 14px rgba(34,197,94,.6)":cl?`0 0 10px ${cl}55`:"0 3px 6px rgba(0,0,0,.4)",
        }}>
          {cl&&fm[k.note]&&<div style={{position:"absolute",top:R.pad-4,width:R.finger.w-4,height:R.finger.w-4,borderRadius:"50%",background:det?"#166534":"#fff",color:det?"#fff":cl,display:"flex",alignItems:"center",justifyContent:"center",fontSize:R.finger.f-2,fontWeight:700}}>{fm[k.note]}</div>}
          <div style={{fontSize:R.font.xs-2,fontWeight:600,color:det?"#fff":cl?"#fff":"#64748b"}}>{fr(k.note)}</div>
        </div>);})}
    </div>);
}

/* ═══════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */
function Btn({children,onClick,disabled,style:s={}}){const R=useResponsive();
  return <button onClick={onClick} disabled={disabled} style={{minWidth:R.btn.min,minHeight:R.btn.min,borderRadius:R.rad-2,border:"1px solid #334155",background:"transparent",color:"#94a3b8",cursor:disabled?"default":"pointer",fontSize:R.font.sm,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",fontWeight:600,padding:"4px 8px",...s}}>{children}</button>}

function BpmCtrl({bpm,setBpm,running,toggle,beat,color,R}){
  return(<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:R.gap*2,padding:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)"}}>
    <div style={{textAlign:"center"}}><div style={{fontSize:R.font.xs,color:"#64748b",marginBottom:3}}>BPM</div>
      <div style={{display:"flex",alignItems:"center",gap:R.gap}}>
        <Btn onClick={()=>setBpm(Math.max(40,bpm-5))}>-</Btn>
        <span style={{fontSize:R.font.lg,fontWeight:700,color:"#e2e8f0",minWidth:36,textAlign:"center"}}>{bpm}</span>
        <Btn onClick={()=>setBpm(Math.min(120,bpm+5))}>+</Btn></div></div>
    <button onClick={toggle} style={{width:R.btn.play,height:R.btn.play,borderRadius:"50%",cursor:"pointer",fontSize:R.font.lg,border:`2px solid ${running?"#ef4444":"#10b981"}`,background:running?"#ef444422":"#10b98122",color:running?"#ef4444":"#10b981",display:"flex",alignItems:"center",justifyContent:"center"}}>{running?"■":"▶"}</button>
    {running&&beat!==undefined&&<div style={{display:"flex",gap:R.gap}}>
      {[0,1,2,3].map(b=><div key={b} style={{width:R.ipad?14:10,height:R.ipad?14:10,borderRadius:"50%",background:b===beat?color:"rgba(255,255,255,.1)",boxShadow:b===beat?`0 0 8px ${color}66`:"none",transition:"all .1s"}}/>)}</div>}
  </div>);
}

function SeqViz({notes,idx,color,onPlay,onStop,playing,R}){
  return(<div style={{padding:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginTop:R.pad}}>
    <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:R.gap+2}}>
      {notes.map((n,i)=>(<div key={i} style={{padding:`${R.ipad?5:3}px ${R.ipad?8:5}px`,borderRadius:R.rad-4,minWidth:R.ipad?36:24,textAlign:"center",
        background:i===idx?`${color}33`:n.note==="_"?"transparent":"rgba(255,255,255,.04)",
        border:i===idx?`1px solid ${color}`:"1px solid transparent",transition:"all .1s"}}>
        <div style={{fontSize:R.font.sm,fontWeight:700,color:n.note==="_"?"#334155":color}}>{n.note==="_"?"·":fr(n.note)}</div>
        {n.ly&&<div style={{fontSize:R.font.xs,color:"#94a3b8"}}>{n.ly}</div>}</div>))}
    </div>
    <div style={{display:"flex",gap:R.gap}}>
      <Btn onClick={onPlay} style={{border:`1px solid ${color}55`,background:`${color}22`,color,padding:"6px 18px"}}>▶ Jouer</Btn>
      {playing&&<Btn onClick={onStop} style={{color:"#94a3b8",padding:"6px 14px"}}>■ Stop</Btn>}
    </div>
  </div>);
}

function InputWidget({pitch,midi,expected,R}){
  const[mode,setMode]=useState("off");
  const toggleMic=()=>{if(mode==="midi")midi.stop();if(mode==="mic"){pitch.stop();setMode("off")}else{pitch.start();setMode("mic")}};
  const toggleMidi=()=>{if(mode==="mic")pitch.stop();if(mode==="midi"){midi.stop();setMode("off")}else{midi.start();setMode("midi")}};
  if(mode==="off") return(
    <div style={{display:"flex",gap:R.gap,marginBottom:R.pad}}>
      <button onClick={toggleMic} style={{flex:1,padding:R.pad,borderRadius:R.rad,cursor:"pointer",fontFamily:"inherit",
        border:"1px dashed #334155",background:"rgba(255,255,255,.02)",color:"#64748b",fontSize:R.font.sm,fontWeight:600,
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,minHeight:R.btn.min}}>
        🎤 Micro</button>
      {midi.supported&&<button onClick={toggleMidi} style={{flex:1,padding:R.pad,borderRadius:R.rad,cursor:"pointer",fontFamily:"inherit",
        border:"1px dashed #334155",background:"rgba(255,255,255,.02)",color:"#64748b",fontSize:R.font.sm,fontWeight:600,
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,minHeight:R.btn.min}}>
        🎹 MIDI</button>}
    </div>);
  const det=mode==="mic"?pitch.detected:null;
  const midiAct=mode==="midi"?Array.from(midi.activeNotes):[];
  const lastM=midiAct.length>0?midiAct[midiAct.length-1]:null;
  const dispNote=mode==="mic"?det?.frName:(lastM?fr(lastM):null);
  const dispRaw=mode==="mic"?det?.note:lastM;
  const match=dispRaw&&expected&&dispRaw===expected;
  const close=dispRaw&&expected&&!match&&dispRaw.replace(/\d/,"")===expected.replace(/\d/,"");
  return(
    <div style={{padding:R.pad,borderRadius:R.rad,marginBottom:R.pad,transition:"all .2s",
      background:match?"rgba(34,197,94,.1)":dispNote?"rgba(251,191,36,.06)":"rgba(255,255,255,.03)",
      border:match?"1px solid rgba(34,197,94,.3)":dispNote?"1px solid rgba(251,191,36,.2)":"1px solid rgba(255,255,255,.08)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:R.gap+2}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px rgba(34,197,94,.6)",animation:"pulse 1.5s infinite"}}/>
          <span style={{fontSize:R.font.xs,color:"#64748b"}}>{mode==="mic"?"Micro actif":midi.connected?`MIDI : ${midi.deviceName}`:"MIDI : en attente..."}</span></div>
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

// L1 — Block chords
function L1({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[ci,setCi]=useState(0);const[pr,setPr]=useState(new Set());
  const[looping,setLoop]=useState(false);const[bpm,setBpm]=useState(60);const[bt,setBt]=useState(0);
  const ciRef=useRef(ci);useEffect(()=>{ciRef.current=ci},[ci]);
  const ch=song.chords[ci];

  useInterval(()=>{setBt(b=>{if(b+1>=4){setCi(c=>{const n=(c+1)%song.chords.length;ciRef.current=n;return n});return 0}return b+1})},60/bpm*1000,looping);
  useEffect(()=>{if(looping&&bt===0)a.chord(song.chords[ciRef.current].keys)},[bt,looping]);

  return(<div>
    <InputWidget pitch={pitch} midi={midi} expected={ch.keys[0]} R={R}/>
    <ChordBtns chords={song.chords} ci={ci} setCi={setCi} unlock={a.unlock} R={R}/>
    <div style={{textAlign:"center",marginBottom:R.pad,padding:R.pad,background:`${ch.color}11`,borderRadius:R.rad,border:`1px solid ${ch.color}33`}}>
      <div style={{fontSize:R.font.sm,color:"#94a3b8",marginBottom:R.gap}}>Main gauche : plaque ces 3 notes</div>
      <div style={{display:"flex",justifyContent:"center",gap:R.ipad?24:18}}>
        {ch.keys.map(k=><div key={k} style={{textAlign:"center"}}><div style={{fontSize:R.font.xl,fontWeight:700,color:ch.color}}>{fr(k)}</div><div style={{fontSize:R.font.xs,color:"#64748b"}}>doigt {ch.fingers[k]}</div></div>)}</div>
      <Btn onClick={()=>{a.unlock();a.chord(ch.keys);setPr(new Set(ch.keys));setTimeout(()=>setPr(new Set()),500)}} style={{margin:`${R.gap+2}px auto 0`,border:`1px solid ${ch.color}55`,background:`${ch.color}22`,color:ch.color,padding:"6px 18px"}}>▶ Écouter</Btn>
    </div>
    <Piano keys={song.keys} hl={new Set(ch.keys)} fm={ch.fingers} c1={ch.color} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={n=>{a.unlock();a.note(n);setPr(new Set([n]));setTimeout(()=>setPr(new Set()),300)}}/>
    <div style={{marginTop:R.pad}}><BpmCtrl bpm={bpm} setBpm={setBpm} running={looping} beat={bt} color={ch.color} R={R} toggle={()=>{a.unlock();setLoop(!looping);if(!looping){setCi(0);setBt(0)}}}/></div>
  </div>);
}

// L2 — Arpeggios
function L2({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[ci,setCi]=useState(0);const[pr,setPr]=useState(new Set());const[idx,setIdx]=useState(-1);
  const[looping,setLoop]=useState(false);const[bpm,setBpm]=useState(60);const[bt,setBt]=useState(0);
  const[arpPlaying,setArpP]=useState(false);
  const arRef=useRef(null);const ciRef=useRef(ci);useEffect(()=>{ciRef.current=ci},[ci]);
  const ch=song.chords[ci];

  const playArp=()=>{a.unlock();let i=0;const notes=song.chords[ciRef.current].arp;const step=60/bpm*1000/2;
    clearInterval(arRef.current);setArpP(true);
    arRef.current=setInterval(()=>{const nn=song.chords[ciRef.current].arp;if(i>=nn.length)i=0;
      a.note(nn[i],.28);setIdx(i);setPr(new Set([nn[i]]));i++},step)};
  const stopArp=()=>{clearInterval(arRef.current);setIdx(-1);setPr(new Set());setArpP(false)};

  // Loop mode
  useEffect(()=>{if(looping){let ni=0,chi=0;const step=60/bpm*1000/2;
    const id=setInterval(()=>{const c=song.chords[chi];if(ni>=c.arp.length){ni=0;chi=(chi+1)%song.chords.length;setCi(chi);ciRef.current=chi}
      a.note(song.chords[chi].arp[ni],.25);setPr(new Set([song.chords[chi].arp[ni]]));setIdx(ni);setBt(Math.floor(ni/2));ni++},step);
    return()=>clearInterval(id)}setBt(0);setIdx(-1);setPr(new Set())},[looping,bpm]);
  useEffect(()=>()=>clearInterval(arRef.current),[]);

  return(<div>
    <InputWidget pitch={pitch} midi={midi} expected={ch.arp[idx>=0?idx:0]} R={R}/>
    <ChordBtns chords={song.chords} ci={ci} setCi={i=>{setCi(i);ciRef.current=i;stopArp()}} unlock={a.unlock} R={R}/>
    <div style={{textAlign:"center",marginBottom:R.pad,padding:R.pad,background:`${ch.color}11`,borderRadius:R.rad,border:`1px solid ${ch.color}33`}}>
      <div style={{fontSize:R.font.sm,color:"#94a3b8",marginBottom:R.gap}}>Pattern : bas → milieu → haut → milieu</div>
      <div style={{display:"flex",justifyContent:"center",gap:R.gap}}>
        {ch.arp.slice(0,4).map((n,i)=><div key={i} style={{padding:`${R.ipad?6:4}px ${R.ipad?12:8}px`,borderRadius:R.rad-4,background:i===idx%4?`${ch.color}33`:"rgba(255,255,255,.05)",border:i===idx%4?`1px solid ${ch.color}`:"1px solid transparent"}}>
          <div style={{fontSize:R.font.lg,fontWeight:700,color:ch.color}}>{fr(n)}</div></div>)}</div>
      <div style={{display:"flex",gap:R.gap,justifyContent:"center",marginTop:R.gap+2}}>
        <Btn onClick={()=>{stopArp();playArp()}} style={{border:`1px solid ${ch.color}55`,background:`${ch.color}22`,color:ch.color,padding:"6px 18px"}}>▶ Écouter</Btn>
        {arpPlaying&&<Btn onClick={stopArp} style={{padding:"6px 14px"}}>■ Stop</Btn>}
      </div>
    </div>
    <Piano keys={song.keys} hl={new Set(ch.keys)} fm={ch.fingers} c1={ch.color} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={n=>{a.unlock();a.note(n);setPr(new Set([n]));setTimeout(()=>setPr(new Set()),300)}}/>
    <div style={{marginTop:R.pad}}><BpmCtrl bpm={bpm} setBpm={setBpm} running={looping} beat={bt} color={ch.color} R={R} toggle={()=>{a.unlock();stopArp();setLoop(!looping);if(!looping){setCi(0);ciRef.current=0;setBt(0)}}}/></div>
  </div>);
}

// L3 — Intro riff
function L3({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[idx,setIdx]=useState(-1);const[pr,setPr]=useState(new Set());const[playing,setP]=useState(false);const r=useRef(null);
  const cur=song.riff[idx>=0?idx:0]?.note;
  const play=()=>{a.unlock();let i=0;const step=60/65*1000*.5;clearInterval(r.current);setP(true);
    r.current=setInterval(()=>{if(i>=song.riff.length){clearInterval(r.current);setIdx(-1);setPr(new Set());setP(false);return}
      const n=song.riff[i];setIdx(i);if(n.note!=="_"){a.note(n.note,.35);setPr(new Set([n.note]))}else setPr(new Set());i++},step)};
  const stop=()=>{clearInterval(r.current);setIdx(-1);setPr(new Set());setP(false)};
  useEffect(()=>()=>clearInterval(r.current),[]);
  return(<div>
    <InputWidget pitch={pitch} midi={midi} expected={cur!=="_"?cur:null} R={R}/>
    <div style={{padding:R.pad,marginBottom:R.pad,borderRadius:R.rad,background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.2)"}}>
      <div style={{fontSize:R.font.sm+1,color:"#f87171",marginBottom:R.gap,fontWeight:600}}>Main droite : riff signature</div>
      <div style={{display:"flex",justifyContent:"center",gap:R.ipad?18:14}}>
        {song.riffNotes.map(n=><div key={n} style={{textAlign:"center"}}><div style={{fontSize:R.font.lg+2,fontWeight:700,color:"#f87171"}}>{fr(n)}</div><div style={{fontSize:R.font.xs,color:"#fb923c"}}>doigt {song.melFingers[n]}</div></div>)}</div>
    </div>
    <Piano keys={song.keys} hl={new Set(song.riffNotes)} fm={song.melFingers} c1="#f87171" pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={n=>{a.unlock();a.note(n);setPr(new Set([n]));setTimeout(()=>setPr(new Set()),300)}}/>
    <SeqViz notes={song.riff} idx={idx} color="#f87171" onPlay={play} onStop={stop} playing={playing} R={R}/>
  </div>);
}

// L4 — Melody
function L4({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const secs=Object.keys(song.melody);
  const[sec,setSec]=useState(secs[0]);const[idx,setIdx]=useState(-1);const[pr,setPr]=useState(new Set());const[playing,setP]=useState(false);
  const r=useRef(null);const m=song.melody[sec];const cur=m.notes[idx>=0?idx:0]?.note;
  const play=()=>{a.unlock();let i=0;const step=60/70*1000*.5;clearInterval(r.current);setP(true);
    r.current=setInterval(()=>{if(i>=m.notes.length){clearInterval(r.current);setIdx(-1);setPr(new Set());setP(false);return}
      const n=m.notes[i];setIdx(i);if(n.note!=="_"){a.note(n.note,.35);setPr(new Set([n.note]))}else setPr(new Set());i++},step)};
  const stop=()=>{clearInterval(r.current);setIdx(-1);setPr(new Set());setP(false)};
  useEffect(()=>()=>clearInterval(r.current),[]);
  return(<div>
    <InputWidget pitch={pitch} midi={midi} expected={cur!=="_"?cur:null} R={R}/>
    <div style={{display:"flex",gap:R.gap+2,justifyContent:"center",marginBottom:R.pad}}>
      {secs.map(k=><button key={k} onClick={()=>{setSec(k);setIdx(-1);stop()}} style={{padding:`${R.ipad?10:7}px ${R.ipad?20:16}px`,borderRadius:R.rad,fontSize:R.font.sm+1,fontFamily:"inherit",fontWeight:600,minHeight:R.btn.min,border:sec===k?"1px solid #e879f9":"1px solid #334155",background:sec===k?"#e879f922":"transparent",color:sec===k?"#e879f9":"#64748b",cursor:"pointer"}}>{song.melody[k].label}</button>)}</div>
    <div style={{padding:R.pad,marginBottom:R.pad,borderRadius:R.rad,background:"rgba(232,121,249,.06)",border:"1px solid rgba(232,121,249,.2)"}}>
      <div style={{fontSize:R.font.sm+1,color:"#c084fc",marginBottom:R.gap,fontWeight:600}}>Main droite</div>
      <div style={{display:"flex",justifyContent:"center",gap:R.ipad?18:14}}>
        {song.melodyNotes.map(n=><div key={n} style={{textAlign:"center"}}><div style={{fontSize:R.font.lg,fontWeight:700,color:"#e879f9"}}>{fr(n)}</div><div style={{fontSize:R.font.xs,color:"#a78bfa"}}>doigt {song.melFingers[n]}</div></div>)}</div>
    </div>
    <Piano keys={song.keys} hl={new Set(song.melodyNotes)} fm={song.melFingers} c1="#e879f9" pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={n=>{a.unlock();a.note(n);setPr(new Set([n]));setTimeout(()=>setPr(new Set()),300)}}/>
    <SeqViz notes={m.notes} idx={idx} color="#e879f9" onPlay={play} onStop={stop} playing={playing} R={R}/>
  </div>);
}

// L5 — Both hands
function L5({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[ci,setCi]=useState(0);const[step,setStep]=useState(0);const[pr,setPr]=useState(new Set());
  const ch=song.chords[ci];const melN=song.melPerChord[ci];
  const steps=[{t:"chord",l:`Plaque ${ch.name}`,k:ch.keys},...melN.map((n,i)=>({t:"note",l:`Note ${i+1} : ${fr(n)}`,k:[n]}))];
  const cur=steps[Math.min(step,steps.length-1)];const mf={...ch.fingers,...song.melFingers};
  return(<div>
    <InputWidget pitch={pitch} midi={midi} expected={cur.k[0]} R={R}/>
    <ChordBtns chords={song.chords} ci={ci} setCi={i=>{setCi(i);setStep(0)}} unlock={a.unlock} R={R}/>
    <div style={{textAlign:"center",marginBottom:R.pad,padding:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.08)"}}>
      <div style={{display:"flex",justifyContent:"center",gap:4,marginBottom:R.gap}}>
        {steps.map((_,i)=><div key={i} style={{width:R.ipad?12:8,height:R.ipad?12:8,borderRadius:"50%",background:i===step?ch.color:i<step?"#10b981":"rgba(255,255,255,.1)"}}/>)}</div>
      <div style={{fontSize:R.font.md,fontWeight:700,color:"#e2e8f0"}}>{cur.l}</div>
      <div style={{fontSize:R.font.sm,color:"#64748b",marginBottom:R.gap+2}}>{step===0?"Main gauche":"Main droite"}</div>
      <div style={{display:"flex",gap:R.gap,justifyContent:"center"}}>
        <Btn onClick={()=>setStep(Math.max(0,step-1))} style={{opacity:step===0?.3:1}}>←</Btn>
        <Btn onClick={()=>{a.unlock();if(cur.t==="chord")a.chord(cur.k);else cur.k.forEach(n=>a.note(n));setPr(new Set(cur.k));setTimeout(()=>setPr(new Set()),400)}} style={{color:"#10b981",borderColor:"#10b98155"}}>▶</Btn>
        <Btn onClick={()=>setStep(Math.min(steps.length-1,step+1))} style={{opacity:step>=steps.length-1?.3:1}}>→</Btn>
      </div>
    </div>
    <Piano keys={song.keys} hl={new Set(ch.keys)} hl2={new Set(melN)} fm={mf} c1={ch.color} c2="#e879f9" pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={n=>{a.unlock();a.note(n);setPr(new Set([n]));setTimeout(()=>setPr(new Set()),300)}}/>
    <div style={{padding:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginTop:R.pad,fontSize:R.font.sm,color:"#94a3b8",lineHeight:1.6}}>
      <span style={{color:ch.color}}>■</span> main gauche + <span style={{color:"#e879f9"}}>■</span> main droite</div>
  </div>);
}

// L6 — Tempo
function L6({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[bpm,setBpm]=useState(70);const[run,setRun]=useState(false);const[ci,setCi]=useState(0);const[bt,setBt]=useState(0);const[pr,setPr]=useState(new Set());
  const ciRef=useRef(0);useEffect(()=>{ciRef.current=ci},[ci]);const ch=song.chords[ci];
  useInterval(()=>{setBt(b=>{if(b+1>=4){setCi(c=>{const n=(c+1)%song.chords.length;ciRef.current=n;return n});return 0}return b+1})},60/bpm*1000,run);
  useEffect(()=>{if(run&&bt===0){a.chord(song.chords[ciRef.current].keys);setPr(new Set(song.chords[ciRef.current].keys));setTimeout(()=>setPr(new Set()),200)}},[bt,run]);
  const pct=bpm>=song.bpm?100:Math.round((bpm-40)/(song.bpm-40)*100);
  return(<div>
    <InputWidget pitch={pitch} midi={midi} expected={ch.keys[0]} R={R}/>
    <div style={{textAlign:"center",marginBottom:R.pad,padding:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)"}}>
      <div style={{fontSize:R.font.sm,color:"#64748b",marginBottom:R.gap}}>Objectif : {song.bpm} bpm</div>
      <div style={{height:R.ipad?8:6,borderRadius:4,background:"rgba(255,255,255,.08)",overflow:"hidden",marginBottom:R.pad}}>
        <div style={{height:"100%",width:`${pct}%`,borderRadius:4,background:pct>=100?"linear-gradient(90deg,#10b981,#34d399)":"linear-gradient(90deg,#f59e0b,#fbbf24)",transition:"width .3s"}}/></div>
      <BpmCtrl bpm={bpm} setBpm={setBpm} running={run} beat={bt} color={ch.color} R={R} toggle={()=>{a.unlock();setRun(!run);if(!run){setCi(0);ciRef.current=0;setBt(0)}}}/></div>
    <Piano keys={song.keys} hl={new Set(ch.keys)} fm={ch.fingers} c1={ch.color} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={n=>{a.unlock();a.note(n);setPr(new Set([n]));setTimeout(()=>setPr(new Set()),300)}}/>
    <ProgBar chords={song.chords} ci={ci} R={R}/>
  </div>);
}

// L7 — Full performance (fixed section advancement)
function L7({song,R,...inp}){
  const{a,pitch,midi,detNote,midiNotes}=inp;
  const[run,setRun]=useState(false);const[pr,setPr]=useState(new Set());
  // Use refs for all mutable state in interval to avoid closure bugs
  const state=useRef({si:0,ci:0,rep:0,bt:0});
  const[display,setDisplay]=useState({si:0,ci:0,bt:0});
  const ch=song.chords[display.ci];const sec=song.structure[display.si];

  useEffect(()=>{if(!run)return;const ms=60/song.bpm*1000;
    const id=setInterval(()=>{const s=state.current;s.bt++;
      if(s.bt>=4){s.bt=0;s.ci=(s.ci+1)%song.chords.length;
        if(s.ci===0){s.rep++;
          if(s.rep>=song.structure[s.si].reps){s.rep=0;s.si++;
            if(s.si>=song.structure.length){setRun(false);return}}}}
      a.chord(song.chords[s.ci].keys);setPr(new Set(song.chords[s.ci].keys));setTimeout(()=>setPr(new Set()),200);
      setDisplay({si:s.si,ci:s.ci,bt:s.bt})},ms);
    // Play first beat immediately
    a.chord(song.chords[0].keys);setPr(new Set(song.chords[0].keys));setTimeout(()=>setPr(new Set()),200);
    return()=>clearInterval(id)},[run]);

  const reset=()=>{setRun(false);state.current={si:0,ci:0,rep:0,bt:0};setDisplay({si:0,ci:0,bt:0})};
  const finished=!run&&state.current.si>=song.structure.length;

  return(<div>
    <InputWidget pitch={pitch} midi={midi} expected={ch.keys[0]} R={R}/>
    <div style={{padding:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginBottom:R.pad}}>
      <div style={{fontSize:R.font.sm,color:"#64748b",marginBottom:R.gap,fontWeight:600}}>Structure</div>
      <div style={{display:"flex",gap:R.ipad?5:3,flexWrap:"wrap"}}>
        {song.structure.map((s,i)=><div key={i} style={{padding:`${R.ipad?7:5}px ${R.ipad?14:10}px`,borderRadius:R.rad-4,fontSize:R.font.sm,fontWeight:600,
          background:i===display.si?"#6366f122":"rgba(255,255,255,.03)",border:i===display.si?"1px solid #6366f1":"1px solid rgba(255,255,255,.06)",
          color:i===display.si?"#818cf8":i<display.si?"#10b981":"#64748b"}}>{i<display.si&&"✓ "}{s.label}</div>)}</div></div>
    <Piano keys={song.keys} hl={new Set(ch.keys)} fm={ch.fingers} c1={ch.color} pressed={pr} detectedNote={detNote} midiNotes={midiNotes} R={R} onClick={n=>{a.unlock();a.note(n);setPr(new Set([n]));setTimeout(()=>setPr(new Set()),300)}}/>
    <ProgBar chords={song.chords} ci={display.ci} R={R}/>
    <div style={{display:"flex",justifyContent:"center",gap:R.gap*2,marginTop:R.pad}}>
      <button onClick={()=>{a.unlock();if(!run){reset();setRun(true)}else setRun(false)}} style={{
        padding:`${R.ipad?14:10}px ${R.ipad?32:24}px`,borderRadius:R.rad,fontSize:R.font.sm+1,fontFamily:"inherit",fontWeight:700,cursor:"pointer",minHeight:R.btn.min,
        border:`2px solid ${run?"#ef4444":"#10b981"}`,background:run?"#ef444422":"#10b98122",color:run?"#ef4444":"#10b981"}}>{run?"■ Arrêter":"▶ Jouer la chanson"}</button>
      {!run&&display.si>0&&!finished&&<Btn onClick={reset} style={{padding:"10px 16px"}}>↺</Btn>}</div>
    {run&&<div style={{display:"flex",gap:R.gap,justifyContent:"center",marginTop:R.gap+2}}>
      {[0,1,2,3].map(b=><div key={b} style={{width:R.ipad?14:10,height:R.ipad?14:10,borderRadius:"50%",background:b===display.bt?ch.color:"rgba(255,255,255,.1)",boxShadow:b===display.bt?`0 0 8px ${ch.color}66`:"none"}}/>)}</div>}
    {finished&&<div style={{padding:R.pad,borderRadius:R.rad,background:"rgba(16,185,129,.08)",border:"1px solid rgba(16,185,129,.3)",textAlign:"center",marginTop:R.pad}}>
      <div style={{fontSize:R.font.md+2,fontWeight:700,color:"#34d399"}}>Pari gagné.</div>
      <div style={{fontSize:R.font.sm,color:"#64748b",marginTop:4}}>Tu viens de jouer {song.title} au complet à {song.bpm} bpm.</div></div>}
  </div>);
}

/* ═══════════════════════════════════════════════════════════════════
   TIMER
   ═══════════════════════════════════════════════════════════════════ */
function Timer({R}){
  const[on,setOn]=useState(false);const[sec,setSec]=useState(0);const[total,setTotal]=useState(0);
  useEffect(()=>{if(on){const id=setInterval(()=>setSec(s=>s+1),1000);return()=>clearInterval(id)}},[on]);
  const toggle=()=>{if(on){setTotal(t=>t+sec);setSec(0)}setOn(!on)};
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
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
  const au=useAudio();const pitch=usePitch();const midi=useMIDI();const R=useResponsive();
  const song=SONGS[songId];const L=song.lessons[les];
  const[detNote,setDetNote]=useState(null);const dt=useRef();

  useEffect(()=>{pitch.onNote(n=>{setDetNote(n);clearTimeout(dt.current);dt.current=setTimeout(()=>setDetNote(null),400)})},[pitch.onNote]);
  useEffect(()=>{midi.onNote((n,t)=>{if(t==="on"){setDetNote(n);clearTimeout(dt.current);dt.current=setTimeout(()=>setDetNote(null),600)}})},[midi.onNote]);

  const tog=i=>setDone(p=>{const s=new Set(p);const k=`${songId}-${les}-${i}`;s.has(k)?s.delete(k):s.add(k);return s});
  const LessonComp=LESSON_COMPONENTS[les];

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0a0a14,#12121f 40%,#161625)",color:"#e2e8f0",
      fontFamily:"'JetBrains Mono','SF Mono','Fira Code',monospace",padding:`${R.ipad?20:14}px ${R.ipad?24:12}px`,
      maxWidth:R.ipad?780:600,margin:"0 auto"}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header */}
      <div style={{textAlign:"center",marginBottom:R.pad}}>
        <h1 style={{fontSize:R.font.lg+2,fontWeight:700,letterSpacing:3,textTransform:"uppercase",color:"#94a3b8",margin:0}}>{song.title} - Piano</h1>
        <p style={{fontSize:R.font.xs+1,color:"#475569",margin:"3px 0 0"}}>{song.artist} | 4 semaines pour gagner ton pari</p>
      </div>

      {/* Song selector (ready for multiple songs) */}
      {songKeys.length>1&&<div style={{display:"flex",gap:R.gap,justifyContent:"center",marginBottom:R.pad}}>
        {songKeys.map(k=><button key={k} onClick={()=>{setSongId(k);setLes(0)}} style={{
          padding:`${R.ipad?10:7}px ${R.ipad?20:14}px`,borderRadius:R.rad,fontSize:R.font.sm,fontFamily:"inherit",fontWeight:600,cursor:"pointer",minHeight:R.btn.min,
          border:k===songId?`2px solid ${SONGS[k].color}`:"1px solid #334155",background:k===songId?`${SONGS[k].color}22`:"transparent",
          color:k===songId?SONGS[k].color:"#64748b"}}>{SONGS[k].title}</button>)}</div>}

      <Timer R={R}/>

      {/* Lesson tabs */}
      <div style={{display:"flex",gap:R.ipad?5:3,marginBottom:R.pad,overflowX:"auto",paddingBottom:2}}>
        {song.lessons.map((l,i)=>{const dn=l.goals.every((_,gi)=>done.has(`${songId}-${i}-${gi}`));const ac=i===les;
          return(<button key={i} onClick={()=>setLes(i)} style={{
            flex:"1 0 0",minWidth:0,padding:R.tab.p,borderRadius:R.rad-2,cursor:"pointer",fontFamily:"inherit",textAlign:"center",
            border:ac?"1px solid #6366f1":"1px solid rgba(255,255,255,.05)",background:ac?"rgba(99,102,241,.1)":"rgba(255,255,255,.02)",
            opacity:ac?1:.5,transition:"all .2s",minHeight:R.btn.min}}>
            <div style={{fontSize:R.tab.icon,marginBottom:1}}>{dn?<span style={{color:"#10b981"}}>✓</span>:l.icon}</div>
            <div style={{fontSize:R.tab.f,fontWeight:600,color:ac?"#818cf8":"#64748b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.t}</div>
          </button>)})}
      </div>

      {/* Lesson header */}
      <div style={{padding:R.pad,borderRadius:R.rad,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginBottom:R.pad}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <div><div style={{fontSize:R.font.md,fontWeight:700,color:"#e2e8f0"}}>{L.t}</div><div style={{fontSize:R.font.sm,color:"#64748b"}}>{L.s}</div></div>
          <div style={{fontSize:R.font.xs,color:"#475569"}}>{L.wk}</div></div>
        <div style={{marginTop:R.gap+2}}>
          {L.goals.map((g,i)=>{const d=done.has(`${songId}-${les}-${i}`);return(
            <div key={i} onClick={()=>tog(i)} style={{display:"flex",alignItems:"center",gap:R.gap+2,padding:`${R.ipad?5:3}px 0`,cursor:"pointer"}}>
              <div style={{width:R.ipad?18:14,height:R.ipad?18:14,borderRadius:4,flexShrink:0,border:d?"none":"1px solid #334155",background:d?"#10b981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:R.font.xs,color:"#fff"}}>{d&&"✓"}</div>
              <div style={{fontSize:R.font.sm,color:d?"#64748b":"#94a3b8",textDecoration:d?"line-through":"none"}}>{g}</div></div>)})}</div>
        <div style={{marginTop:R.gap+2,padding:`${R.ipad?8:5}px ${R.pad}px`,borderRadius:R.rad-4,background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.15)",fontSize:R.font.sm,color:"#fbbf24",lineHeight:1.6}}>{L.tip}</div>
      </div>

      {/* Active lesson — key forces remount = cleans up intervals */}
      <LessonComp key={`${songId}-${les}`} song={song} R={R} a={au} pitch={pitch} midi={midi} detNote={detNote} midiNotes={midi.activeNotes}/>

      {/* Nav */}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:R.pad+4,padding:"0 2px"}}>
        <Btn onClick={()=>setLes(Math.max(0,les-1))} disabled={les===0} style={{padding:`${R.ipad?8:6}px ${R.ipad?16:12}px`,color:les===0?"#334155":"#94a3b8",opacity:les===0?.4:1}}>← Précédente</Btn>
        <Btn onClick={()=>setLes(Math.min(song.lessons.length-1,les+1))} disabled={les>=song.lessons.length-1} style={{
          padding:`${R.ipad?8:6}px ${R.ipad?16:12}px`,
          border:les>=song.lessons.length-1?"1px solid #334155":"1px solid #6366f1",
          background:les>=song.lessons.length-1?"transparent":"#6366f122",
          color:les>=song.lessons.length-1?"#334155":"#818cf8",opacity:les>=song.lessons.length-1?.4:1}}>Suivante →</Btn>
      </div>
    </div>);
}
