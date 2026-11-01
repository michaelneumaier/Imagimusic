import * as T from '../../vendor/three/build/three.module.js';
import {mesh} from '../stage/bodies.js';
import {applyBindings,validateBindings} from '../bindings.js';

export function createLoomScene({position=[0,0,1]}={}){
const root=new T.Group();root.position.fromArray(position);
const brass=new T.MeshStandardMaterial({color:0xb89c65,metalness:.7,roughness:.3});
const bodies=[-2,2].map((x,i)=>{
 const group=new T.Group();group.position.x=x;root.add(group);
 mesh(new T.CylinderGeometry(.7,.8,.12,40),brass,group,[0,.06,0]);
 const material=new T.MeshPhysicalMaterial({color:i?0xb8d69a:0x83cabb,metalness:.25,roughness:.2,transparent:true,opacity:.8,emissive:i?0xb8d69a:0x83cabb,emissiveIntensity:0});
 const body=mesh(new T.SphereGeometry(.6,40,24),material,group,[0,1.35,0]);body.scale.y=1.7;
 mesh(new T.TorusGeometry(.63,.035,10,48),brass,group,[0,1.35,0]);
 const striker=mesh(new T.SphereGeometry(.1,16,12),brass,group,[0,2.7,0]);
 return {body,striker};
});
const points=Array.from({length:161},(_,i)=>{const u=i/160;return new T.Vector3(-1.4+2.8*u,1.35+.11*Math.sin(u*Math.PI*24),.11*Math.cos(u*Math.PI*24));});
const bridge=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0xc7b27d,transparent:true,opacity:.65}));root.add(bridge);
return {root,bodies,bridge};
}

const settingsInputs=['loom.frequency','loom.coupling','loom.detune','loom.loss'];
export const LOOM_BINDINGS=validateBindings([
 ...[0,1].flatMap(i=>[
  {id:`loom/${i}/width`,target:`loom/slot${i}`,param:'width',field:`stage.loom.bodies[${i}].envelope`,map:v=>.8+v*3,inputs:settingsInputs,label:'interpreted',note:'Amplified displacement-envelope width; fast exchange uses mean level.'},
  {id:`loom/${i}/glow`,target:`loom/slot${i}`,param:'glow',field:`stage.loom.bodies[${i}].envelope`,map:v=>v*5,inputs:settingsInputs,label:'interpreted',note:'Displacement-envelope glow, not mechanical energy.'},
  {id:`loom/${i}/striker`,target:`loom/slot${i}`,param:'striker',field:`stage.loom.bodies[${i}].reach`,map:v=>2.7-.23*v,inputs:[],label:'interpreted',note:'Scheduled approach and recovery around the nearest strike; no contact-force simulation.'},
 ]),
 {id:'loom/bridge/opacity',target:'loom/bridge',param:'opacity',field:'stage.loom.bridgeOpacity',inputs:settingsInputs,label:'interpreted',note:'Coupling indicator and response-envelope brightness, not instantaneous energy flow.'},
]);

export function loomSceneFrame(frame,settings,{active=true}={}){
 const bodies=[0,1].map(body=>{
  const hit=frame.strikes.filter(e=>e.body===body).sort((a,b)=>Math.abs(a.age)-Math.abs(b.age))[0],age=hit?.age;
  const reach=age===undefined?0:age<0?Math.max(0,1+age/.18)**2:Math.max(0,1-age/.28)**2;
  return {envelope:active?frame.envelope[body]:0,reach:active?reach:0,eventId:active?hit?.id??null:null};
 });
 return {t:frame.time,stage:{loom:{bodies,averaged:frame.averaged,bridgeOpacity:settings.coupling===0?.08:.25+Math.min(.7,bodies.reduce((sum,b)=>sum+b.envelope,0)*2)}}};
}
export function applyLoomScene(frame,scene){
 return applyBindings(frame,LOOM_BINDINGS,(target,param,value)=>{
  if(target==='loom/bridge'){scene.bridge.material.opacity=value;return;}
  const body=scene.bodies[Number(target.at(-1))];
  if(param==='width')body.body.scale.x=value;
  if(param==='glow')body.body.material.emissiveIntensity=value;
  if(param==='striker')body.striker.position.y=value;
 });
}
