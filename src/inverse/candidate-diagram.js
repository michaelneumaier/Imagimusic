const NS='http://www.w3.org/2000/svg';
const points=[[48,96],[150,34],[252,96]],colors=['#a4d0b8','#d8b5d8','#9fc7dc'];
/** A fixed schematic of the three-body candidate's actual connections.
 * Positions and equal line widths encode neither geometry nor spring strength. */
export function createCandidateDiagram(grove){
 const make=(name,attrs={})=>{const el=document.createElementNS(NS,name);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));return el;};
 const pairs=grove.bridges.map(edge=>`${edge.a+1}–${edge.b+1}`);
 const figure=document.createElement('figure');figure.className='candidate-map';
 const svg=make('svg',{viewBox:'0 0 300 132',role:'img','aria-label':`Three bodies. Connections: ${pairs.join(', ')||'none'}. Schematic arrangement.`});
 for(const edge of grove.bridges){const [x1,y1]=points[edge.a],[x2,y2]=points[edge.b];svg.append(make('line',{x1,y1,x2,y2,stroke:'#b4c8c0','stroke-width':3}));}
 points.forEach(([cx,cy],i)=>{
  svg.append(make('circle',{cx,cy,r:19,fill:colors[i],stroke:'#142126','stroke-width':4}));
  const label=make('text',{x:cx,y:cy+5,'text-anchor':'middle',fill:'#142126','font-size':15,'font-family':'system-ui,sans-serif'});label.textContent=String(i+1);svg.append(label);
 });
 const caption=document.createElement('figcaption');caption.textContent=`Connection map · ${pairs.join(' · ')||'no bridges'}`;
 figure.append(svg,caption);return figure;
}
