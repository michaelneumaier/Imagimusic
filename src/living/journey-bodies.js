/** Minimum reusable instances per length for half-open rendered-pass spans.
 * A body is available only once its entire preceding pass has ended. This
 * keeps concurrent independent simulations visibly distinct; reuse after a
 * recorded fade does not establish physical continuity between performances.
 */
export function allocateLivingJourneyBodies(score){
 const instances=[],assignments=[];
 for(const bodyMm of [80,95,65]){
  const local=[];
  const passes=score.passes.filter(p=>p.bodyMm===bodyMm).toSorted((a,b)=>a.startFrame-b.startFrame||a.id-b.id);
  for(const pass of passes){
   let instance=local.find(i=>i.availableFrame<=pass.startFrame);
   if(!instance){instance={id:instances.length,bodyMm,ordinal:local.length,availableFrame:0,passIds:[]};local.push(instance);instances.push(instance);}
   instance.passIds.push(pass.id);instance.availableFrame=pass.endFrame;
   assignments.push(Object.freeze({passId:pass.id,instance:instance.id}));
  }
 }
 return Object.freeze({instances:Object.freeze(instances.map(({availableFrame,...instance})=>Object.freeze({...instance,passIds:Object.freeze(instance.passIds)}))),assignments:Object.freeze(assignments.toSorted((a,b)=>a.passId-b.passId))});
}
