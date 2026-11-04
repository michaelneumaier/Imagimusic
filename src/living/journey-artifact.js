import {createLivingJourneyStudy,renderLivingJourneyStudy} from './journey-study.js';
import {createLivingConnectedJourneyStudy,renderLivingConnectedJourneyStudy} from './connected-journey-study.js';
import {createLivingEvolvingJourneyStudy,renderLivingEvolvingJourneyStudy} from './evolving-journey-study.js';
import {stereoWav} from '../loom/model.js';

const treatments={chapters:[createLivingJourneyStudy,renderLivingJourneyStudy],connected:[createLivingConnectedJourneyStudy,renderLivingConnectedJourneyStudy],evolving:[createLivingEvolvingJourneyStudy,renderLivingEvolvingJourneyStudy]};
export function validateLivingJourneyRequest(value){
 const keys=['kind','version','seed','treatment'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k))||value.kind!=='imagimusic-living-journey-request'||value.version!==1||!Number.isInteger(value.seed)||value.seed<0||value.seed>0xffffffff||typeof value.treatment!=='string'||!Object.hasOwn(treatments,value.treatment))throw Error('Unsupported journey render request.');
 return Object.freeze({...value});
}

/** Transient worker result, not a new saved encounter identity. Preview gain8
 * matches the prepared study WAVs; only the WAV buffer leaves the worker. */
export async function renderLivingJourneyArtifact(value){
 const request=validateLivingJourneyRequest(value),[make,render]=treatments[request.treatment],plan=make(request.seed);
 if(44+plan.frames*4>64*1024*1024)throw Error('Journey exceeds the local WAV preparation limit.');
 const pcm=render(request.seed),sourcePeak=pcm.peak,previewGain=8;
 // These arrays belong to this render. Scale in place to avoid another full
 // stereo allocation before PCM16 encoding; the stored source plan stays exact.
 for(const channel of pcm.channels)for(let i=0;i<channel.length;i++){
  channel[i]*=previewGain;if(!Number.isFinite(channel[i])||Math.abs(channel[i])>1)throw Error('Journey preview gain clips.');
 }
 const wav=stereoWav(pcm),hash=await crypto.subtle.digest('SHA-256',wav);
 const sha256=Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
 return {kind:'imagimusic-living-journey-artifact',version:1,seed:request.seed,treatment:request.treatment,plan:pcm.plan,previewGain,sampleRate:pcm.sampleRate,frames:pcm.frames,seconds:pcm.seconds,sourcePeak,sha256,wav};
}
