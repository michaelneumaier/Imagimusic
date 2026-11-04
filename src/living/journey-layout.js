/** Workshop placement in existing 10mm drawing units. Repeated lengths sit
 * behind their first instance; fixed camera keeps the entire ensemble present. */
export function createLivingJourneyLayout(allocation,{fitAllInstances=false}={}){
 const depth=Math.max(0,...allocation.instances.map(i=>i.ordinal));
 const camera=fitAllInstances?{target:[2,3,-5*depth],direction:[5,10,22],radius:Math.max(24,Math.hypot(21,5*depth+3,8))}:{target:[2,3,-4],direction:[5,10,22],radius:24};
 return {instances:allocation.instances.map(i=>({bodyMm:i.bodyMm,position:[{95:-14,80:0,65:14}[i.bodyMm],0,-10*i.ordinal]})),camera};
}
