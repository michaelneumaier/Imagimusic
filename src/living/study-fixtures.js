import {createLivingGreeting} from './greeting.js';
/** Authored controls shared by the sound and visual workshops, never visitor capture. */
export function createLivingStudyFixtures(){
 const greeting=createLivingGreeting();
 const fixture=(times,strengths)=>({...greeting,events:times.map((t,i)=>({frame:Math.round(t*greeting.sampleRate),strength:strengths[i]}))});
 return [{id:'greeting',name:'Three touches',source:greeting},
  {id:'single',name:'One touch',source:fixture([.5],[.1])},
  {id:'crowded',name:'Eight nearby touches',source:fixture([.5,.525,.55,.575,.6,.625,.65,.675],[.05,.025,.025,.025,.025,.025,.025,.05])},
  {id:'spaced',name:'Three distant touches',source:fixture([.3,1.8,3.3],[.1,.025,.05])}];
}
