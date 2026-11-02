import {canonicalExpressionScore,evaluateExpression,compileExpression} from '../midi2/expression.js';
import {DEFAULT_PATCH,validatePatch} from '../model.js';
import {adsrLevel,aperture01} from '../dynamics.js';

const compiledScores=new WeakMap();
export const EXPRESSION_LIMITS=Object.freeze({voices:8,events:512,lastEventSeconds:30,durationSeconds:40});
export function createExpressionPerformance(score,patch=DEFAULT_PATCH,sampleRate=48000,options={}){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000)throw new Error('Unsupported sample rate');
 const saved=JSON.parse(canonicalExpressionScore(score)),instrument=validatePatch(patch);
 if(saved.events.length>EXPRESSION_LIMITS.events)throw new Error('This expressive study supports at most 512 events.');
 const lastTime=saved.events.at(-1)?.time??0;
 if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Performance options must be an object.');
 for(const key of Object.keys(options))if(key!=='endSeconds')throw new Error(`Unknown performance option: ${key}`);
 const endSeconds=options.endSeconds??lastTime;
 if(!Number.isFinite(endSeconds)||endSeconds<lastTime||endSeconds>EXPRESSION_LIMITS.lastEventSeconds)throw new Error('Performance end must include every event and fit within30 seconds.');
 if(lastTime>EXPRESSION_LIMITS.lastEventSeconds)throw new Error('This expressive study supports events within 30 seconds.');
 const compiled=compileExpression(saved),final=compiled.at(lastTime);
 if(!final.voices.length||final.voices.length>EXPRESSION_LIMITS.voices)throw new Error('This expressive study needs 1–8 voices.');
 if(final.voices.some(v=>v.effectiveNoteOff===null))throw new Error('Release every note and the sustain pedal before rendering this finite study.');
 const voices=final.voices.map(v=>({voiceId:v.voiceId,address:{...v.address},noteOn:v.noteOn,noteOff:v.effectiveNoteOff,end:v.effectiveNoteOff+instrument.bellows.adsr.r}));
 const duration=Math.max(endSeconds,...voices.map(v=>v.end))+.25;
 if(Math.ceil(duration*1000)*voices.length>500000)throw new Error('Expression control schedule exceeds the study budget.');
 if(duration>EXPRESSION_LIMITS.durationSeconds)throw new Error('This expressive study exceeds 40 seconds including release.');
 const performance=Object.freeze({version:1,score:compiled.score,patch:instrument,sampleRate,voices,duration,reported:final.reported,
  interpretation:'MIDI 2.0 symbolic expression mapped to a subtractive synthesizer; per-voice source seed is patch.seed + voiceId * 997 modulo 2^32; no live MIDI transport or acoustic chamber simulation.',
  unusedPatchControls:['bellows.cutoffHz','bellows.resonance','bellows.envAmount','bellows.keyTrack','bellows.lfo']});
 compiledScores.set(performance,compiled);return performance;
}

/** One analytic instrument mapping for the display and the sampled audio controls. */
export function expressionFrame(performance,time){
 const evaluated=compiledScores.has(performance)?compiledScores.get(performance).at(time):evaluateExpression(performance.score,time),b=performance.patch.bellows;
 return {time,reported:evaluated.reported,voices:evaluated.voices.map(v=>{
  const env=adsrLevel(time,v.noteOn,v.effectiveNoteOff,b.adsr),end=v.effectiveNoteOff===null?null:v.effectiveNoteOff+b.adsr.r;
  const cutoffHz=Math.min(.45*performance.sampleRate,200*2**(6*v.brightness01)),q=.5*36**v.timbre01;
  const frequencyHz=Math.min(.45*performance.sampleRate,v.hz),gain=env.level*v.velocity01*(.5+.5*v.pressure01);
  return {...v,env,end,retired:end!==null&&time>=end,gain,frequencyHz,cutoffHz,q,aperture01:aperture01(cutoffHz),fill01:1-env.level,
   pitchClamped:v.pitchHcu<0||v.pitchHcu>127.999||frequencyHz!==v.hz,pitchMeaning:b.source==='air'?'noise playback rate; no fundamental':'oscillator frequency'};
 })};
}

/** Fixed-rate points plus every message/ADSR corner. Step messages receive a left
 * limit followed by a set at the exact event, preventing pre-event pitch ramps. */
export function expressionControlTimeline(performance,controlRate=1000){
 if(!Number.isInteger(controlRate)||controlRate<200||controlRate>4000)throw new Error('Control rate must be 200–4000 Hz.');
 if(Math.ceil(performance.duration*controlRate)*performance.voices.length>500000)throw new Error('Expression control schedule exceeds the study budget.');
 const points=new Set([0,performance.duration]),events=new Set(performance.score.events.map(e=>e.time));
 for(let i=1;i<performance.duration*controlRate;i++)points.add(i/controlRate);
 for(const t of events)points.add(t);
 const adsr=performance.patch.bellows.adsr;
 for(const v of performance.voices)for(const t of [v.noteOn,v.noteOn+adsr.a,v.noteOn+adsr.a+adsr.d,v.noteOff,v.end])if(t<=performance.duration)points.add(t);
 return [...points].sort((a,b)=>a-b).map(time=>({time,step:events.has(time),leftTime:events.has(time)&&time>0?Math.max(0,time-1e-9):null}));
}
