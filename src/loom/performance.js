import {makeLoom,loomLevel,MAX_VISIBLE_BEAT_HZ} from './model.js';

/** All strikes excite the same fixed linear system. Geometry changes start a new passage. */
export function createLoomPerformance(settings={},score){
 const studies=[makeLoom(settings,0),makeLoom(settings,1)];
 // One pickup scale for BOTH excitation directions, so equal velocity means equal impulse.
 const pickupPeak=Math.max(...studies.flatMap(s=>[0,1].flatMap(body=>s.response.bodyModes(body).map(m=>Math.abs(m.amplitude)))));
 for(const study of studies)study.modes=[0,1].map(body=>study.response.bodyModes(body).map(m=>({...m,amplitude:.19*m.amplitude/pickupPeak,phase:0})));
 const notes=score??Array.from({length:8},(_,i)=>({time:.35+i*1.25,body:i%2,velocity:i%4===0?.8:.55}));
 if(!Array.isArray(notes)||notes.length===0||notes.length>256)throw new Error('A Loom passage needs 1–256 strikes');
 const events=notes.map((note,i)=>{
  const {time,body,velocity}=note;
  if(!Number.isFinite(time)||time<0||time>120||![0,1].includes(body)||!Number.isFinite(velocity)||velocity<=0||velocity>1)throw new Error('Invalid Loom strike');
  return {id:`loom-${i}`,time,body,velocity,end:time+studies[body].duration};
 }).sort((a,b)=>a.time-b.time);
 // Conservative global peak bound; preserves relative pickup gains and all interference.
 const bound=Math.max(...[0,1].map(body=>events.reduce((sum,e)=>sum+e.velocity*studies[e.body].modes[body].reduce((s,m)=>s+Math.abs(m.amplitude),0),0)));
 return {settings:{...studies[0].settings},studies,events,duration:Math.max(...events.map(e=>e.end)),pickupScale:.19/pickupPeak,audioGain:.45/Math.max(1,bound)};
}

/** Exact displacement pickup and envelope at any timestamp, independent of frame history. */
export function loomPerformanceFrame(passage,time){
 if(!Number.isFinite(time))throw new Error('Frame time must be finite');
 const frequencies=passage.studies[0].system.normalFreqsHz;
 const averaged=frequencies[1]-frequencies[0]>MAX_VISIBLE_BEAT_HZ;
 const quadratures=Array.from({length:2},()=>frequencies.map(()=>[0,0]));
 const displacement=[0,0];
 for(const e of passage.events){
  const age=time-e.time,study=passage.studies[e.body];
  if(age<0||age>=study.duration)continue;
  const level=e.velocity*loomLevel(study,age);
  study.modes.forEach((modes,body)=>modes.forEach((m,i)=>{
   const amplitude=level*m.amplitude*Math.exp(-age/m.decay);
   const phase=2*Math.PI*m.frequency*age+m.phase;
   displacement[body]+=amplitude*Math.sin(phase);
   // Remove one common carrier; preserve the phase between strikes AND modes.
   const relative=phase-2*Math.PI*frequencies[0]*time;
   quadratures[body][i][0]+=amplitude*Math.cos(relative);
   quadratures[body][i][1]+=amplitude*Math.sin(relative);
  }));
 }
 const envelope=quadratures.map(modes=>averaged?Math.sqrt(modes.reduce((s,[re,im])=>s+re*re+im*im,0)):Math.hypot(...modes.reduce((sum,q)=>[sum[0]+q[0],sum[1]+q[1]],[0,0])));
 return {time,displacement,envelope,averaged,strikes:passage.events.filter(e=>time>=e.time-.18&&time<e.time+.28).map(e=>({id:e.id,body:e.body,age:time-e.time,velocity:e.velocity}))};
}

export function renderLoomPerformance(passage,sampleRate=48000){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('Unsupported sample rate');
 const channels=[new Float32Array(Math.ceil(passage.duration*sampleRate)),new Float32Array(Math.ceil(passage.duration*sampleRate))];
 // Sum in event order, including sub-sample onsets, with bounded, explicit tails.
 for(const e of passage.events){
  const study=passage.studies[e.body],start=Math.ceil(e.time*sampleRate),end=Math.min(channels[0].length,Math.ceil(e.end*sampleRate));
  for(let i=start;i<end;i++){
   const age=i/sampleRate-e.time,gain=passage.audioGain*e.velocity*loomLevel(study,age);
   for(let body=0;body<2;body++){
    let value=0;
    for(const m of study.modes[body])value+=m.amplitude*Math.exp(-age/m.decay)*Math.sin(2*Math.PI*m.frequency*age+m.phase);
    channels[body][i]+=gain*value;
   }
  }
 }
 return {channels,sampleRate};
}
