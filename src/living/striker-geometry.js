/** Artistic rig in scene units (10 mm each), independent of sound mechanics. */
export const STRIKER_GEOMETRY=Object.freeze({reach:1.35,drop:.95,pivotY:4.6,headRadius:.1,restAngle:.25,postZ:1.35});
export function livingStrikerPose(lengthMm,down,lane=0){
 if(![65,80,95].includes(lengthMm)||!Number.isFinite(down)||down<0||down>1||!Number.isFinite(lane)||Math.abs(lane)>.35)throw Error('Invalid striker geometry pose.');
 const g=STRIKER_GEOMETRY,armLength=Math.hypot(g.reach,g.drop),angle=g.restAngle+(Math.atan2(-g.drop,g.reach)-g.restAngle)*down;
 const pivot=[.85*lengthMm/10-g.reach,g.pivotY,lane];
 return {armLength,angle,pivot,head:[pivot[0]+armLength*Math.cos(angle),pivot[1]+armLength*Math.sin(angle),lane]};
}
