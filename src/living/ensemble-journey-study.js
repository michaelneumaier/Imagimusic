import {createContinuousEnsembleStudy} from './continuous-ensemble-study.js';

/** A three-chapter authored grammar. Each chapter starts from rest and has its
 * own captured ending; the long presentation joins those complete recordings.
 * A seed varies the opening rhythm/accent, not the form or instrument family. */
export function createEnsembleJourneyStudy(seed=42,{sampleRate=48000}={}){
 const source=createContinuousEnsembleStudy(seed,{sampleRate}),opening=source.sections[0].events;
 const motif=opening.map(e=>({time:(e.frame-opening[0].frame)/sampleRate,strength:e.strength}));
 const chapters=[];
 function chapter(name,compose){
  const events=[];
  const phrase=(start,{voices=[0,0,0],stretch=1,gain=1,indices=[0,1,2],reverse=false}={})=>{
   const span=motif.at(-1).time;
   for(const i of indices){const note=motif[i];events.push({frame:Math.round((start+(reverse?span-note.time:note.time)*stretch)*sampleRate),body:voices[i],strength:note.strength*gain});}
  };
  compose(phrase);events.sort((a,b)=>a.frame-b.frame||a.body-b.body);
  const records=source.bodies.map((design,body)=>({kind:'imagimusic-continuous-tine-record',version:1,design,sampleRate,fadeStart:48*sampleRate-Math.round(.025*sampleRate),events:events.filter(e=>e.body===body).map(({frame,strength})=>({frame,strength,origin:'score'}))}));
  chapters.push({name,events,record:{kind:'imagimusic-continuous-ensemble-record',version:1,mixGain:1/3,records}});
 }
 chapter('Arrival',p=>{
  p(2);p(9,{gain:.75});p(16,{voices:[1,1,1],gain:.65});
  p(24,{voices:[0,1,2],stretch:1.5,gain:.7});
  p(33,{voices:[2,2,2],indices:[1,2],stretch:2,gain:.5});
  p(41,{indices:[0],gain:.6});
 });
 chapter('Wandering',p=>{
  p(2,{voices:[1,2,0],stretch:2,gain:.6});
  p(10,{voices:[2,0,1],reverse:true,stretch:1.4,gain:.7});
  p(18,{voices:[0,1,2],stretch:.85,gain:.8});
  p(19.8,{voices:[2,0,1],stretch:1.3,gain:.5});
  p(27,{voices:[1,2,0]});p(28.7,{voices:[2,0,1],gain:.65});
  p(35,{voices:[2,1,0],reverse:true,stretch:2,gain:.5});
  p(42,{voices:[1,1,1],indices:[0],gain:.35});
 });
 chapter('Homecoming',p=>{
  p(2,{voices:[2,1,0],stretch:2,gain:.45});
  p(12,{voices:[1,1,1],stretch:1.5,gain:.6});
  p(22,{voices:[0,1,0],stretch:1.25,gain:.75});
  p(32);p(40);
 });
 return {kind:'imagimusic-ensemble-journey-study',version:1,seed,sampleRate,seconds:144,motif,chapters};
}
