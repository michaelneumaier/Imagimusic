/** A deliberate tap, without taking scrolling away from the browser.
 * pick returns a stable body identity or null. A cancelled gesture never calls onTap.
 * No pointer capture, preventDefault, audio, or optimistic visual acknowledgement.
 */
export function bindBodyTap(canvas,{pick,enabled,onTap,scope=window,document=canvas.ownerDocument,maxDistance=8,maxDuration=600}){
 let candidate=null;
 const pointers=new Set();
 const cancel=()=>{candidate=null;};
 const moved=event=>Math.hypot(event.clientX-candidate.x,event.clientY-candidate.y)>maxDistance;
 function down(event){
  cancel();
  if(event.button!==0||!event.isPrimary||pointers.size!==1||!enabled())return;
  const body=pick(event);
  if(body!==null&&body!==undefined)candidate={body,id:event.pointerId,x:event.clientX,y:event.clientY,at:event.timeStamp};
 }
 function anotherPointer(event){if(!pointers.has(event.pointerId)&&pointers.size)cancel();pointers.add(event.pointerId);}
 function pointerCancel(event){pointers.delete(event.pointerId);cancel();}
 function interrupted(){pointers.clear();cancel();}
 function move(event){if(candidate&&event.pointerId===candidate.id&&moved(event))cancel();}
 function up(event){
  pointers.delete(event.pointerId);
  if(!candidate||event.pointerId!==candidate.id)return;
  const start=candidate,tooFar=moved(event),elapsed=event.timeStamp-start.at;
  cancel();
  if(event.target!==canvas||event.button!==0||tooFar||elapsed<0||elapsed>maxDuration||!enabled())return;
  if(pick(event)===start.body)onTap(start.body);
 }
 const bindings=[
  [canvas,'pointerdown',down],
  [scope,'pointerdown',anotherPointer,true],
  [scope,'pointermove',move,true],
  [scope,'pointerup',up,true],
  [scope,'pointercancel',pointerCancel,true],
  [scope,'scroll',cancel,true],
  [scope,'resize',cancel],
  [scope,'blur',interrupted],
  [document,'visibilitychange',interrupted]
 ];
 for(const [target,type,listener,capture=false] of bindings)target.addEventListener(type,listener,{capture,passive:true});
 const observer=typeof scope.ResizeObserver==='function'?new scope.ResizeObserver(cancel):null;
 observer?.observe(canvas);
 return {cancel,dispose(){interrupted();observer?.disconnect();for(const [target,type,listener,capture=false] of bindings)target.removeEventListener(type,listener,capture);}};
}
