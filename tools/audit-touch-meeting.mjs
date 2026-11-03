import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {meeting,DEFAULT_MEETING,ANSWER_SAMPLE_SECONDS} from '../src/score/call-answer.js';
import {LOOM_JOURNEY_SETTINGS} from '../src/score/loom-journey.js';
import {createLoomPerformance,loomPerformanceFrame} from '../src/loom/performance.js';
export function auditTouchMeeting(){
 const rows=[];
 for(const [id,settings] of Object.entries(LOOM_JOURNEY_SETTINGS)){
  const base=[{time:0,body:0,velocity:.7}],uninterrupted=createLoomPerformance(settings,base);
  for(const body of [0,1])for(let frame=400;frame<20000;frame+=88){
   const time=frame/8000,note={time,body,velocity:.35},reading=meeting(settings,base,note);
   let withoutPeak=0;
   // Use the same grid and floating-point loop as the existing cue, isolating the baseline change.
   for(let dt=0;dt<=DEFAULT_MEETING.windowSeconds;dt+=ANSWER_SAMPLE_SECONDS)
    withoutPeak=Math.max(withoutPeak,loomPerformanceFrame(uninterrupted,time+dt).envelope[body]);
   const ratio=withoutPeak>0?reading.after/withoutPeak:null;
   const relativeToUninterrupted=ratio===null?'undefined':ratio>1.05?'grows':ratio<.95?'softens':'unchanged';
   rows.push({id,body,frame,time,before:reading.before,withTouchPeak:reading.after,withoutTouchPeak:withoutPeak,beforeAfterRelation:reading.relation,relativeToUninterrupted,ratioToUninterrupted:ratio});
  }
 }
 const disagreements=rows.filter(row=>row.beforeAfterRelation!=='first'&&row.beforeAfterRelation!==row.relativeToUninterrupted);
 return {method:'First left gesture strength 0.7 at t=0; second gesture strength 0.35 on either body. Three production presets. Onsets on an 8 kHz frame grid, frames 400 through <20000 in steps of 88. Existing cue compares pre-touch envelope with its sampled post-touch maximum; this audit also measures the no-new-touch maximum on the identical 50 ms / 2 ms grid.',limits:'Sampled envelope comparison, not energy, perceived loudness or a continuous maximum. Different classifications need not be code errors: the two baselines answer different questions. Near-zero baselines can make ratios unstable. No model or cue changed.',count:rows.length,disagreementCount:disagreements.length,examples:disagreements.slice(0,12),rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)console.log(JSON.stringify(auditTouchMeeting(),null,2));
