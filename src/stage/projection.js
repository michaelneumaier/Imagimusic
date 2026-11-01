import {setTensionerParameter,updateTensionerLinks} from '../tensioner/scene.js';
import {setLoomParameter} from '../loom/scene.js';
import { createKeeperProjection,keeperBindings,applyKeeper,pumpOperators } from './keepers.js';
import { CAMERA_BINDING } from './director.js';
import { stageInputsFor } from '../bindings-catalog.js';
import { aperture01 } from '../dynamics.js';
import { tineModes } from '../model.js';
import { validateBindings, applyBindings } from '../bindings.js';

export const CAPTIONS = [
  {label:'interpreted',text:'Resonator shells show the summed modal envelopes of overlapping strikes. Slow sway makes energy visible; it is not audio-rate vibration.'},
  {label:'interpreted',text:'Each bellows follows an envelope. Iris opening maps cutoff logarithmically; horn light follows modeled amplitude. The chamber is not an acoustic simulation.'},
  {label:'physical',text:'Tine frequencies and mode shapes come from beam geometry. Deflection is amplified and slowed; excitation and radiation remain stylized.'},
];
export function createProjection(patch,{performance}={}) {
  const keepers=performance?createKeeperProjection(performance):null;
  const shapes=tineModes(patch).map(mode=>Array.from({length:65},(_,i)=>mode.shape(i/64)));
  return frame=>{
    const garden=Array.from({length:8},(_,slot)=>modalSlot(frame,'garden',slot));
    const tine=modalSlot(frame,'tine',8);
    tine.deflection=Array.from({length:65},(_,i)=>tine.energies.reduce((sum,energy,n)=>sum+(shapes[n]?.[i]??0)*energy*Math.sin(frame.t*(4+n*.7))*.6,0));
    tine.length=patch.geometry.lengthM*35;tine.thickness=patch.geometry.thicknessM*35;tine.width=patch.geometry.widthM*35;
    const bellows=Array.from({length:6},(_,slot)=>{
      const voices=frame.voices.filter(v=>v.family==='bellows'&&v.slot===slot&&v.age>=0).sort((a,b)=>a.age-b.age);
      const v=voices[0];
      return {voiceId:v?.id??null,phase:v?.modules.env.stage??'rest',fill:v?.exciter.fill01??1,aperture:v?.modules.filter.aperture01??aperture01(patch.bellows.cutoffHz),level:v?.level??0,
        fast:patch.bellows.lfo.rateHz>8,swing:patch.bellows.lfo.rateHz>8?0:(v?.modules.lfo.value??0)*.65,resonance:v?.modules.filter.resonance??patch.bellows.resonance};
    });
    const performers=keepers?keepers(frame.t):null;
    if(performers)performers.actors.push(...pumpOperators(bellows));
    return {...frame,stage:{garden,tine,bellows,...(performers?{performers}:{})}};
  };
}
function modalSlot(frame,family,slot){
  const voices=frame.voices.filter(v=>v.family===family&&v.slot===slot);
  const energies=Array.from({length:5},(_,i)=>voices.reduce((sum,v)=>sum+(v.modes[i]?.energy??0),0));
  const gesture=voices.filter(v=>v.exciter.visible).sort((a,b)=>Math.abs(a.age)-Math.abs(b.age))[0];
  return {energies,reach:gesture?.exciter.reach??0,visible:!!gesture,position:gesture?.exciter.pos01??.37,damper:Math.max((frame.global.dampers?.[family]??[]).includes(slot)?1:0,...voices.map(v=>v.damper.pressure))};
}
export function stageBindings({camera=false,performers=false,performance}={}){
  const list=[];
  function add(target,param,field,inputs,note,map){const spec=stageInputsFor(target.split('/')[0],param);if(!spec)throw new Error('Missing binding metadata: '+target+'/'+param);list.push({id:target+'/'+param,target,param,field,inputs:spec.inputs,label:note.label,note:spec.note,map});}
  for(let i=0;i<8;i++) {
    const target=`garden/slot${i}`,field=`stage.garden[${i}]`;
    for(let n=0;n<5;n++)add(target,`mode${n}`,`${field}.energies[${n}]`,['material','brightness','damping','strikePosition'],CAPTIONS[0],(e,frame)=>({energy:e,sway:Math.sin(frame.t*5+i+n)*e*.55}));
    add(target,'damper',`${field}.damper`,['release'],CAPTIONS[0]);
    add(target,'striker',field,['strikePosition'],CAPTIONS[0],s=>({visible:s.visible,reach:s.reach,position:s.position}));
  }
  for(let i=0;i<6;i++)for(const param of ['fill','aperture','level','swing','fast','resonance'])add(`bellows/slot${i}`,param,`stage.bellows[${i}].${param}`,['bellows.adsr','bellows.cutoffHz','bellows.envAmount','bellows.lfo'],CAPTIONS[1]);
  for(const param of ['length','thickness','width','deflection','reach','position','visible','damper'])add('tine/slot8',param,`stage.tine.${param}`,['geometry','strikePosition','damping'],CAPTIONS[2]);
  if(camera)list.push({...CAMERA_BINDING});
  if(performers){if(!performance)throw new Error('Performer bindings require the performance.');list.push(...keeperBindings(performance));}
  return validateBindings(list);
}
export function applyStage(frame,bindings,world){
  if(world.loom)world.loom.root.visible=!!frame.stage?.loom;
  if(world.fm)world.fm.root.visible=!!frame.stage?.tensioner;
  const applied=applyBindings(frame,bindings,(target,param,value)=>{
    if(target.startsWith('fm/')){setTensionerParameter(world.fm,target,param,value);return;}
    if(target.startsWith('loom/')){world.loom.root.visible=true;setLoomParameter(world.loom,target,param,value);return;}
    if(target.startsWith('performer/')){applyKeeper(world,value);return;}
    if(target==='camera'){world.camera.position.fromArray(value.position);world.controls.target.fromArray(value.target);world.camera.lookAt(world.controls.target);return;}
    const [family,slotName]=target.split('/'),slot=Number(slotName.slice(4));
    if(family==='garden'){
      const body=world.garden[slot];
      if(param.startsWith('mode')){const shell=body.layers[Number(param.slice(4))];shell.position.x=value.sway;shell.material.emissiveIntensity=Math.min(2,value.energy*3);}
      else if(param==='damper'){body.damper.position.x=.63-value*.2;}
      else if(param==='striker'){body.striker.visible=value.visible;body.striker.position.set(-.38-(1-value.reach)*.55,value.position*body.height,0);}
    } else if(family==='bellows'){
      const body=world.choir[slot];
      if(param==='fill')body.bellows.scale.y=.45+value*.6;
      if(param==='aperture')body.blades.forEach(({blade})=>{blade.position.x=.12+value*.24;blade.rotation.z=.65-value*.7;});
      if(param==='level'){body.glow.material.opacity=Math.min(.7,value*.8);body.horn.material.emissive.setHex(0xaccf80);body.horn.material.emissiveIntensity=value*.7;}
      if(param==='swing')body.pendulum.rotation.z=value;
      if(param==='fast'){body.pendulum.visible=!value;body.fastArc.visible=value;}
      if(param==='resonance')body.chamber.scale.z=1+value*.15;
    } else {
      const body=world.tine;
      if(param==='length')body.beam.scale.x=value;
      if(param==='thickness')body.beam.scale.y=value/.03;
      if(param==='width')body.beam.scale.z=value/.22;
      if(param==='deflection'){
        const positions=body.beam.geometry.attributes.position;
        for(let i=0;i<positions.count;i++){const u=body.base[i*3],idx=Math.min(64,Math.max(0,Math.round(u*64)));positions.setY(i,body.base[i*3+1]+value[idx]/body.beam.scale.y);}
        positions.needsUpdate=true;body.beam.geometry.computeVertexNormals();body.beam.geometry.computeBoundingSphere();
      }
      if(param==='damper'){body.damper.position.set(.2+body.beam.scale.x*.65,.4+value*(.65-body.beam.scale.y*.015-.06-.4),0);}
      if(param==='visible')body.striker.visible=value;
      if(param==='reach')body.striker.position.y=.78+(1-value)*.6;
      if(param==='position')body.striker.position.x=.2+value*body.beam.scale.x;
    }
  });
  if(world.fm)updateTensionerLinks(world.fm);
  return applied;
}
