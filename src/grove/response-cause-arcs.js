import * as T from '../../vendor/three/build/three.module.js';
/** Fixed-width interval bands: neither width nor radius encodes an acoustic quantity. */
export function responseArcVertices(radius,start,end,duration=5.025,width=.075){
 if(![radius,start,end,duration,width].every(Number.isFinite)||radius<=width||width<=0||duration<=0||start<0||end<start||end>duration)throw new Error('Invalid trace interval');
 const steps=Math.ceil((end-start)/duration*128),values=new Float32Array(steps*18);let offset=0;
 const point=(time,r)=>{const angle=-Math.PI/4+2*Math.PI*time/duration;return [r*Math.cos(angle),.06,r*Math.sin(angle)];};
 for(let i=0;i<steps;i++){const t0=start+(end-start)*i/steps,t1=start+(end-start)*(i+1)/steps,a=point(t0,radius-width/2),b=point(t0,radius+width/2),c=point(t1,radius+width/2),d=point(t1,radius-width/2);values.set([...a,...b,...c,...a,...c,...d],offset);offset+=18;}
 return values;
}
export function createResponseCauseArcs({duration=5.025}={}){
 const root=new T.Group(),specs=[{radius:4.4,color:0xe7c887},{radius:2.12,color:0xe7e2ee},{radius:2.28,color:0xdc9572}],capacity=(128+256)*18;
 const meshes=specs.map(({color})=>{const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(capacity),3));geometry.setDrawRange(0,0);const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({color,transparent:true,opacity:.75,side:T.DoubleSide,depthWrite:false}));mesh.frustumCulled=false;root.add(mesh);return mesh;});
 let previous='';
 function set(history){
  const key=JSON.stringify(history);if(key===previous)return;
  if(history.contacts.length>256)throw new Error('Too many trace intervals');
  const groups=[[history.source],history.contacts.filter(c=>c.zone===0),history.contacts.filter(c=>c.zone===1)],arrays=groups.map((spans,i)=>spans.map(span=>responseArcVertices(specs[i].radius,span.start,span.end,duration)));
  for(const [i,chunks] of arrays.entries()){const attr=meshes[i].geometry.attributes.position;let offset=0;for(const chunk of chunks){if(offset+chunk.length>capacity)throw new Error('Trace interval capacity exceeded');attr.array.set(chunk,offset);offset+=chunk.length;}attr.needsUpdate=true;meshes[i].geometry.setDrawRange(0,offset/3);}
  previous=key;
 }
 function reset(){previous='';meshes.forEach(mesh=>mesh.geometry.setDrawRange(0,0));}
 return {root,set,reset,dispose(){meshes.forEach(mesh=>{mesh.geometry.dispose();mesh.material.dispose();});root.removeFromParent();}};
}
