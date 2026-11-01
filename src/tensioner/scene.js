import * as T from '../../vendor/three/build/three.module.js';
import {mesh} from '../stage/bodies.js';
import {applyBindings,validateBindings} from '../bindings.js';

const brass=()=>new T.MeshStandardMaterial({color:0xb89c65,metalness:.75,roughness:.3});
export function createTensionerScene(){
 const root=new T.Group(),metal=brass(),dark=new T.MeshStandardMaterial({color:0x203632,metalness:.6,roughness:.4});
 mesh(new T.BoxGeometry(6.5,.16,1.8),dark,root,[.3,.08,0]);
 const anchor=mesh(new T.BoxGeometry(.2,.8,.45),metal,root,[-2.4,.55,0]);
 const carriage=new T.Group();carriage.position.set(.8,.8,0);root.add(carriage);
 mesh(new T.BoxGeometry(.25,.65,.55),metal,carriage);
 mesh(new T.BoxGeometry(1.5,.08,.18),metal,root,[1,.24,0]);
 const carrier=mesh(new T.CylinderGeometry(.018,.018,1,16),metal,root);carrier.rotation.z=Math.PI/2;
 const glow=new T.MeshStandardMaterial({color:0x83cabb,emissive:0x83cabb,emissiveIntensity:0,transparent:true,opacity:.23,roughness:.25,depthWrite:false});
 const halo=mesh(new T.CylinderGeometry(1,1,1,32),glow,root);halo.rotation.z=Math.PI/2;
 const wheel=new T.Group();wheel.position.set(2.6,1.15,0);root.add(wheel);
 mesh(new T.CylinderGeometry(.07,.07,1.05,20),metal,root,[2.6,.6,0]);
 mesh(new T.TorusGeometry(.65,.07,12,64),metal,wheel);
 mesh(new T.CylinderGeometry(.12,.12,.2,20),metal,wheel).rotation.x=Math.PI/2;
 const arm=new T.Group();wheel.add(arm);
 mesh(new T.BoxGeometry(.55,.05,.06),metal,arm,[-.275,0,.13]);
 const pin=mesh(new T.SphereGeometry(.09,16,12),metal,arm,[-.55,0,.13]);
 const disc=mesh(new T.CircleGeometry(.61,64),new T.MeshBasicMaterial({color:0x83cabb,transparent:true,opacity:.2,side:T.DoubleSide,depthWrite:false}),wheel,[0,0,.08]);
 const rod=mesh(new T.CylinderGeometry(.035,.035,1,12),metal,root);
 const scene={root,anchor,carriage,carrier,halo,wheel,arm,pin,disc,rod};
 updateLinks(scene);return scene;
}
function connect(object,a,b){
 const delta=b.clone().sub(a);object.position.copy(a).add(b).multiplyScalar(.5);
 object.scale.y=delta.length();object.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
}
function updateLinks(scene){
 const left=new T.Vector3(-2.4,.8,0),right=new T.Vector3(scene.carriage.position.x,.8,0);
 connect(scene.carrier,left,right);connect(scene.halo,left,right);
 // A control link, not a rigid mechanical constraint or a force simulation.
 const control=new T.Vector3(scene.wheel.position.x-.55,scene.wheel.position.y,.13);
 if(scene.arm.visible){control.set(-.55*Math.cos(scene.arm.rotation.z),-.55*Math.sin(scene.arm.rotation.z),.13).add(scene.wheel.position);}
 connect(scene.rod,right,control);
}

const inputs=['fm.carrierHz','fm.ratio','fm.index','fm.indexDecayS','fm.ampDecayS'];
export const TENSIONER_BINDINGS=validateBindings([
 {id:'fm/pull',target:'fm/tensioner',param:'pull',field:'stage.tensioner.pull',inputs,map:v=>.8+.4*v,label:'interpreted',note:'Carriage travel follows the remaining modulation envelope; no physical tension or back-reaction is simulated.'},
 {id:'fm/width',target:'fm/carrier',param:'width',field:'stage.tensioner.bandwidth',inputs,map:v=>.018+.06*Math.log2(1+v/220),label:'interpreted',note:'String halo radius is .018 + .06 log2(1 + estimated occupied bandwidth / 220 Hz). This is a bandwidth estimate, not displacement.'},
 {id:'fm/glow',target:'fm/carrier',param:'glow',field:'stage.tensioner.amplitude',inputs:[...inputs,'fm.level'],map:v=>5*v,label:'interpreted',note:'Carrier glow follows the output amplitude envelope.'},
 {id:'fm/angle',target:'fm/wheel',param:'angle',field:'stage.tensioner.angle',inputs,map:v=>v,label:'interpreted',note:'Phase is shown only below 8 Hz; fast modulation has no sampled slow rotation.'},
 {id:'fm/slow',target:'fm/wheel',param:'slow',field:'stage.tensioner.slow',inputs,label:'interpreted',note:'The phase arm is hidden at audio rates.'},
 {id:'fm/fast',target:'fm/wheel',param:'fast',field:'stage.tensioner.fast',inputs,label:'interpreted',note:'A static translucent disc denotes modulation too fast to display as rotation.'},
]);
export function tensionerSceneFrame(state,{active=true}={}){
 const sounding=active&&state.amplitude>0,slow=sounding&&Number.isFinite(state.modulatorPhase01);
 return {stage:{tensioner:{pull:sounding?state.tension01:0,bandwidth:sounding?state.bandwidthEstimateHz:0,amplitude:sounding?state.amplitude:0,angle:slow?state.modulatorPhase01*Math.PI*2:0,slow,fast:sounding&&!slow}}};
}
export function applyTensionerScene(frame,scene){
 const applied=applyBindings(frame,TENSIONER_BINDINGS,(target,param,value)=>{
  if(param==='pull')scene.carriage.position.x=value;
  else if(param==='width'){scene.halo.scale.x=value;scene.halo.scale.z=value;}
  else if(param==='glow')scene.halo.material.emissiveIntensity=value;
  else if(param==='angle')scene.arm.rotation.z=value;
  else if(param==='slow')scene.arm.visible=value;
  else if(param==='fast')scene.disc.visible=value;
 });
 updateLinks(scene);return applied;
}
