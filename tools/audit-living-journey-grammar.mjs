import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createLivingGeneratedPhrase} from '../src/living/generative-phrase.js';
import {createLivingJourneyStudy} from '../src/living/journey-study.js';
import {createLivingConnectedJourneyStudy} from '../src/living/connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';
import {createLivingJourneyChoreography} from '../src/living/journey-choreography.js';

const pulse=[10560,12000,13440,14880],motifs=[[0,1,3],[0,2,3],[0,1,2]],accents=[[.1,.025,.05],[.05,.025,.1],[.1,.05,.025]],gaps=[5,6,7],variations=['repeat','linger','soften'];
const key=p=>JSON.stringify([p.pulseFrames,p.motif,p.accents,p.repeatOffsetTicks,p.variation]);
const expected=new Set();
for(const p of pulse)for(const m of motifs)for(const a of accents)for(const g of gaps)for(const v of variations)expected.add(JSON.stringify([p,m,a,g,v]));
const representatives=new Map();let searched=0;
for(let i=0;i<20000&&representatives.size<expected.size;i++){
 const seed=Math.imul(i,0x9e3779b1)>>>0,p=createLivingGeneratedPhrase(seed),signature=key(p);searched++;
 if(!expected.has(signature))throw Error('Grammar changed beyond this audit contract.');
 if(!representatives.has(signature))representatives.set(signature,p);
}
if(representatives.size!==expected.size)throw Error(`Incomplete coverage: ${representatives.size}/${expected.size}`);
const cases=[],sourceIdentities=new Set();
for(const p of representatives.values()){
 sourceIdentities.add(JSON.stringify(p.source));
 for(const [treatment,make] of Object.entries({chapters:createLivingJourneyStudy,connected:createLivingConnectedJourneyStudy,evolving:createLivingEvolvingJourneyStudy})){
  const journey=make(p.seed),c=createLivingJourneyChoreography(journey);
  const touches=c.score.passes.reduce((n,p)=>n+p.touches.length,0),assignments=c.plans.flatMap(p=>p.actors.flatMap(a=>a.assignments));
  if(assignments.length!==touches||c.plans.some(p=>p.unplanned.length))throw Error('A source touch has no performer.');
  const events=new Map(c.score.passes.flatMap(p=>p.touches.map((e,i)=>[`${p.id}:${i}`,e]))),seen=new Set();
  for(const assignment of assignments){
   const event=events.get(assignment.eventId);
   if(!event||seen.has(assignment.eventId)||assignment.noteOn!==event.frame/journey.sampleRate||assignment.velocity!==event.strength)throw Error('A performer changed or duplicated a source touch.');
   seen.add(assignment.eventId);
  }
  if(JSON.stringify(journey.sections[0].source)!==JSON.stringify(journey.sections.at(-1).source))throw Error('Original return changed.');
  for(const instance of c.allocation.instances){
   const passes=instance.passIds.map(id=>c.score.passes.find(p=>p.id===id));
   for(let i=1;i<passes.length;i++)if(passes[i].startFrame<passes[i-1].endFrame)throw Error('Independent passes share an instance while overlapping.');
  }
  const wavBytes=44+journey.frames*4;if(wavBytes>64*1024*1024)throw Error('Worker WAV limit exceeded.');
  cases.push({seed:p.seed,signature:key(p),treatment,seconds:journey.frames/journey.sampleRate,wavBytes,touches,actors:c.actors.length,instances:c.allocation.instances.length});
 }
 if(cases.length%90===0)console.log(`Audited ${cases.length}/${expected.size*3} journey plans.`);
}
const summary={grammar:1,possibleTuples:expected.size,representedTuples:representatives.size,seedsSearched:searched,distinctSourceRecords:sourceIdentities.size,journeyPlans:cases.length,treatments:Object.fromEntries(['chapters','connected','evolving'].map(t=>{
 const group=cases.filter(c=>c.treatment===t),range=field=>[Math.min(...group.map(c=>c[field])),Math.max(...group.map(c=>c[field]))];
 return [t,{seconds:range('seconds'),wavBytes:range('wavBytes'),actors:range('actors'),instances:range('instances'),touches:range('touches')}];
}))};
const directory=resolve(process.argv[2]??'renders/living-journey-study');mkdirSync(directory,{recursive:true});
writeFileSync(resolve(directory,'grammar-audit.json'),JSON.stringify({summary,limits:'Complete coverage of the324declared grammar1 parameter tuples via actual representative seeds, with all three current deterministic journey plans admitted. Does not enumerate every uint32seed, establish a seed distribution, count perceptually distinct music, render all audio, establish clipping/loudness/appeal, inspect full visual response bounds or prove browser/GPU behavior. Seeds beyond these tuples cannot create additional grammar1 source records because only these five choices affect the source. Seed identity is not musical novelty. Instances are independent rendered passes, not shared physical state.',cases},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
