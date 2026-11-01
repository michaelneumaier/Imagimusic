import {validateGrove} from '../score/grove.js';
const NS='http://www.w3.org/2000/svg',colors=['#a4d0b8','#d8b5d8','#9fc7dc'];
/** Static diagram only: positions and connections from the saved Grove.
 * Width encodes each spring’s stiffness ratio to its original value, not absolute stiffness across different springs.
 */
export function createStructureDiagram(grove,original,label){
 validateGrove(grove);validateGrove(original);
 if(JSON.stringify(grove.bodies)!==JSON.stringify(original.bodies))throw new Error('Relative connection view requires unchanged bodies.');
 const make=(name,attrs={})=>{const el=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el;};
 const svg=make('svg',{viewBox:'0 0 300 160',role:'img','aria-label':`${label}: ${grove.bridges.map(b=>`connection ${b.a+1} to ${b.b+1}, ${(b.coupling/original.bridges.find(e=>e.a===b.a&&e.b===b.b).coupling).toFixed(2)} times original stiffness`).join('; ')}`});
 svg.style.cssText='display:block;width:100%;max-width:360px;background:#18222d;border-radius:16px';
 const points=grove.layout.map(p=>({x:150+100*p.x,y:80+50*p.z}));
 for(const b of grove.bridges){const a=points[b.a],z=points[b.b];svg.append(make('line',{x1:a.x,y1:a.y,x2:z.x,y2:z.y,stroke:'#d5b982','stroke-width':3*b.coupling/original.bridges.find(e=>e.a===b.a&&e.b===b.b).coupling,'stroke-linecap':'round'}));}
 for(const [i,p] of points.entries()){
  svg.append(make('circle',{cx:p.x,cy:p.y,r:16,fill:colors[i],stroke:'#18222d','stroke-width':3}));
  const text=make('text',{x:p.x,y:p.y+5,'text-anchor':'middle',fill:'#16202a','font-family':'system-ui,sans-serif','font-size':14,'font-weight':650});text.textContent=String(i+1);svg.append(text);
 }
 return svg;
}
