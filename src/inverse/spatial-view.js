import {createInverseScene} from './scene.js';
/** Preflight the complete candidate picture before the transport commits its
 * validated buffers. This synchronous operation cannot interleave with a tap.
 * Transport.mount must leave its previous instrument intact when it throws. */
export function createInverseSpatialView({world,createScene=createInverseScene}){
 let current=null,view='playing',fallback=null;
 function bounds(scene,choice){
  if(choice==='overview')return scene.bounds;
  if(choice==='playing')return scene.playingBounds;
  const [kind,index]=choice.split(':');
  const box=kind==='body'?scene.focusBounds.bodies[Number(index)]:kind==='bridge'?scene.focusBounds.bridges[Number(index)]?.bounds:null;
  if(!box)throw new Error('This anatomy has no such view.');
  return box;
 }
 function nextView(candidate){
  if(!current)return {choice:'playing',missing:null};
  if(!view.startsWith('bridge:')&&!fallback)return {choice:view,missing:null};
  const edge=fallback??current.focusBounds.bridges[Number(view.split(':')[1])];
  const index=candidate.focusBounds.bridges.findIndex(next=>(next.a===edge.a&&next.b===edge.b)||(next.a===edge.b&&next.b===edge.a));
  return index<0?{choice:'playing',missing:Object.freeze({a:edge.a,b:edge.b})}:{choice:'bridge:'+index,missing:null};
 }
 const release=scene=>{try{scene?.dispose();}catch{/* Cleanup must not turn a successful sound mount into a reported failure. */}};
 return {
  get scene(){return current;},
  get view(){return view;},
  get fallback(){return fallback;},
  mount(prepared,transport){
   const candidate=createScene(prepared.grove),previous=current,previousView=view;
   try{
    const next=nextView(candidate);
    if(previous)world.scene.remove(previous.root);
    world.scene.add(candidate.root);world.setFocus(bounds(candidate,next.choice));world.render();
    const instrument=transport.mount(prepared);
    current=candidate;view=next.choice;fallback=next.missing;release(previous);return instrument;
   }catch(error){
    world.scene.remove(candidate.root);
    if(previous)world.scene.add(previous.root);
    world.setFocus(previous?bounds(previous,previousView):null);
    release(candidate);
    try{world.render();}catch{/* A lost WebGL context can also prevent restoring the picture. */}
    throw error;
   }
  },
  select(choice){
   if(!current)return;
   const box=bounds(current,choice);world.setFocus(box);view=choice;fallback=null;world.render();
  },
  update(snapshot,options){current?.update(snapshot,options);world.render();},
  dispose(){if(current){world.scene.remove(current.root);release(current);}current=null;}
 };
}
