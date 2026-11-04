import {createEnsembleJourneyView} from './ensemble-journey-view.js';
import {createContinuousTineReleaseResponse} from './continuous-tine-release-response.js';

/** Generated study presentation, from offline-admitted source/checkpoints. */
export function createEnsembleEndingView({records,treatment,checkpoints}){
 if(!['original','gentler','modeled'].includes(treatment))throw Error('Unknown ending treatment.');
 const base=createEnsembleJourneyView(records);
 if(treatment!=='modeled')return base; // Output gain does not change vibration.
 if(!Array.isArray(checkpoints)||checkpoints.length!==3||checkpoints.some(c=>!Array.isArray(c)||c.length!==3))throw Error('Ending view needs nine release checkpoints.');
 const releases=records.map((record,chapter)=>record.records.map((body,i)=>createContinuousTineReleaseResponse(body,checkpoints[chapter][i])));
 return {motion:base.motion,view:{...base.view,at(seconds){
  const frame=base.view.at(seconds),local=seconds-frame.chapter*48;
  frame.instances=frame.instances.map((body,i)=>{
   const release=releases[frame.chapter][i];if(local*release.source.sampleRate<release.startFrame)return body;
   const state=release.at(local);return {...body,points:state.points,amplitudesM:state.modes.map(m=>m.amplitudeBoundM),releaseEngaged:true,energyJ:state.energyJ};
  });return frame;
 }}};
}
