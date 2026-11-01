const $=id=>document.getElementById(id),sound=$('sound'),root='renders/variant-first-pair/';
let selected=null,operation=0;
function status(text){$('status').textContent=text;}
function quiet(){operation++;sound.pause();$('quiet').disabled=true;}
for(const version of ['original','changed'])$(version).onclick=async()=>{
 quiet();const own=operation;selected=version;sound.src=root+version+'.wav';$('quiet').disabled=false;status(`Listening to the ${version} instrument.`);
 try{await sound.play();}catch(error){if(own===operation){$('quiet').disabled=true;status('This sound could not play. Try choosing the version again.');}}
};
$('quiet').onclick=()=>{quiet();status('Quiet. Choose either version when you’re ready.');};
sound.addEventListener('ended',()=>{$('quiet').disabled=true;status(`The ${selected} version has settled. Return to either version when you’re ready.`);});
sound.addEventListener('error',()=>{$('quiet').disabled=true;status('This local sound is unavailable.');});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();$('quiet').click();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){quiet();if(selected)status('Quiet. Choose either version when you’re ready.');}});window.addEventListener('pagehide',quiet);
window.addEventListener('pageshow',e=>{if(e.persisted)status('Welcome back. Choose a version when you’re ready.');});
try{
 const response=await fetch(root+'report.json');if(!response.ok)throw new Error('Missing comparison');const report=await response.json();
 if(report.sourceGain!==report.targetGain||report.change.bridge.join(',')!=='0,1'||Math.abs(report.change.after/report.change.before-1.2)>1e-10)throw new Error('Unexpected comparison');
 $('facts').textContent=`Two versions of one ${(report.samples/report.sampleRate).toFixed(2)}-second gesture. One bridge is 20% stiffer; timing and sound level settings stay the same.`;
 $('original').disabled=$('changed').disabled=false;
}catch{status('This local comparison is unavailable. You can still play in Rest.');$('facts').textContent='Comparison not loaded.';}
