import {createLivingJourneyStudy} from './journey-study.js';
import {renderLivingArrangementBody} from './arrangement.js';

/** Study treatment: remove intermediate solo openings/returns, keeping the
 * same five exchanges. Join by last-to-first touch timing, not file endings.
 * Overlapping voices remain independent rendered passes, not a shared body
 * simulation. The final return begins after all preceding stems have ended.
 */
export function createLivingConnectedJourneyStudy(seed){
 const basis=createLivingJourneyStudy(seed),rate=basis.sampleRate;
 const sections=[],voices=[];
 let previousLastTouch=0,previousEnd=0;
 for(let i=0;i<basis.sections.length;i++){
  const chapter=basis.sections[i],plan=chapter.arrangement;
  const selected=plan.voices.filter(v=>v.part===(i===0?'opening':i===basis.sections.length-1?'return':'answer'));
  const firstLocalTouch=Math.min(...selected.map(v=>v.startFrame+plan.bodies[v.body].events[0].frame));
  const gapFrames=Math.round((i===1||i===basis.sections.length-1?1.8:.55)*rate);
  const firstTouch=i===0?firstLocalTouch:Math.max(previousLastTouch+gapFrames,i===basis.sections.length-1?previousEnd:0);
  const offset=firstTouch-firstLocalTouch;
  const chapterVoices=selected.map(v=>Object.freeze({...v,section:i,startFrame:v.startFrame+offset,endFrame:v.endFrame+offset}));
  const lastTouch=Math.max(...chapterVoices.map(v=>v.startFrame+plan.bodies[v.body].events.at(-1).frame));
  const endFrame=Math.max(...chapterVoices.map(v=>v.endFrame));
  sections.push(Object.freeze({name:chapter.name,source:chapter.source,arrangement:plan,startFrame:Math.min(...chapterVoices.map(v=>v.startFrame)),firstTouchFrame:firstTouch,lastTouchFrame:lastTouch,endFrame}));
  voices.push(...chapterVoices);
  previousLastTouch=lastTouch;previousEnd=Math.max(previousEnd,endFrame);
 }
 return Object.freeze({kind:'imagimusic-living-connected-journey-study',version:1,seed,sampleRate:rate,frames:previousEnd,sections:Object.freeze(sections),voices:Object.freeze(voices)});
}

export function renderLivingConnectedJourneyStudy(seed){
 const plan=createLivingConnectedJourneyStudy(seed),sum=[new Float64Array(plan.frames),new Float64Array(plan.frames)];
 for(let i=0;i<plan.sections.length;i++){
  const section=plan.sections[i],stems=section.arrangement.bodies.map((_,body)=>renderLivingArrangementBody(section.arrangement,body).channels[0]);
  for(const voice of plan.voices.filter(v=>v.section===i)){
   const angle=(voice.pan+1)*Math.PI/4,gains=[Math.cos(angle)*voice.gain,Math.sin(angle)*voice.gain];
   for(let ch=0;ch<2;ch++)for(let f=0;f<stems[voice.body].length;f++)sum[ch][voice.startFrame+f]+=stems[voice.body][f]*gains[ch];
  }
 }
 const channels=sum.map(c=>Float32Array.from(c));let peak=0;
 for(const channel of channels)for(const value of channel)peak=Math.max(peak,Math.abs(value));
 if(!Number.isFinite(peak)||peak>1)throw Error('Connected journey exceeds source PCM range.');
 return {plan,channels,sampleRate:plan.sampleRate,frames:plan.frames,seconds:plan.frames/plan.sampleRate,peak};
}
