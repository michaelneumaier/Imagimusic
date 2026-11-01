import {bindLocalAudition} from './local-audition-player.js';
const $=id=>document.getElementById(id),root='renders/adaptation-study/',stages=[{id:'original',step:0,label:'Original'},{id:'once',step:1,label:'After one change'},{id:'thrice',step:3,label:'After three changes'}];
const status=text=>{$('status').textContent=text;};
bindLocalAudition({sound:$('sound'),quietButton:$('quiet'),status,choices:stages.map(s=>({button:$(s.id),url:root+`step-${s.step}.wav`,label:s.label}))});
try{
 const response=await fetch(root+'report.json');if(!response.ok)throw new Error('Missing study');const report=await response.json(),versions=stages.map(s=>report.versions.find(v=>v.step===s.step));
 if(versions.some(v=>!v||!Number.isFinite(v.outputGain)||v.outputGain!==versions[0].outputGain||v.samples!==versions[0].samples)||!Number.isFinite(report.seconds)||report.seconds<=0||report.history.length!==3)throw new Error('Unexpected study');
 $('facts').textContent=`Three versions of the same ${report.seconds.toFixed(2)}-second phrase on Grove ${report.seed}. Five strikes, one resting hand, and the same sound level settings.`;
 $('change-fact').textContent='Spring stiffness, relative to the original after three changes: '+versions[2].couplings.map((b,i)=>`${b.a+1}–${b.b+1}: ${(b.coupling/versions[0].couplings[i].coupling).toFixed(2)}×`).join('; ')+'.';
 stages.forEach(s=>$(s.id).disabled=false);
}catch{status('This local study is unavailable. You can still play in Rest.');$('facts').textContent='Study not loaded.';}
