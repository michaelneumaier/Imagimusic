import {createEnsembleEndingView} from './ensemble-ending-view.js';
import {createContinuousEnsembleReplayVisual} from './continuous-ensemble-replay-visual.js';
import {setupJourneyPresentation} from './ensemble-journey-presentation.js';
const $=id=>document.getElementById(id),audio=document.querySelector('audio'),motion=$('journey-motion'),details=$('journey-picture');
motion.checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;
let visual=null;
try{
 const {records,checkpoints,entries=['original','gentler','modeled'].map(name=>({file:name+'.wav',treatment:name}))}=JSON.parse($('ending-view-source').textContent),identities=new Map(entries.map(entry=>[new URL(entry.file,location.href).href,entry]));
 visual=createContinuousEnsembleReplayVisual({audio,canvas:$('journey-canvas'),motion,cues:$('journey-cues'),disclosures:[details],status:$('journey-picture-status'),createModels:createEnsembleEndingView,getPrepared:()=>{const entry=identities.get(audio.src);return entry?{identity:audio.src,record:{records,checkpoints,treatment:entry.treatment}}:null;}});
 audio.addEventListener('play',()=>{$('ending-reading').textContent=identities.get(audio.src)?.description??({original:'Original: the bodies retain their natural modeled decay until the short captured ending.',gentler:'Output fade: the sound grows quieter, while these bodies keep their original vibration. The fade changes only the signal.',modeled:'Modeled loss: added distributed damping reduces the vibration itself. Sound and response bounds follow that same changed state.'})[identities.get(audio.src)?.treatment]??'Choose a comparison to see its matching response.';});
}catch{$('journey-picture-status').textContent='The response picture is unavailable. The listening comparison still works.';}
window.addEventListener('pagehide',()=>visual?.clear());
setupJourneyPresentation({root:document.body,audio,toggle:$('journey-settle'),pause:$('journey-pause'),secondaryDetails:[...document.querySelectorAll('main>details:not(#journey-picture)')]});
