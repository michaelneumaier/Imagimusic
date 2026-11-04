import {createContinuousEnsembleStudy} from '../src/living/continuous-ensemble-study.js';
// Spread deterministic probes over uint32 instead of assuming adjacent seeds
// explore the first xorshift draw evenly. This measures score identity only.
function describe(seed){
 const plan=createContinuousEnsembleStudy(seed),opening=plan.sections[0].events;
 return {seed,gapsSeconds:opening.slice(1).map((event,i)=>(event.frame-opening[i].frame)/plan.sampleRate),accents:opening.map(event=>event.strength)};
}
let state=0x6d2b79f5;const scores=new Map(),adjacent=new Set();
for(let i=0;i<4096;i++){
 state=(Math.imul(state,1664525)+1013904223)>>>0;
 const key=JSON.stringify(createContinuousEnsembleStudy(state).events);
 if(!scores.has(key))scores.set(key,describe(state));
 adjacent.add(JSON.stringify(createContinuousEnsembleStudy(i).events));
}
const offered=[42,3911836942,3382146154].map(describe);
if(scores.size!==27||new Set(offered.map(item=>item.gapsSeconds[0])).size!==3)throw Error('The measured score family or offered gaps changed; inspect the grammar before updating this report.');
console.log(JSON.stringify({kind:'imagimusic-continuous-ensemble-variety',version:1,sampling:{count:4096,start:0x6d2b79f5,multiplier:1664525,increment:1013904223,modulus:4294967296},distinctFullScores:scores.size,adjacentSeeds:{first:0,last:4095,distinctFullScores:adjacent.size},previouslyOffered:[42,2950288811,4294967295].map(describe),offered,representatives:[...scores.values()],scope:'Exact event-list identity at48kHz. The authored grammar has three first gaps, three second gaps and three accent patterns; these probes reach all27combinations. Voice routing, body designs, eight-section form and duration remain fixed. Distinct timing/accent data do not establish perceptual variety, preference or long-session appeal. Existing seed meanings and saved records are unchanged.'},null,2));
