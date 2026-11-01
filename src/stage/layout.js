/** Shared stage coordinates for bodies, score direction and future performer planning. */
export const LOOM_STAGE_PLACEMENT={position:[-5.8,0,4],scale:.75};
export function stagePosition(family,slot=0){
  if(family==='garden')return [(slot-3.5)*1.15,0,1.1+Math.abs(slot-3.5)*.12];
  if(family==='bellows')return [(slot-2.5)*1.6,0,-2.4-Math.cos(slot*.7)*.25];
  if(family==='loom')return [LOOM_STAGE_PLACEMENT.position[0]+(slot===0?-2:2)*LOOM_STAGE_PLACEMENT.scale,0,LOOM_STAGE_PLACEMENT.position[2]];
  if(family==='tine')return [-1.6,0,4.1];
  throw new Error('Unknown stage family: '+family);
}
