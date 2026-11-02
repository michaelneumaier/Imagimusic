/** Pure diagnostic coordinates. Circle angle is time, radial offset is envelope;
 * neither means spatial propagation, motion, energy or an acoustic shape. */
export function historyPoint(body,time,envelope,{layout='strips',duration,ceiling}){
 if(![0,1].includes(body)||!['strips','circles'].includes(layout)||!Number.isFinite(duration)||duration<=0||!Number.isFinite(ceiling)||ceiling<=0||!Number.isFinite(time)||time<0||time>duration||!Number.isFinite(envelope)||envelope<0)throw new Error('Invalid history coordinate');
 const value=Math.min(ceiling,envelope)/ceiling;
 if(layout==='strips')return [85+1060*time/duration,220+300*body-175*value];
 const angle=-Math.PI/2+2*Math.PI*time/duration,radius=100+150*body+70*value;
 return [600+radius*Math.cos(angle),355+radius*Math.sin(angle)];
}
export function historyPath(history,body,options){
 let path='',previous=null;const clipped=[];
 for(const point of history.points){
  const xy=historyPoint(body,point.time,point.envelope[body],options);
  const command=previous?.side==='before'&&point.side==='at'&&previous.time===point.time?'M':previous?'L':'M';
  path+=`${command}${xy[0].toFixed(3)} ${xy[1].toFixed(3)} `;
  if(point.envelope[body]>options.ceiling)clipped.push(xy);
  previous=point;
 }
 return {path,clipped};
}
