import * as T from '../../vendor/three/build/three.module.js';
import { planPerformers,performerFrame } from '../perform/planner.js';
import { strikerPose,RECOVERY_SECONDS } from '../excitation.js';
import { stagePosition } from './layout.js';
import { solveKeeperArm } from './keeper-rig.js';

export const KEEPER_BINDING={id:'performers/poses',target:'performers',param:'poses',field:'stage.performers',inputs:['tempo','seed','strikePosition','geometry.lengthM'],label:'interpreted',note:'Motorized Keepers carry the strike gestures; endpoint timing follows each score event.'};
export function createKeeperProjection(passage){
  const voices=new Map(passage.events.filter(e=>e.family!=='bellows').map(e=>[e.voice.id,e.voice]));
  const plans=['garden','tine'].map(family=>planPerformers(passage.events.filter(e=>e.family===family).map(e=>({...e.voice,slot:family==='tine'?0:e.voice.slot})),{family,slots:family==='tine'?1:8,minRecover:RECOVERY_SECONDS,recover:RECOVERY_SECONDS}));
  return t=>({unplanned:plans.flatMap(p=>p.unplanned.map(e=>({...e,family:p.family}))),actors:performerFrame(plans,t).performers.map(actor=>{
    const voice=voices.get(actor.eventId),gesture=voice&&['approach','contact','recover'].includes(actor.phase)?strikerPose(t,voice.noteOn,voice.approach):{reach:0,contact:0};
    const anchor=stagePosition(actor.family,actor.slot),position=voice?.position??passage.patch.strikePosition;
    const local=actor.family==='garden'?[-.38-(1-gesture.reach)*.55,position*(3.35-actor.slot*.21),0]:[.2+position*passage.patch.geometry.lengthM*35,.78+(1-gesture.reach)*.6,0];
    const hand=anchor.map((v,i)=>v+local[i]);
    // A motorized carriage follows height; the two rigid links preserve their lengths.
    const lane=Number(actor.id.split('/').at(-1));
    const shoulder=actor.family==='garden'?[anchor[0]-1,Math.max(.2,hand[1]-.3),anchor[2]-.3-lane*.07]:[hand[0]-.5,.55,anchor[2]-.35];
    const joints=solveKeeperArm(shoulder,hand,.7,.65,[0,0,-1]);
    return {...actor,...joints,contact:gesture.contact};
  })});
}

/** One operator per chamber. The crosshead follows the same envelope-driven top ring. */
export function pumpOperators(chambers){
  return chambers.map((chamber,slot)=>{
    const anchor=stagePosition('bellows',slot),scale=.45+chamber.fill*.6;
    const hand=[anchor[0],.65+.635*scale+.02,anchor[2]];
    const shoulder=[anchor[0]-.65,.95,anchor[2]-.45];
    return {id:`bellows/${slot}`,family:'bellows',slot,eventId:chamber.voiceId,phase:chamber.phase,contact:1-chamber.fill,...solveKeeperArm(shoulder,hand,.7,.65,[0,0,-1])};
  });
}

function keeperBody(pump=false){
  const root=new T.Group(),brass=new T.MeshStandardMaterial({color:0xb89c65,metalness:.7,roughness:.35}),dark=new T.MeshStandardMaterial({color:0x374b41,metalness:.5,roughness:.6});
  function mesh(g,m){const o=new T.Mesh(g,m);o.castShadow=true;root.add(o);return o;}
  const upper=mesh(new T.CylinderGeometry(.025,.035,1,10),brass),lower=mesh(new T.CylinderGeometry(.022,.028,1,10),brass),rail=mesh(new T.CylinderGeometry(.022,.022,1,10),dark);
  const shoulder=mesh(new T.SphereGeometry(.065,12,8),brass),elbow=mesh(new T.SphereGeometry(.06,12,8),brass),hand=mesh(pump?new T.BoxGeometry(.68,.04,.52):new T.SphereGeometry(.045,12,8),dark);
  const base=mesh(new T.CylinderGeometry(.16,.19,.08,16),dark);
  return {root,upper,lower,rail,shoulder,elbow,hand,base};
}
const yAxis=new T.Vector3(0,1,0);
function segment(mesh,a,b){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);mesh.position.copy(start.add(end).multiplyScalar(.5));mesh.scale.y=delta.length();mesh.quaternion.setFromUnitVectors(yAxis,delta.normalize());}
export function applyKeepers(world,state){
  world.keepers??=new Map();
  for(const body of world.keepers.values())body.root.visible=false;
  for(const pose of state.actors){
    let body=world.keepers.get(pose.id);if(!body){body=keeperBody(pose.family==='bellows');body.root.userData.performerId=pose.id;world.keepers.set(pose.id,body);world.scene.add(body.root);}
    body.root.visible=true;
    body.shoulder.position.fromArray(pose.shoulder);body.elbow.position.fromArray(pose.elbow);body.hand.position.fromArray(pose.hand);
    body.base.position.set(pose.shoulder[0],.05,pose.shoulder[2]);
    segment(body.upper,pose.shoulder,pose.elbow);segment(body.lower,pose.elbow,pose.hand);segment(body.rail,[pose.shoulder[0],.08,pose.shoulder[2]],pose.shoulder);
  }
}
