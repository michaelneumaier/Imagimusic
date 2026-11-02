import test from 'node:test';
import assert from 'node:assert/strict';
import {createInverseSpatialView} from '../src/inverse/spatial-view.js';
function fixture(){
 const roots=new Set(),built=[];let focus=null,failRender=false,failMount=false,mounted=null;
 const world={scene:{add:r=>roots.add(r),remove:r=>roots.delete(r)},setFocus:b=>{focus=b;},render(){if(failRender)throw new Error('render failed');}};
 const createScene=grove=>{
  const scene={root:grove,bounds:grove+' wide',playingBounds:grove+' playing',focusBounds:{bodies:[grove+' body'],bridges:[{bounds:grove+' bridge'}]},disposed:0,dispose(){this.disposed++;},update(snapshot,options){this.last={snapshot,options};}};built.push(scene);return scene;
 };
 const transport={mount:p=>{if(failMount)throw new Error('mount failed');mounted=p.grove;return mounted;}};
 return {view:createInverseSpatialView({world,createScene}),transport,roots,built,get focus(){return focus;},get mounted(){return mounted;},failRender:()=>{failRender=true;},failMount:()=>{failMount=true;}};
}
test('replacement preflights picture, commits matching sound, resets framing and disposes prior picture',()=>{
 const f=fixture();assert.equal(f.view.mount({grove:'first'},f.transport),'first');
 f.view.select('body:0');assert.equal(f.focus,'first body');
 f.view.mount({grove:'second'},f.transport);
 assert.equal(f.mounted,'second');assert.equal(f.view.scene,f.built[1]);assert.equal(f.view.view,'playing');assert.equal(f.focus,'second playing');assert.deepEqual([...f.roots],['second']);assert.equal(f.built[0].disposed,1);
 const snapshot={strikes:[]},options={reducedMotion:true};f.view.update(snapshot,options);assert.deepEqual(f.built[1].last,{snapshot,options});
 assert.throws(()=>f.view.select('bridge:9'));assert.equal(f.focus,'second playing');
 f.view.dispose();f.view.dispose();assert.equal(f.built[1].disposed,1);assert.equal(f.roots.size,0);
});
for(const failure of ['failRender','failMount'])test(`${failure} retains prior sound, scene and selected view and releases the candidate`,()=>{
 const f=fixture();f.view.mount({grove:'first'},f.transport);f.view.select('bridge:0');f[failure]();
 assert.throws(()=>f.view.mount({grove:'second'},f.transport),/failed/);
 assert.equal(f.mounted,'first');assert.equal(f.view.scene,f.built[0]);assert.equal(f.view.view,'bridge:0');assert.equal(f.focus,'first bridge');assert.deepEqual([...f.roots],['first']);assert.equal(f.built[0].disposed,0);assert.equal(f.built[1].disposed,1);
});
test('failed first picture never mounts sound or leaves a root installed',()=>{
 const f=fixture();f.failRender();assert.throws(()=>f.view.mount({grove:'first'},f.transport));assert.equal(f.mounted,null);assert.equal(f.view.scene,null);assert.equal(f.roots.size,0);assert.equal(f.built[0].disposed,1);
});
