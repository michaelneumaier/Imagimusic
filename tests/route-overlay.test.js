import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three/build/three.module.js';
import { gardenBody,choirBody,tineBody } from '../src/stage/bodies.js';
import { createRouteOverlay } from '../src/stage/route-overlay.js';
import { DEFAULT_PATCH } from '../src/model.js';

test('inspection routes follow moving parts without mutating their materials and release annotations',()=>{
  const world={scene:new T.Scene(),garden:[gardenBody(0)],choir:[choirBody(0)],tine:tineBody()};
  for(const body of [...world.garden,...world.choir,world.tine])world.scene.add(body.root);
  const before=world.choir[0].horn.material.toJSON(),route=createRouteOverlay(world);
  const patch=structuredClone(DEFAULT_PATCH);patch.bellows.lfo.target='amp';
  route.select({target:'bellows/slot0',param:'swing'},patch);route.update();
  const group=world.scene.getObjectByName('Inspection annotations');
  const modulation=group.children.find(c=>c.material.isLineDashedMaterial);
  const prior=Array.from(modulation.geometry.attributes.position.array);
  world.choir[0].horn.position.x+=2;route.update();
  assert.notDeepEqual(Array.from(modulation.geometry.attributes.position.array),prior,'amp modulation must terminate at the moving output');
  assert.deepEqual(world.choir[0].horn.material.toJSON(),before);
  route.select({target:'garden/slot0',param:'mode2'},patch);route.update();
  assert.equal(group.children.length,3,'old choir routes were removed');
  world.garden[0].striker.visible=false;route.update();
  assert.equal(group.children.at(-1).visible,false,'hidden striker has no dangling connection');
  route.clear();assert.equal(group.children.length,0);
  route.dispose();assert.equal(world.scene.getObjectByName('Inspection annotations'),undefined);
});
