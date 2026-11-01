import {createResponseCauseArcs} from './response-cause-arcs.js';
import * as T from '../../vendor/three/build/three.module.js';
export const RESPONSE_TRACE_COLORS=[0xa4d0b8,0xd8b5d8,0x9fc7dc];
/** Presentation only: time circles the base once over the fixed encounter window.
 * Radius = 2.4 + .7*body + .5*tanh(8*envelope). Never normalized to the passage.
 * Samples are connected only across short gaps; this is not energy or wave travel. */
export function responseTracePoint(body,time,envelope,duration=5.025){
 if(!Number.isInteger(body)||body<0||body>2||!Number.isFinite(duration)||duration<=0||!Number.isFinite(time)||time<0||time>duration||!Number.isFinite(envelope)||envelope<0)throw new Error('Invalid response trace sample');
 const angle=-Math.PI/4+2*Math.PI*time/duration,radius=2.4+.7*body+.5*Math.tanh(8*envelope);
 return [radius*Math.cos(angle),.035,radius*Math.sin(angle)];
}
export function createResponseTrace({duration=5.025,maxSamples=512,maxGap=.15}={}){
 if(!Number.isFinite(duration)||duration<=0||!Number.isInteger(maxSamples)||maxSamples<2||maxSamples>4096||!Number.isFinite(maxGap)||maxGap<=0)throw new Error('Invalid response trace window');
 const root=new T.Group();root.name='Optional sampled response history';root.visible=false;
 const lines=RESPONSE_TRACE_COLORS.map(color=>{
  const geometry=new T.BufferGeometry(),positions=new Float32Array((maxSamples-1)*6);geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setDrawRange(0,0);
  const line=new T.LineSegments(geometry,new T.LineBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false}));line.frustumCulled=false;root.add(line);return line;
 });
 const causeArcs=createResponseCauseArcs({duration});root.add(causeArcs.root);
 const marks=[],labels=[];
 for(const time of [0,2,5]){const angle=-Math.PI/4+2*Math.PI*time/duration,points=[2.25,4.45].map(radius=>new T.Vector3(radius*Math.cos(angle),.04,radius*Math.sin(angle)));const geometry=new T.BufferGeometry().setFromPoints(points),material=new T.LineDashedMaterial({color:0xb8b4bf,transparent:true,opacity:.25,dashSize:.06,gapSize:.08}),mark=new T.Line(geometry,material);mark.computeLineDistances();root.add(mark);marks.push(mark);}
 // Clock labels belong to the browser presentation, not the numerical history.
 if(typeof document!=='undefined')for(const [time,text] of [[0,'0 / 5 s'],[2,'2 s']]){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;const ink=canvas.getContext('2d');ink.font='26px monospace';ink.textAlign='center';ink.fillStyle='#cbc5d3';ink.fillText(text,128,42);
  const texture=new T.CanvasTexture(canvas),material=new T.SpriteMaterial({map:texture,transparent:true,depthWrite:false,sizeAttenuation:false}),label=new T.Sprite(material),angle=-Math.PI/4+2*Math.PI*time/duration;label.position.set(4.6*Math.cos(angle),.1,4.6*Math.sin(angle));root.add(label);labels.push(label);
 }
 let last=null,count=0,segments=0;
 function reset(){causeArcs.reset();last=null;count=segments=0;for(const line of lines)line.geometry.setDrawRange(0,0);}
 function append({time,envelope}){
  if(!Array.isArray(envelope)||envelope.length!==3)throw new Error('Trace needs three body responses');
  const points=envelope.map((value,body)=>responseTracePoint(body,time,value,duration));
  if(last&&time<last.time)throw new Error('Reset the trace before reversing time');
  if(last&&time===last.time||count>=maxSamples)return false;
  if(last&&time-last.time<=maxGap){for(const [body,line] of lines.entries()){
   const attr=line.geometry.attributes.position;attr.array.set([...last.points[body],...points[body]],segments*6);attr.needsUpdate=true;line.geometry.setDrawRange(0,(segments+1)*2);
  }segments++;}
  last={time,points};count++;return true;
 }
 return {root,append,reset,setCauses:history=>causeArcs.set(history),resize(camera){for(const label of labels)label.scale.set(.22/camera.zoom,.055/camera.zoom,1);},setVisible(value){root.visible=!!value;},get stats(){return {samples:count,segments,lastTime:last?.time??null};},dispose(){causeArcs.dispose();for(const line of [...lines,...marks]){line.geometry.dispose();line.material.dispose();}for(const label of labels){label.material.map.dispose();label.material.dispose();}root.removeFromParent();}};
}
/** Consume every stored picture sample, even when display refreshes skip ahead. */
export function advanceResponseTrace(trace,picture,time,index=0){
 if(!Number.isFinite(time)||time<0||!Number.isInteger(index)||index<0||index>picture.frames.length)throw new Error('Invalid response trace playback cursor');
 while(index<picture.frames.length&&picture.frames[index].time<=time)trace.append(picture.frames[index++]);
 return index;
}
