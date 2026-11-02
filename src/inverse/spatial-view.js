import {createInverseScene} from './scene.js';
/** Preflight the complete candidate picture before the transport commits its
 * validated buffers. This synchronous operation cannot interleave with a tap.
 * Transport.mount must leave its previous instrument intact when it throws. */
export function createInverseSpatialView({world,createScene=createInverseScene}){
 let current=null,view='playing';
 function bounds(scene,choice){
  if(choice==='overview')return scene.bounds;
  if(choice==='playing')return scene.playingBounds;
  const [kind,index]=choice.split(':');
  const box=kind==='body'?scene.focusBounds.bodies[Number(index)]:kind==='bridge'?scene.focusBounds.bridges[Number(index)]?.bounds:null;
  if(!box)throw new Error('This anatomy has no such view.');
  return box;
 }
 const release=scene=>{try{scene?.dispose();}catch{/* Cleanup must not turn a successful sound mount into a reported failure. */}};
 return {
  get scene(){return current;},
  get view(){return view;},
  mount(prepared,transport){
   const candidate=createScene(prepared.grove),previous=current,previousView=view;
   try{
    if(previous)world.scene.remove(previous.root);
    world.scene.add(candidate.root);world.setFocus(bounds(candidate,'playing'));world.render();
    const instrument=transport.mount(prepared);
    current=candidate;view='playing';release(previous);return instrument;
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
   const box=bounds(current,choice);world.setFocus(box);view=choice;world.render();
  },
  update(snapshot,options){current?.update(snapshot,options);world.render();},
  dispose(){if(current){world.scene.remove(current.root);release(current);}current=null;}
 };
}
