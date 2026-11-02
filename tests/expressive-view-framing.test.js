import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3,Box3,Group} from '../vendor/three/build/three.module.js';
import {createExpressionView} from '../src/expressive/view-framing.js';
import {expressionViewBounds} from '../src/expressive/view-bounds.js';
import {createExpressionScene,expressionSceneFrame} from '../src/expressive/scene.js';
import {createExpressionPerformance} from '../src/expressive/performance.js';
import {composeExpressiveChord} from '../src/midi2/expression.js';
function fixture(){
 const camera=new PerspectiveCamera(42,1,.1,100),controls={target:new Vector3(),minDistance:5,maxDistance:28,enabled:true,update(){camera.lookAt(this.target);camera.updateMatrixWorld();}};
 const scene={bodies:Array.from({length:8},()=>({root:new Group()}))};
 const boundsFor=(count,i)=>new Box3(new Vector3((i-(count-1)/2)*2.25-1.1,-.05,-.8),new Vector3((i-(count-1)/2)*2.25+1.2,2.65,.8));
 return {camera,controls,scene,boundsFor,view:createExpressionView({camera,controls,boundsFor})};
}
test('selected voice box fits narrow and wide views with a stable, inspectable camera',()=>{
 const f=fixture();
 for(const width of [320,1000])for(const selected of [0,7]){
  assert.equal(f.view.update({...f,selected,close:true,width,height:500}),true);
  const b=f.boundsFor(8,selected);
  for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
   const p=new Vector3(x,y,z).project(f.camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&Math.abs(p.z)<1);
  }
  assert.deepEqual(f.scene.bodies.map(b=>b.root.visible),f.scene.bodies.map((_,i)=>i===selected));
  const position=f.camera.position.clone();
  assert.equal(f.view.update({...f,selected,close:true,width,height:500}),false);
  assert.deepEqual(f.camera.position,position);
 }
});
test('all-voices return restores orbit limits; selecting a card does not reset the all-voices camera',()=>{
 const f=fixture();f.view.update({...f,selected:7,close:true,width:320,height:500});
 assert.equal(f.controls.enabled,false);
 f.view.update({...f,close:false,width:320,height:500});
 assert.equal(f.controls.enabled,true);assert.equal(f.controls.minDistance,5);assert.equal(f.controls.maxDistance,28);
 assert.ok(f.scene.bodies.every(b=>b.root.visible));
 f.camera.position.set(3,4,5);
 assert.equal(f.view.update({...f,selected:3,close:false,width:320,height:500}),false);
 assert.deepEqual(f.camera.position.toArray(),[3,4,5]);
 assert.equal(f.view.update({...f,close:true,width:0,height:500}),false);
 assert.throws(()=>f.view.update({...f,selected:8,close:true,width:320,height:500}),/outside/);
});
test('production full-response bounds fit for1–8 voices and view changes leave evaluated expression unchanged',()=>{
 const p=createExpressionPerformance(composeExpressiveChord()),before=expressionSceneFrame(p,1.7),f=fixture();
 const view=createExpressionView({...f,boundsFor:expressionViewBounds});
 for(let count=1;count<=8;count++){
  const scene=createExpressionScene(count);
  for(let selected=0;selected<count;selected++){
   view.update({scene,selected,close:true,width:280,height:350});
   const b=expressionViewBounds(count,selected);
   for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z]){
    const point=new Vector3(x,y,z).project(f.camera);assert.ok(Math.abs(point.x)<1&&Math.abs(point.y)<1&&Math.abs(point.z)<1);
   }
  }
 }
 assert.deepEqual(expressionSceneFrame(p,1.7),before);
});
