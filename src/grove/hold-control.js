/** Momentary pointer/keyboard input with assistive click toggling.
 * onChange reports requested contact state; audio acknowledgement owns the visual state. */
export function bindHoldControl(button,{enabled=()=>!button.disabled,onChange,windowTarget=window}={}){
 const owners=new Set(),listeners=[];let disposed=false;
 const listen=(target,type,handler)=>{target.addEventListener(type,handler);listeners.push(()=>target.removeEventListener(type,handler));};
 function set(owner,on){
  if(disposed)return;
  const was=owners.size>0;
  if(on){if(!enabled())return;owners.add(owner);}else owners.delete(owner);
  const held=owners.size>0;if(was!==held)onChange(held);
 }
 function clear(notify){
  const was=owners.size>0,ids=[...owners].filter(s=>s.startsWith('pointer-')).map(s=>Number(s.slice(8)));
  owners.clear();
  // Clear ownership before releasing capture: lostpointercapture can fire synchronously.
  for(const id of ids)if(button.hasPointerCapture?.(id))button.releasePointerCapture(id);
  if(notify&&was)onChange(false);
 }
 listen(button,'pointerdown',event=>{
  if(event.button!==0||!enabled())return;
  event.preventDefault();button.focus();
  // A failed capture must not leave a hand active without a reliable release path.
  try{button.setPointerCapture(event.pointerId);}catch{return;}
  set('pointer-'+event.pointerId,true);
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(button,type,event=>set('pointer-'+event.pointerId,false));
 listen(button,'keydown',event=>{if(![' ','Enter'].includes(event.key))return;event.preventDefault();if(!event.repeat)set('key-'+event.key,true);});
 listen(button,'keyup',event=>{if(![' ','Enter'].includes(event.key))return;event.preventDefault();set('key-'+event.key,false);});
 listen(button,'blur',()=>{set('key- ',false);set('key-Enter',false);});
 listen(button,'click',event=>{event.preventDefault();if(event.detail===0)set('assistive',!owners.has('assistive'));});
 listen(windowTarget,'blur',()=>clear(true));
 return {release:()=>clear(true),reset:()=>clear(false),dispose(){if(disposed)return;clear(true);disposed=true;listeners.forEach(remove=>remove());},get requested(){return owners.size>0;}};
}
