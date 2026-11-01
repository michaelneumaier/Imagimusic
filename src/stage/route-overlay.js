import * as T from '../../vendor/three/build/three.module.js';

/** Inspection annotations only: never modify instrument materials or musical state. */
export function createRouteOverlay(world) {
  const group=new T.Group();group.name='Inspection annotations';world.scene.add(group);
  let links=[],boxes=[],selection=null;
  function settings(binding,patch,frame){
    const slot=Number(binding.target.split('/slot')[1]);
    const voice=frame?.voices.filter(v=>v.family==='bellows'&&v.slot===slot&&v.age>=0).sort((a,b)=>a.age-b.age)[0];
    return voice?.modules.lfo??patch.bellows.lfo;
  }
  function clear(){
    for(const child of [...group.children]){group.remove(child);child.geometry?.dispose();child.material?.dispose();}
    links=[];boxes=[];selection=null;
  }
  function outline(object){
    if(!object)return;
    const helper=new T.BoxHelper(object,0xe9db95);helper.material.depthTest=false;helper.renderOrder=20;helper.raycast=()=>{};group.add(helper);boxes.push({object,helper});
  }
  function link(a,b,modulation=false){
    const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]);
    const material=modulation?new T.LineDashedMaterial({color:0xb8d69a,dashSize:.09,gapSize:.055,depthTest:false}):new T.LineBasicMaterial({color:0xe9db95,depthTest:false});
    const line=new T.Line(geometry,material);line.renderOrder=21;line.raycast=()=>{};group.add(line);links.push({a,b,line});
  }
  function select(binding,patch,frame){
    clear();if(!binding)return '';
    const lfo=settings(binding,patch,frame);selection={binding,patch,key:JSON.stringify([lfo.target,lfo.rateHz])};
    const [family,slotText]=binding.target.split('/'),slot=Number(slotText.slice(4));
    if(family==='loom'){
      const bodies=world.loom.bodies;
      bodies.forEach(body=>{outline(body.body);outline(body.striker);link(body.striker,body.body);});
      outline(world.loom.bridge);link(bodies[0].body,bodies[1].body);
      return 'Solid: strikes excite two coupled resonators. The bridge shows coupling strength and response, not instantaneous energy flow.';
    }
    if(family==='bellows'){
      const body=world.choir[slot];
      [body.source,body.chamber,body.horn].forEach(outline);
      link(body.source,body.chamber);link(body.chamber,body.horn);
      const envelope=['fill','level','aperture'].includes(binding.param);
      if(envelope){outline(body.bellows);link(body.bellows,body.horn,true);if(binding.param==='aperture')link(body.bellows,body.chamber,true);}
      if(['swing','fast','aperture','level'].includes(binding.param)){
        const pendulum=lfo.rateHz>8?body.fastArc:body.pendulum;
        const target=lfo.target==='pitch'?body.source:lfo.target==='amp'?body.horn:body.chamber;
        outline(pendulum);link(pendulum,target,true);
      }
      return 'Solid: source → filter chamber → output. Dashed: envelope or LFO control. Connections describe the synthesis model, not physical airflow.';
    }
    const body=family==='garden'?world.garden[slot]:world.tine;
    const resonator=family==='garden'?body.layers[Number(binding.param.slice(4))]??body.layers[0]:body.beam;
    if(binding.param==='damper'){outline(body.damper);outline(resonator);link(body.damper,resonator,true);return 'Dashed: damper control → resonator release. Held dampers remain visible when the body is silent.';}
    outline(body.striker);outline(resonator);link(body.striker,resonator);
    return 'Solid: striker → resonator. The outline follows the selected part; motion remains an amplified view of the modeled response.';
  }
  const box=new T.Box3(),a=new T.Vector3(),b=new T.Vector3();
  function center(object,out){box.setFromObject(object);if(box.isEmpty())object.getWorldPosition(out);else box.getCenter(out);}
  function update(frame){
    if(selection){const {binding,patch,key}=selection,lfo=settings(binding,patch,frame);if(key!==JSON.stringify([lfo.target,lfo.rateHz]))select(binding,patch,frame); }
    world.scene.updateMatrixWorld(true);
    for(const {object,helper} of boxes){helper.visible=object.visible;helper.update();}
    for(const {a:from,b:to,line} of links){
      line.visible=from.visible&&to.visible;if(!line.visible)continue;
      center(from,a);center(to,b);const positions=line.geometry.attributes.position;positions.setXYZ(0,a.x,a.y,a.z);positions.setXYZ(1,b.x,b.y,b.z);positions.needsUpdate=true;line.geometry.computeBoundingSphere();line.computeLineDistances();
    }
  }
  return {select,update,clear,dispose(){clear();world.scene.remove(group);}};
}
