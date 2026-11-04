import {validateLivingPersonalSource,createLivingPersonalJourneyStudy,renderLivingPersonalJourneyStudy} from './personal-journey-study.js';
import {stereoWav} from '../loom/model.js';

export function validateLivingPersonalJourneyRequest(value){
 const keys=['kind','version','source'];
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||!keys.every(k=>Object.hasOwn(value,k))||value.kind!=='imagimusic-living-personal-journey-request'||value.version!==1)throw Error('Unsupported personal journey request.');
 return Object.freeze({kind:value.kind,version:1,source:validateLivingPersonalSource(value.source)});
}

export async function renderLivingPersonalJourneyArtifact(value){
 const request=validateLivingPersonalJourneyRequest(value),plan=createLivingPersonalJourneyStudy(request.source);
 if(44+plan.frames*4>64*1024*1024)throw Error('Personal journey exceeds the local WAV preparation limit.');
 const pcm=renderLivingPersonalJourneyStudy(request.source),sourcePeak=pcm.peak,previewGain=8;
 for(const channel of pcm.channels)for(let i=0;i<channel.length;i++){
  channel[i]*=previewGain;if(!Number.isFinite(channel[i])||Math.abs(channel[i])>1)throw Error('Personal phrase exceeds shared preview headroom; no normalization was applied.');
 }
 const wav=stereoWav(pcm),digest=await crypto.subtle.digest('SHA-256',wav);
 const sha256=Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');
 return {kind:'imagimusic-living-personal-journey-artifact',version:1,source:request.source,plan:pcm.plan,previewGain,sampleRate:pcm.sampleRate,frames:pcm.frames,seconds:pcm.seconds,sourcePeak,sha256,wav};
}
