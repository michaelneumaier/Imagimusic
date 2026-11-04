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

export const LIVING_PHRASE_SPACING=Object.freeze({
 close:Object.freeze({name:'Closer',scale:.7}),
 original:Object.freeze({name:'Original pace',scale:1}),
 open:Object.freeze({name:'More space',scale:1.25}),
});
/** Direction v1 retains the seeded musical cell, accents and final decay.
 * Adjust the shared pulse, with a ceiling at the four-second touch boundary.
 * Always derive from grammar1, so changing direction never accumulates rounding.
 */
export function createLivingDirectedPhrase(seed,spacing='original'){
 if(typeof spacing!=='string'||!Object.hasOwn(LIVING_PHRASE_SPACING,spacing))throw Error('Choose a supported phrase spacing.');
 const basis=createLivingGeneratedPhrase(seed),first=basis.source.events[0].frame;
 const lastTick=(basis.source.events.at(-1).frame-first)/basis.pulseFrames;
 const pulseFrames=Math.min(Math.round(basis.pulseFrames*LIVING_PHRASE_SPACING[spacing].scale),Math.floor((4*basis.source.sampleRate-first)/lastTick));
 const events=basis.source.events.map(e=>({frame:first+(e.frame-first)/basis.pulseFrames*pulseFrames,strength:e.strength}));
 const source=validateTineLiveRecord({...basis.source,events,fadeStart:events.at(-1).frame+60000});
 return Object.freeze({...basis,kind:'imagimusic-living-directed-phrase',version:1,spacing,pulseFrames,source});
}
