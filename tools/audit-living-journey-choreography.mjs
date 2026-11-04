import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createLivingJourneyStudy} from '../src/living/journey-study.js';
import {createLivingConnectedJourneyStudy} from '../src/living/connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';
import {createLivingJourneyChoreography} from '../src/living/journey-choreography.js';

const cases=[];
for(const [treatment,make] of Object.entries({chapters:createLivingJourneyStudy,connected:createLivingConnectedJourneyStudy,evolving:createLivingEvolvingJourneyStudy}))for(const seed of [0,42,2950288811,0xffffffff]){
 const journey=make(seed),c=createLivingJourneyChoreography(journey);
 const overlaps=c.score.passes.flatMap((a,i)=>c.score.passes.slice(i+1).filter(b=>a.bodyMm===b.bodyMm).flatMap(b=>{
  const start=Math.max(a.startFrame,b.startFrame),end=Math.min(a.endFrame,b.endFrame);
  const bothTouchedStart=Math.max(start,a.touches[0].frame,b.touches[0].frame);
  return end>start?[{passes:[a.id,b.id],bodyMm:a.bodyMm,startFrame:start,endFrame:end,afterBothFirstTouchesFrames:Math.max(0,end-bothTouchedStart)}]:[];
 }));
 const assignments=c.plans.flatMap(p=>p.actors.flatMap(a=>a.assignments));
 const sameInstancePassOverlaps=overlaps.filter(o=>c.allocation.assignments.find(a=>a.passId===o.passes[0]).instance===c.allocation.assignments.find(a=>a.passId===o.passes[1]).instance);
 cases.push({treatment,seed,seconds:journey.frames/journey.sampleRate,voices:c.score.passes.length,touches:c.score.passes.reduce((n,p)=>n+p.touches.length,0),assigned:assignments.length,unplanned:c.plans.reduce((n,p)=>n+p.unplanned.length,0),allocation:c.allocation,actors:c.actors,shortenedRecoveries:assignments.filter(a=>a.truncated).length,sameBodyPassOverlaps:overlaps,sameInstancePassOverlaps});
}
const directory=resolve(process.argv[2]??'renders/living-journey-study');mkdirSync(directory,{recursive:true});
writeFileSync(resolve(directory,'choreography-audit.json'),JSON.stringify({limits:'Twelve score cases; exact accepted touches, artistic stationary striker allocation, and complete rendered-pass interval overlap. Zero pass overlaps does not establish shared physical state, acoustic silence, screen visibility, camera framing or visual appeal. Lane geometry follows prior staging; no full 3D mesh collision or native browser test. Shortened recoveries are explicitly planned, not dropped contacts. No saved presentation or production scene adoption.',cases},null,2)+'\n');
console.log(JSON.stringify(cases.map(({actors,allocation,sameBodyPassOverlaps,sameInstancePassOverlaps,...rest})=>({...rest,actors:actors.length,instances:allocation.instances.length,sameBodyPassOverlaps:sameBodyPassOverlaps.length,sameInstancePassOverlaps:sameInstancePassOverlaps.length})),null,2));
