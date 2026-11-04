import {createEnsembleJourneyView} from './ensemble-journey-view.js';
import {createContinuousEnsembleReplayVisual} from './continuous-ensemble-replay-visual.js';
// This page and its embedded records are generated together after full offline
// admission. No arbitrary uploads or remote chapter JSON are accepted here.
const audio=document.querySelector('audio'),details=document.getElementById('journey-picture'),motion=document.getElementById('journey-motion'),status=document.getElementById('journey-picture-status');
motion.checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;
try{
 const records=JSON.parse(document.getElementById('journey-chapters').textContent),identity=new URL('journey.wav',location.href).href;
 const visual=createContinuousEnsembleReplayVisual({audio,canvas:document.getElementById('journey-canvas'),motion,cues:document.getElementById('journey-cues'),disclosures:[details],status,getPrepared:()=>({identity,record:records}),createModels:createEnsembleJourneyView});
 window.addEventListener('pagehide',()=>visual.clear());
}catch{status.textContent='The instrument picture is unavailable. Listening still works.';}
