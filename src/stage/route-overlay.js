import * as T from '../../vendor/three/build/three.module.js';

/** Inspection annotations only: never modify instrument materials or musical state. */
export function createRouteOverlay(world) {
  const group=new T.Group();group.name='Inspection annotations';world.scene.add(group);
  let links=[],boxes=[];
  function clear(){
    for(const child of [...group.children]){group.remove(child);child.geometry?.dispose();child.material?.dispose();}
    links=[];boxes=[];
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
  function select(binding,patch){
    clear();if(!binding)return '';
    const [family,slotText]=binding.target.split('/'),slot=Number(slotText.slice(4));
    if(family==='bellows'){
      const body=world.choir[slot];
      [body.source,body.chamber,body.horn].forEach(outline);
      link(body.source,body.chamber);link(body.chamber,body.horn);
      const envelope=['fill','level','aperture'].includes(binding.param);
      if(envelope){outline(body.bellows);link(body.bellows,body.horn,true);if(binding.param==='aperture')link(body.bellows,body.chamber,true);}
      if(['swing','fast','aperture','level'].includes(binding.param)){
        const pendulum=patch.bellows.lfo.rateHz>8?body.fastArc:body.pendulum;
        const target=patch.bellows.lfo.target==='pitch'?body.source:patch.bellows.lfo.target==='amp'?body.horn:body.chamber;
        outline(pendulum);link(pendulum,target,true);
      }
      return 'Solid: source → filter chamber → output. Dashed: envelope or LFO control. Connections describe the synthesis model, not physical airflow.';
    }
    const body=family==='garden'?world.garden[slot]:world.tine;
    const resonator=family==='garden'?body.layers[Number(binding.param.slice(4))]??body.layers[0]:body.beam;
    outline(body.striker);outline(resonator);link(body.striker,resonator);
    return 'Solid: striker → resonator. The outline follows the selected part; motion remains an amplified view of the modeled response.';
  }
  const box=new T.Box3(),a=new T.Vector3(),b=new T.Vector3();
  function center(object,out){box.setFromObject(object);if(box.isEmpty())object.getWorldPosition(out);else box.getCenter(out);}
  function update(){
    world.scene.updateMatrixWorld(true);
    for(const {object,helper} of boxes){helper.visible=object.visible;helper.update();}
    for(const {a:from,b:to,line} of links){
      line.visible=from.visible&&to.visible;if(!line.visible)continue;
      center(from,a);center(to,b);const positions=line.geometry.attributes.position;positions.setXYZ(0,a.x,a.y,a.z);positions.setXYZ(1,b.x,b.y,b.z);positions.needsUpdate=true;line.geometry.computeBoundingSphere();line.computeLineDistances();
    }
  }
  return {select,update,clear,dispose(){clear();world.scene.remove(group);}};
}
