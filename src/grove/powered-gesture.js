/** Resolve overlapping human holds to one desired contact. This is input ownership,
 * not model state: the scene must follow processed audio acknowledgements.
 * A changed hold takes priority; an unchanged repeat never steals it. Releasing
 * the active hold restores the most recent remaining hold without restarting sound.
 * send returns false to reject a transition; rejection preserves the prior holds. */
export function createPoweredGesture({send}={}){
 if(typeof send!=='function')throw new Error('A contact command sender is required.');
 let held=new Map();
 const active=map=>[...map.values()].at(-1)??null;
 const validId=id=>{if(typeof id!=='string'||!id.length||id.length>128)throw new Error('A short gesture identity is required.');};
 function commit(next){
  const before=active(held),after=active(next),changed=before!==after;
  if(changed&&send({kind:'contact',zone:after})===false)return {accepted:false,changed:false,zone:before};
  held=next;return {accepted:true,changed,zone:after};
 }
 return {
  hold(id,zone){
   validId(id);if(zone!==0&&zone!==1)throw new Error('Choose contact zone 0 or 1.');
   if(held.get(id)===zone)return {accepted:true,changed:false,zone:active(held)};
   if(!held.has(id)&&held.size>=16)throw new Error('Too many simultaneous contact gestures.');
   const next=new Map(held);next.delete(id);next.set(id,zone);return commit(next);
  },
  release(id){validId(id);const next=new Map(held);next.delete(id);return commit(next);},
  reset(){return commit(new Map());},
  // Used only after the encounter has ended or its host has been disposed.
  // No lift is needed because that audio owner can no longer accept gestures.
  clear(){held.clear();},
  get zone(){return active(held);},get count(){return held.size;},
 };
}
