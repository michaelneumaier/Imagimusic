import {setupEnsembleJourneyControls} from './ensemble-journey-controls.js';
import {createEnsembleJourneyView} from './ensemble-journey-view.js';
import {createContinuousEnsembleReplayVisual} from './continuous-ensemble-replay-visual.js';
// This page and its embedded records are generated together after full offline
// admission. No arbitrary uploads or remote chapter JSON are accepted here.
const audio=document.querySelector('audio'),details=document.getElementById('journey-picture'),motion=document.getElementById('journey-motion'),status=document.getElementById('journey-picture-status');
const $=id=>document.getElementById(id);let personal=null,visual=null;
motion.checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;
try{
 const records=JSON.parse(document.getElementById('journey-chapters').textContent),identity=new URL('journey.wav',location.href).href;
 visual=createContinuousEnsembleReplayVisual({audio,canvas:document.getElementById('journey-canvas'),motion,cues:document.getElementById('journey-cues'),disclosures:[details],status,getPrepared:()=>audio.src===identity?{identity,record:records}:personal?.prepared,createModels:createEnsembleJourneyView});

}catch{status.textContent='The instrument picture is unavailable. Listening still works.';}

try{
 personal=setupEnsembleJourneyControls({audio,beforePrepare:()=>visual?.clear(),elements:{pads:[0,1,2].map(i=>$(`personal-pad-${i}`)),reset:$('personal-reset'),prepare:$('personal-prepare'),cancel:$('personal-cancel'),listen:$('personal-listen'),status:$('personal-status'),wav:$('personal-wav'),chapters:[1,2,3].map(i=>$(`personal-chapter-${i}`))}});
}catch{$('personal-status').textContent='Personal preparation is unavailable. The offered journey still works.';}

window.addEventListener('pagehide',()=>{personal?.stop();visual?.clear();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)personal?.stop();});
