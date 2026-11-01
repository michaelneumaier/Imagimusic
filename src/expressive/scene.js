import * as T from '../../vendor/three/build/three.module.js';
import {choirBody,mesh} from '../stage/bodies.js';
import {expressionFrame} from './performance.js';

export function expressionSceneFrame(performance,time){
 const frame=expressionFrame(performance,time),byId=new Map(frame.voices.map(v=>[v.voiceId,v]));
 return {...frame,bodies:performance.voices.map(v=>{
  const live=byId.get(v.voiceId),active=!!live&&!live.retired;
  return {voiceId:v.voiceId,active,detached:active&&live.detached,fill:active?live.fill01:1,aperture:active?live.aperture01:0,level:active?live.gain:0,
   pitchLever:active?Math.max(-.65,Math.min(.65,(live.pitchHcu-v.address.noteNumber)*.12)):0,resonanceScale:active?.9+.2*live.timbre01:1};
 })};
}
export function createExpressionScene(count){
 const root=new T.Group(),bodies=Array.from({length:count},(_,i)=>{
  const body=choirBody(i);body.root.position.set((i-(count-1)/2)*2.25,0,0);root.add(body.root);
  const halo=mesh(new T.TorusGeometry(.68,.018,8,48),new T.MeshBasicMaterial({color:0xadc8a2,transparent:true,opacity:.25}),body.root,[0,.2,0]);halo.rotation.x=Math.PI/2;
  return {...body,halo};
 });
 return {root,bodies};
}
export function applyExpressionScene(frame,scene){
 for(const [i,state] of frame.bodies.entries()){
  const body=scene.bodies[i];body.bellows.scale.y=.45+state.fill*.6;
  body.blades.forEach(({blade})=>{blade.position.x=.12+state.aperture*.24;blade.rotation.z=.65-state.aperture*.7;});
  body.glow.material.opacity=Math.min(.7,state.level*.8);body.horn.material.emissive.setHex(0xaccf80);body.horn.material.emissiveIntensity=state.level*.7;
  body.pendulum.rotation.z=state.pitchLever;body.fastArc.visible=false;body.chamber.scale.setScalar(state.resonanceScale);
  body.halo.material.color.setHex(state.detached?0xefbc79:0xadc8a2);body.halo.material.opacity=state.active?.75:.15;
 }
}
