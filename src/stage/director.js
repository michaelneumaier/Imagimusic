import {beatSeconds} from '../score/conversation.js';
import { stagePosition } from './layout.js';

export const CAMERA_BINDING={id:'camera/pose',target:'camera',param:'pose',field:'stage.camera',inputs:[],label:'interpreted',note:'Timeline camera choreography; it changes framing, never sound.'};
/** Analytic, seek-safe choreography. No frame history, easing accumulators or wall clock. */
export function createDirector(passage){
  const gestures=passage.events.map(({family,voice})=>({time:voice.noteOn,weight:voice.velocity,point:stagePosition(family,voice.slot).map((v,i)=>v+(i===1?(family==='tine'?.7:1.5):0))}));
  if(passage.loom)gestures.push(...passage.loom.events.map(e=>({time:e.time,weight:e.velocity,point:stagePosition('loom',e.body).map((v,i)=>v+(i===1?1:0))})));
  if(passage.fm)gestures.push({time:passage.fm.time,weight:.7,point:stagePosition('fm').map((v,i)=>v+(i===1?.8:0))});
  const sections=passage.score?.sections.map(section=>({...section,start:beatSeconds(passage.score,section.beats[0]),end:beatSeconds(passage.score,section.beats[1])}));
  return function direct(t,mode='manual',manual={position:[9,6.5,12],target:[0,1,0]}){
    if(mode==='manual')return {position:[...manual.position],target:[...manual.target]};
    if(mode==='establish'){
      const angle=.64+.13*Math.sin(t*.12);
      return {position:[Math.sin(angle)*15,6.5+.3*Math.sin(t*.1),Math.cos(angle)*15],target:[0,1,0]};
    }
    if(mode==='detail'){
      const phase=.5-.5*Math.cos(Math.min(Math.max(t/passage.duration,0),1)*Math.PI);
      return {position:[3-phase,3-.6*phase,8-.8*phase],target:[-.3,.75,4.1]};
    }
    if(mode==='cinematic'){
      const attention=direct(t,'follow'),beat=60/(passage.score?.tempo??passage.patch.tempo);
      // A sixteen-beat arc and eight-beat breath, both anchored to score time.
      // Broad framing and restrained target motion keep the whole mechanism readable.
      const musicalTime=t-(passage.score?.lead??0),phase=musicalTime/(16*beat)*Math.PI*2;
      const angle=.48+.22*Math.sin(phase),breath=.5-.5*Math.cos(phase*2);
      const radius=16.5+.65*breath,target=attention.target.map((v,i)=>i===1?1+(v-1)*.4:v*.4);
      return {target,position:[target[0]+Math.sin(angle)*radius,7.2+.45*Math.sin(phase*.5),target[2]+Math.cos(angle)*radius]};
    }
    if(mode!=='follow')throw new Error('Unknown camera direction: '+mode);
    if(sections){
      // Smoothly blend cadence parameters over one beat, extending the first/last into pre-roll/tail.
      const parameters=[0,0,0,0,0,0],tau=60/passage.score.tempo;
      let sum=0;
      const sigmoid=x=>.5+.5*Math.tanh(x);
      sections.forEach((section,index)=>{
        const weight=(index===0?1:sigmoid((t-section.start)/tau))*(index===sections.length-1?1:sigmoid((section.end-t)/tau));
        const progress=Math.max(0,Math.min(1,(t-section.start)/(section.end-section.start))),ease=.5-.5*Math.cos(Math.PI*progress);
        // Unknown authored cadences use neutral answer framing; timing remains authoritative.
        const values=section.cadence==='anticipation'?[.45,1,1.2,10,8.2,13]:section.cadence==='settling'?[.1,1.2,1+ease,7+3*ease,6.1+1.5*ease,9+4*ease]:[.18,.7,.25,7,6.1,9];
        sum+=weight;values.forEach((value,i)=>parameters[i]+=value*weight);
      });
      const [lead,width,prior,x,height,z]=parameters.map(value=>value/sum);
      const target=[0,prior,0];let total=prior;
      for(const gesture of gestures){const distance=(t+lead-gesture.time)/width,weight=gesture.weight*Math.exp(-.5*distance*distance);total+=weight;for(let i=0;i<3;i++)target[i]+=gesture.point[i]*weight;}
      for(let i=0;i<3;i++)target[i]/=total;
      return {target,position:[target[0]+x,height,target[2]+z]};
    }
    // Legacy path retains its exact arithmetic and evaluation order.
    // Smooth score attention anticipates nearby attacks, then settles to the ensemble.
    const target=[0,.25,0];let total=.25;
    for(const gesture of gestures){const distance=(t+.18-gesture.time)/.7,weight=gesture.weight*Math.exp(-.5*distance*distance);total+=weight;for(let i=0;i<3;i++)target[i]+=gesture.point[i]*weight;}
    for(let i=0;i<3;i++)target[i]/=total;
    return {target,position:[target[0]+7,6.1,target[2]+9]};
  };
}
