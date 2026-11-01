import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three/build/three.module.js';
import {groveBodyAt,bindGrovePlaying} from '../src/grove/interaction.js';
function fixture(){
 const root=new T.Group(),shell=new T.Mesh(new T.SphereGeometry(1),new T.MeshBasicMaterial());root.add(shell);
 const scene={root,bodies:[{shell}]},camera=new T.PerspectiveCamera(45,1,.1,100);camera.position.z=5;camera.lookAt(0,0,0);camera.updateProjectionMatrix();
 const listeners=new Map(),captured=new Set(),canvas={style:{},getBoundingClientRect:()=>({left:10,top:20,width:200,height:200}),addEventListener:(k,v)=>listeners.set(k,v),removeEventListener:k=>listeners.delete(k),setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
 const emit=(type,fields={})=>{const e={button:0,pointerId:1,clientX:110,clientY:120,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...fields};listeners.get(type)?.(e);return e;};
 return {scene,camera,canvas,emit};
}
test('scene picking follows current world transforms and misses empty space',()=>{
 const {scene,camera,canvas}=fixture();assert.equal(groveBodyAt(scene,camera,canvas,110,120),0);assert.equal(groveBodyAt(scene,camera,canvas,10,20),null);scene.root.position.x=5;assert.equal(groveBodyAt(scene,camera,canvas,110,120),null);
});
test('body gestures isolate orbit, cancel without strike, and leave empty space to camera',()=>{
 const {scene,camera,canvas,emit}=fixture(),controls={enabled:true},events=[];
 const bound=bindGrovePlaying({canvas,controls,getScene:()=>scene,camera,canPlay:()=>true,start:(...args)=>events.push(['start',...args]),finish:(...args)=>events.push(['end',...args])});
 assert.equal(emit('pointerdown',{clientX:10,clientY:20}).stopped,undefined);assert.equal(controls.enabled,true);
 assert.equal(emit('pointerdown').stopped,true);assert.equal(controls.enabled,false);emit('pointercancel');assert.equal(controls.enabled,true);assert.equal(events.at(-1)[3],true);
 emit('pointerdown');emit('pointerup');assert.equal(events.at(-1)[3],false);const count=events.length;emit('lostpointercapture');assert.equal(events.length,count);
 emit('pointerdown');bound.reset();assert.equal(events.at(-1)[3],true);assert.equal(controls.enabled,true);bound.dispose();
});

test('a second pointer cannot turn an active camera drag into a musical gesture',()=>{
 const {scene,camera,canvas,emit}=fixture(),handlers=new Map(),controls={enabled:true,addEventListener:(k,f)=>handlers.set(k,f),removeEventListener:k=>handlers.delete(k)},events=[];
 const bound=bindGrovePlaying({canvas,controls,getScene:()=>scene,camera,canPlay:()=>true,start:()=>events.push('start'),finish:()=>events.push('finish')});
 handlers.get('start')();assert.equal(emit('pointerdown').stopped,undefined);assert.deepEqual(events,[]);assert.equal(controls.enabled,true);
 handlers.get('end')();emit('pointerdown');assert.deepEqual(events,['start']);bound.dispose();assert.equal(handlers.size,0);
});
