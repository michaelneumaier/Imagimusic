import { stagePosition } from './layout.js';

export const CAMERA_BINDING={id:'camera/pose',target:'camera',param:'pose',field:'stage.camera',inputs:[],label:'interpreted',note:'Timeline camera choreography; it changes framing, never sound.'};
/** Analytic, seek-safe choreography. No frame history, easing accumulators or wall clock. */
export function createDirector(passage){
  const gestures=passage.events.map(({family,voice})=>({time:voice.noteOn,weight:voice.velocity,point:stagePosition(family,voice.slot).map((v,i)=>v+(i===1?(family==='tine'?.7:1.5):0))}));
  if(passage.loom)gestures.push(...passage.loom.events.map(e=>({time:e.time,weight:e.velocity,point:stagePosition('loom',e.body).map((v,i)=>v+(i===1?1:0))})));
  return (t,mode='manual',manual={position:[9,6.5,12],target:[0,1,0]})=>{
    if(mode==='manual')return {position:[...manual.position],target:[...manual.target]};
    if(mode==='establish'){
      const angle=.64+.13*Math.sin(t*.12);
      return {position:[Math.sin(angle)*15,6.5+.3*Math.sin(t*.1),Math.cos(angle)*15],target:[0,1,0]};
    }
    if(mode==='detail'){
      const phase=.5-.5*Math.cos(Math.min(Math.max(t/passage.duration,0),1)*Math.PI);
      return {position:[3-phase,3-.6*phase,8-.8*phase],target:[-.3,.75,4.1]};
    }
    if(mode!=='follow')throw new Error('Unknown camera direction: '+mode);
    // Smooth score attention anticipates nearby attacks, then settles to the ensemble.
    const target=[0,.25,0];let total=.25;
    for(const gesture of gestures){const distance=(t+.18-gesture.time)/.7,weight=gesture.weight*Math.exp(-.5*distance*distance);total+=weight;for(let i=0;i<3;i++)target[i]+=gesture.point[i]*weight;}
    for(let i=0;i<3;i++)target[i]/=total;
    return {target,position:[target[0]+7,6.1,target[2]+9]};
  };
}
