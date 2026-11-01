import {bindLocalAudition} from './local-audition-player.js';
const $=id=>document.getElementById(id),root='renders/variant-first-pair/';
const status=text=>{$('status').textContent=text;};
bindLocalAudition({sound:$('sound'),quietButton:$('quiet'),status,choices:['original','changed'].map(id=>({button:$(id),url:root+id+'.wav',label:id==='original'?'Original':'Changed'}))});
try{
 const response=await fetch(root+'report.json');if(!response.ok)throw new Error('Missing comparison');const report=await response.json();
 if(report.sourceGain!==report.targetGain||report.change.bridge.join(',')!=='0,1'||Math.abs(report.change.after/report.change.before-1.2)>1e-10)throw new Error('Unexpected comparison');
 $('facts').textContent=`Two versions of one ${(report.samples/report.sampleRate).toFixed(2)}-second gesture. One bridge is 20% stiffer; timing and sound level settings stay the same.`;
 $('original').disabled=$('changed').disabled=false;
}catch{status('This local comparison is unavailable. You can still play in Rest.');$('facts').textContent='Comparison not loaded.';}
