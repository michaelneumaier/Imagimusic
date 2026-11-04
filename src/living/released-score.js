/** Arrangement3 composition, derived internally from a validated spacious plan.
 * Keep these onset-group, release and settling rules stable for its identity.
 * First reply uses ideal distributed modal loss, not localized contact. Later
 * complete motifs and original solo return preserve their local source records.
 */
export function createLivingReleasedScore(spaced){
 const events=spaced.source.events,groups=[...new Set(events.map(e=>e.frame))],last=groups[Math.ceil(groups.length/2)-1];
 const bodies=spaced.bodies.map((body,i)=>i===1?Object.freeze({...body,events:Object.freeze(body.events.filter(e=>e.frame<=last))}):body);
 const base={...spaced,bodies:Object.freeze(bodies),derivation:Object.freeze({rule:'first-half-onset-groups',retainedSourceIndices:Object.freeze(events.flatMap((e,i)=>e.frame<=last?[i]:[])),omittedSourceIndices:Object.freeze(events.flatMap((e,i)=>e.frame>last?[i]:[]))})},body=base.bodies[1];
 const release=Object.freeze({startFrame:Math.min(body.fadeStart,body.events.at(-1).frame+Math.round(.45*base.sampleRate)),addedDecayRate:12});
 const onsets=[...new Set(base.source.events.map(e=>e.frame))],intervals=onsets.slice(1).map((t,i)=>t-onsets[i]).sort((a,b)=>a-b),mid=Math.floor(intervals.length/2);
 const median=intervals.length?(intervals.length%2?intervals[mid]:(intervals[mid-1]+intervals[mid])/2):.65*base.sampleRate;
 const settleFrames=Math.round(Math.max(.4*base.sampleRate,Math.min(.8*base.sampleRate,median)));
 const desiredNext=base.voices[1].startFrame+release.startFrame+settleFrames-base.source.events[0].frame;
 // Never lengthen an already compact exchange. Move the subsequent full voices
 // and return together, preserving their internal rhythm and relative spacing.
 const advanceFrames=Math.max(0,base.voices[2].startFrame-desiredNext);
 const voices=base.voices.map((voice,i)=>i<2?voice:Object.freeze({...voice,startFrame:voice.startFrame-advanceFrames,endFrame:voice.endFrame-advanceFrames}));
 return Object.freeze({...base,kind:'imagimusic-living-arrangement',version:3,voices:Object.freeze(voices),returnStart:base.returnStart-advanceFrames,frames:base.frames-advanceFrames,releases:Object.freeze([null,release,null]),pacing:Object.freeze({rule:'median-onset-interval-settle',settleFrames,advanceFrames})});
}
