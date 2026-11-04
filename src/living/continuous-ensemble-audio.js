import {readContinuousEnsembleRecord,renderContinuousEnsembleRecord} from './continuous-ensemble-record.js';
import {encodeContinuousFloatWav} from './continuous-return-audio.js';
/** Exact raw average of three recorded pickup channels, including their shared
 * ending. No listening gain, sample ceiling, normalization or PCM16 conversion. */
export function prepareContinuousEnsembleAudio(text){
 const pcm=renderContinuousEnsembleRecord(readContinuousEnsembleRecord(text));
 return {kind:'imagimusic-continuous-ensemble-audio',version:1,record:pcm.record,sampleRate:pcm.sampleRate,frames:pcm.frames,wav:encodeContinuousFloatWav(pcm)};
}
