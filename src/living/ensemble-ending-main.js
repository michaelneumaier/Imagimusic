import {createEnsembleEndingView} from './ensemble-ending-view.js';
import {createContinuousEnsembleReplayVisual} from './continuous-ensemble-replay-visual.js';
import {setupJourneyPresentation} from './ensemble-journey-presentation.js';
const $=id=>document.getElementById(id),audio=document.querySelector('audio'),motion=$('journey-motion'),details=$('journey-picture');
motion.checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;
let visual=null;
try{
 const {records,checkpoints}=JSON.parse($('ending-view-source').textContent),identities=new Map(['original','gentler','modeled'].map(name=>[new URL(name+'.wav',location.href).href,name]));
 visual=createContinuousEnsembleReplayVisual({audio,canvas:$('journey-canvas'),motion,cues:$('journey-cues'),disclosures:[details],status:$('journey-picture-status'),createModels:createEnsembleEndingView,getPrepared:()=>{const treatment=identities.get(audio.src);return treatment?{identity:audio.src,record:{records,checkpoints,treatment}}:null;}});
 audio.addEventListener('play',()=>{$('ending-reading').textContent=({original:'Original: the bodies retain their natural modeled decay until the short captured ending.',gentler:'Output fade: the sound grows quieter, while these bodies keep their original vibration. The fade changes only the signal.',modeled:'Modeled loss: added distributed damping reduces the vibration itself. Sound and response bounds follow that same changed state.'})[identities.get(audio.src)]??'Choose a comparison to see its matching response.';});
}catch{$('journey-picture-status').textContent='The response picture is unavailable. The listening comparison still works.';}
window.addEventListener('pagehide',()=>visual?.clear());
setupJourneyPresentation({root:document.body,audio,toggle:$('journey-settle'),pause:$('journey-pause'),secondaryDetails:[...document.querySelectorAll('main>details:not(#journey-picture)')]});
