import test from 'node:test';
import assert from 'node:assert/strict';
import {groveAnatomy} from '../src/grove/anatomy.js';
test('mass controls volume independently of tuning and only nonzero modeled bridges are visible',()=>{
 const grove={bodies:[{id:0,mass:.02,hz:100},{id:1,mass:.04,hz:400},{id:2,mass:.02,hz:200}],layout:[{x:-1,z:0},{x:0,z:.5},{x:1,z:0}],bridges:[{a:0,b:1,coupling:.004},{a:1,b:2,coupling:0}]};
 const a=groveAnatomy(grove),volume=b=>b.scale.reduce((x,y)=>x*y,1);
 assert.ok(Math.abs(volume(a.bodies[1])/volume(a.bodies[0])-2)<1e-12);assert.ok(Math.abs(volume(a.bodies[2])/volume(a.bodies[0])-1)<1e-12);
 for(const body of a.bodies)assert.deepEqual(body.attachment,[body.position[0],body.position[1]-1.3*body.scale[1],body.position[2]]);
 assert.deepEqual(a.bridges.map(b=>b.visible),[true,false]);assert.deepEqual(groveAnatomy(grove),a);
});
