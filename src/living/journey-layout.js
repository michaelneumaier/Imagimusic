/** Workshop placement in existing 10mm drawing units. Repeated lengths sit
 * behind their first instance; fixed camera keeps the entire ensemble present. */
export function createLivingJourneyLayout(allocation){
 return {instances:allocation.instances.map(i=>({bodyMm:i.bodyMm,position:[{95:-14,80:0,65:14}[i.bodyMm],0,-10*i.ordinal]})),camera:{target:[2,3,-4],direction:[5,10,22],radius:24}};
}
