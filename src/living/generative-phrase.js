import {createTineDesign} from '../tine/address.js';
import {validateTineLiveRecord} from '../tine/live-record.js';

/** Bounded phrase grammar v1: a three-touch cell, a breath, then a related
 * cell. Seeded choices select pulse, rhythm, accents and one final variation.
 * All values are authored musical choices, not inferred emotional qualities.
 * The existing arrangement develops this source across three admitted bodies.
 */
export function createLivingGeneratedPhrase(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Use an unsigned 32-bit phrase seed.');
 let state=seed;
 const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 const choose=values=>values[Math.floor(next()*values.length)];
 const sampleRate=48000,pulseFrames=choose([10560,12000,13440,14880]);
 const motif=choose([[0,1,3],[0,2,3],[0,1,2]]),accents=choose([[.1,.025,.05],[.05,.025,.1],[.1,.05,.025]]);
 const repeatOffsetTicks=choose([5,6,7]),variation=choose(['repeat','linger','soften']);
 const second=motif.map((tick,i)=>tick+repeatOffsetTicks+(variation==='linger'&&i===2?1:0));
 const ticks=[...motif,...second],strengths=[...accents,...accents.map(x=>variation==='soften'?x*.5:x)];
 const events=ticks.map((tick,i)=>({frame:16800+tick*pulseFrames,strength:strengths[i]}));
 const source=validateTineLiveRecord({kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate,events,fadeStart:events.at(-1).frame+Math.round(1.25*sampleRate)});
 return Object.freeze({kind:'imagimusic-living-generated-phrase',version:1,seed,pulseFrames,motif:Object.freeze([...motif]),accents:Object.freeze([...accents]),repeatOffsetTicks,variation,source});
}
