import {createGroveSession} from './session.js';
import {createGroveVoiceSession} from './voice-session.js';
import {FrameClock} from '../clock.js';
import {traceHash} from '../state.js';
const stable=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
/** Rebuild the recorded model, never trusting redundant gain or buffer-slot data. */
export function createGroveMoviePlan(recording,camera){
 const capture=structuredClone(recording),pose=structuredClone(camera);
 if(capture?.version!==1||!['imagimusic-grove','imagimusic-grove-voice'].includes(capture.kind)||!Array.isArray(capture.events)||!capture.events.length||capture.events.length>128)throw new Error('A supported, nonempty Grove capture is required');
 for(const key of ['position','target'])if(!Array.isArray(pose?.[key])||pose[key].length!==3||!pose[key].every(Number.isFinite))throw new Error('Invalid movie camera');
 if(pose.position.every((x,i)=>x===pose.target[i]))throw new Error('Movie camera must be outside its target');
 const rich=capture.kind==='imagimusic-grove-voice',session=rich?createGroveVoiceSession({grove:capture.grove,voice:capture.voice},capture.sampleRate):createGroveSession(capture.grove,capture.sampleRate);
 for(const event of capture.events)if(!session.strike(event).accepted)throw new Error('Capture exceeds Grove admission limits');
 if(capture.ended!==null){if(!capture.ended)throw new Error('Capture ending is missing');session.finish(capture.ended.frame,capture.ended.fadeFrames);}
 if(stable(session.snapshot())!==stable(capture))throw new Error('Capture does not match its reconstructed model');
 const ring=rich?session.instrument.voice.ring:session.instrument.ring,unitLength=Math.ceil(ring*capture.sampleRate);
 const fullLength=Math.max(...capture.events.map(e=>e.frame+unitLength)),audioSamples=capture.ended?Math.min(fullLength,capture.ended.frame+capture.ended.fadeFrames):fullLength;
 if(audioSamples<1)throw new Error('Movie needs a nonempty soundtrack');
 const fps=30,duration=audioSamples/capture.sampleRate,times=new FrameClock({fps}).times(duration);
 const sample=time=>session.visual(time);
 const manifest={version:1,kind:'imagimusic-grove-movie',capture,camera:{position:pose.position,target:pose.target,fov:42,zoom:1},width:1280,height:720,fps,sampleRate:capture.sampleRate,audioSamples,duration,frames:times.length,videoDuration:times.length/fps,modelFrameHashes:times.map(t=>traceHash(sample(t))),hashScope:'Recorded model response and strike events at each video timestamp; not rendered pixels or encoded bytes.'};
 return {manifest,times,sample};
}
export function validateGroveMovieAudio(pcm,manifest){
 if(pcm?.sampleRate!==manifest.sampleRate||!Array.isArray(pcm.channels)||pcm.channels.length!==2||pcm.channels.some(c=>!(c instanceof Float32Array)||c.length!==manifest.audioSamples))throw new Error('Movie soundtrack must match the captured stereo sample count and rate');
 for(const channel of pcm.channels)for(const value of channel)if(!Number.isFinite(value))throw new Error('Movie soundtrack contains a non-finite sample');
}
