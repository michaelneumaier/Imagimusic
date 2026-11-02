import test from 'node:test';
import assert from 'node:assert/strict';
import {createInverseSpatialView} from '../src/inverse/spatial-view.js';
function fixture(edges={}){
 const roots=new Set(),built=[];let focus=null,failRender=false,failMount=false,mounted=null;
 const world={scene:{add:r=>roots.add(r),remove:r=>roots.delete(r)},setFocus:b=>{focus=b;},render(){if(failRender)throw new Error('render failed');}};
 const createScene=grove=>{
  const scene={root:grove,bounds:grove+' wide',playingBounds:grove+' playing',focusBounds:{bodies:[grove+' body'],bridges:(edges[grove]??[[0,1]]).map(([a,b],i)=>({a,b,bounds:grove+' bridge'+(i?' '+i:'')}))},disposed:0,dispose(){this.disposed++;},update(snapshot,options){this.last={snapshot,options};}};built.push(scene);return scene;
 };
 const transport={mount:p=>{if(failMount)throw new Error('mount failed');mounted=p.grove;return mounted;}};
 return {view:createInverseSpatialView({world,createScene}),transport,roots,built,get focus(){return focus;},get mounted(){return mounted;},failRender:()=>{failRender=true;},failMount:()=>{failMount=true;}};
}
test('replacement preflights picture, commits matching sound, retains framing and disposes prior picture',()=>{
 const f=fixture();assert.equal(f.view.mount({grove:'first'},f.transport),'first');
 f.view.select('body:0');assert.equal(f.focus,'first body');
 f.view.mount({grove:'second'},f.transport);
 assert.equal(f.mounted,'second');assert.equal(f.view.scene,f.built[1]);assert.equal(f.view.view,'body:0');assert.equal(f.focus,'second body');assert.deepEqual([...f.roots],['second']);assert.equal(f.built[0].disposed,1);
 const snapshot={strikes:[]},options={reducedMotion:true};f.view.update(snapshot,options);assert.deepEqual(f.built[1].last,{snapshot,options});
 assert.throws(()=>f.view.select('bridge:9'));assert.equal(f.focus,'second body');
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

test('connection framing follows unordered endpoints after edge reorder, not the old index',()=>{
 const f=fixture({first:[[0,1],[1,2],[0,2]],second:[[2,0],[0,1],[1,2]]});
 f.view.mount({grove:'first'},f.transport);f.view.select('bridge:2');
 f.view.mount({grove:'second'},f.transport);
 assert.equal(f.view.view,'bridge:0');assert.equal(f.focus,'second bridge');assert.equal(f.view.fallback,null);
});
test('missing connection falls back explicitly; failed mount retains that explanation; selection clears it',()=>{
 const f=fixture({first:[[0,2]],second:[[0,1],[1,2]]});
 f.view.mount({grove:'first'},f.transport);f.view.select('bridge:0');
 f.view.mount({grove:'second'},f.transport);
 assert.equal(f.view.view,'playing');assert.equal(f.focus,'second playing');assert.deepEqual(f.view.fallback,{a:0,b:2});
 f.failMount();assert.throws(()=>f.view.mount({grove:'third'},f.transport));
 assert.equal(f.view.scene,f.built[1]);assert.deepEqual(f.view.fallback,{a:0,b:2});
 f.view.select('overview');assert.equal(f.view.fallback,null);assert.equal(f.focus,'second wide');
});
test('whole-support choice survives replacement',()=>{
 const f=fixture();f.view.mount({grove:'first'},f.transport);f.view.select('overview');f.view.mount({grove:'second'},f.transport);assert.equal(f.view.view,'overview');assert.equal(f.focus,'second wide');
});

test('an unavailable requested connection returns when a later anatomy contains it, unless visitor changes view',()=>{
 const f=fixture({triangle:[[0,1],[1,2],[0,2]],chain:[[0,1],[1,2]]});
 f.view.mount({grove:'triangle'},f.transport);f.view.select('bridge:2');f.view.mount({grove:'chain'},f.transport);
 assert.deepEqual(f.view.fallback,{a:0,b:2});
 f.view.mount({grove:'triangle'},f.transport);assert.equal(f.view.view,'bridge:2');assert.equal(f.view.fallback,null);
 f.view.mount({grove:'chain'},f.transport);f.view.select('body:0');f.view.mount({grove:'triangle'},f.transport);
 assert.equal(f.view.view,'body:0');assert.equal(f.view.fallback,null);
});
