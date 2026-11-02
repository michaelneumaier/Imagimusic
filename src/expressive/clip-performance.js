import {importClipScore} from '../midi2/clip-score.js';
import {createExpressionPerformance,expressionFrame} from './performance.js';
import {renderExpressionAudio} from './audio.js';
import {DEFAULT_PATCH} from '../model.js';

/** Admit the entire source before cropping. Receiver configuration is evaluated
 * at its original time; no setup state or message is shifted onto the first note.
 */
export function createClipPerformance(bytes,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Clip performance options must be an object.');
 for(const key of Object.keys(options))if(!['name','patch','sampleRate'].includes(key))throw new Error(`Unknown Clip performance option: ${key}`);
 const {name='MIDI Clip',patch=DEFAULT_PATCH,sampleRate=48000}=options;
 const imported=importClipScore(bytes,{name});
 const performance=createExpressionPerformance(imported.score,patch,sampleRate,{endSeconds:imported.end.seconds});
 const originFrame=Math.ceil(imported.origin.seconds*sampleRate),sourceFrames=Math.ceil(performance.duration*sampleRate);
 const playbackFrames=sourceFrames-originFrame;
 if(playbackFrames<1)throw new Error('The Clip has no playable sample window.');
 return Object.freeze({performance,imported,originFrame,sourceFrames,playbackFrames,
  playbackOriginSeconds:originFrame/sampleRate,duration:playbackFrames/sampleRate,
  originRoundingSeconds:originFrame/sampleRate-imported.origin.seconds,
  timingPolicy:'Render the bounded full source, then start at the first sample at or after Start of Clip. Preserve ending silence and release tails. The picture follows that same source sample time.'});
}

export function clipExpressionFrame(clip,time){
 if(!Number.isFinite(time)||time<0||time>clip.duration)throw new RangeError('Clip playback time is outside its prepared window.');
 return expressionFrame(clip.performance,clip.playbackOriginSeconds+time);
}

export async function renderClipAudio(clip,{render=renderExpressionAudio,...options}={}){
 const pcm=await render(clip.performance,options);
 if(pcm.sampleRate!==clip.performance.sampleRate||pcm.channels.length!==1||!(pcm.channels[0] instanceof Float32Array)||pcm.channels[0].length!==clip.sourceFrames)throw new Error('Full Clip render does not match its admitted sample window.');
 return {sampleRate:pcm.sampleRate,channels:[pcm.channels[0].slice(clip.originFrame)]};
}
