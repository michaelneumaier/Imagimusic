import {parseTouchRecord} from './record.js';
import {renderTouchBank,renderTouchRecording} from './session.js';
// At most 64 MB of returned stereo Float32 PCM. Check before rendering banks
// or allocating the mixer output/scratch arrays. This is a return-page budget,
// not a change to the source record or the live instrument's admission rules.
export const TOUCH_RETURN_MAX_FRAMES=8_000_000;
export function prepareTouchReturn(text){
 const {record,session}=parseTouchRecord(text);
 const bankFrames=session.units.map(unit=>Math.ceil(unit.duration*record.sampleRate));
 const naturalFrames=Math.max(...record.events.map(event=>event.frame+bankFrames[event.body]));
 const frames=record.ended?Math.min(naturalFrames,record.ended.frame+record.ended.fadeFrames):naturalFrames;
 if(frames>TOUCH_RETURN_MAX_FRAMES)throw new Error('This passage exceeds the return page’s 8 million sample-frame budget. Keep the source file; it has not been shortened.');
 const pcm=renderTouchRecording(record,renderTouchBank(session));
 if(pcm.channels[0].length!==frames)throw new Error('The rebuilt passage length differs from its preparation budget.');
 return {record,pcm,duration:frames/record.sampleRate};
}
