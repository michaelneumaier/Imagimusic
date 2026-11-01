/** Artistic embedding of the sound network. Volume encodes model mass; aspect
 * encodes tuning. Neither shell material nor suspension is an acoustic model. */
export function groveAnatomy(grove){
 const positions=grove.layout;
 if(!Array.isArray(grove.bodies)||!Array.isArray(positions)||positions.length!==grove.bodies.length)throw new Error('Grove anatomy needs one layout position per body');
 const bodies=grove.bodies.map((body,i)=>{
  if(!(body.mass>0&&Number.isFinite(body.mass)&&body.hz>0&&Number.isFinite(body.hz)))throw new Error('Invalid grove body mass or tuning');
  const point=positions[i];if(!Number.isFinite(point.x)||!Number.isFinite(point.z))throw new Error('Invalid grove layout');
  const radius=.48*Math.cbrt(body.mass/.02),aspect=Math.max(.65,Math.min(1.65,Math.sqrt(196/body.hz)));
  // Multiplying all three scales gives radius³: tuning changes aspect, not volume.
  return {id:body.id??i,position:[point.x*3,2.1,point.z*3],scale:[radius/Math.sqrt(aspect),radius*aspect,radius/Math.sqrt(aspect)],radius,aspect,hz:body.hz,mass:body.mass};
 });
 for(const body of bodies)body.attachment=[body.position[0],body.position[1]-1.3*body.scale[1],body.position[2]];
 const bridges=grove.bridges.map(edge=>{
  if(!Number.isInteger(edge.a)||!Number.isInteger(edge.b)||!bodies[edge.a]||!bodies[edge.b]||edge.a===edge.b||!Number.isFinite(edge.coupling)||edge.coupling<0||edge.coupling>.04)throw new Error('Invalid grove bridge');
  return {a:edge.a,b:edge.b,coupling:edge.coupling,radius:.012+.04*Math.sqrt(edge.coupling/.04),visible:edge.coupling>0};
 });
 return {bodies,bridges,interpretation:'Mass sets shell volume; tuning sets aspect. Connections follow the spring network. Layout, support, materials and shell surface are artistic interpretations.'};
}
