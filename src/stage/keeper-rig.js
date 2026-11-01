/** Exact two-link articulation for an interpreted mechanical performer.
 * Returns null for unreachable endpoints; never silently moves the contact point.
 */
export function solveKeeperArm(shoulder,hand,upper,lower,bend=[0,0,1]){
  if(![...shoulder,...hand,...bend,upper,lower].every(Number.isFinite)||upper<=0||lower<=0)throw new Error('Arm inputs must be finite with positive link lengths.');
  const delta=hand.map((v,i)=>v-shoulder[i]),distance=Math.hypot(...delta);
  if(distance<1e-9||distance>upper+lower+1e-9||distance<Math.abs(upper-lower)-1e-9)return null;
  const axis=delta.map(v=>v/distance),along=(upper*upper-lower*lower+distance*distance)/(2*distance);
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  let normal=bend.map((v,i)=>v-dot(bend,axis)*axis[i]);
  if(Math.hypot(...normal)<1e-9){
    const least=axis.map(Math.abs).indexOf(Math.min(...axis.map(Math.abs))),fallback=[0,0,0];fallback[least]=1;
    normal=fallback.map((v,i)=>v-dot(fallback,axis)*axis[i]);
  }
  const size=Math.hypot(...normal),height=Math.sqrt(Math.max(0,upper*upper-along*along));
  const elbow=shoulder.map((v,i)=>v+axis[i]*along+normal[i]/size*height);
  return {shoulder:[...shoulder],elbow,hand:[...hand]};
}
