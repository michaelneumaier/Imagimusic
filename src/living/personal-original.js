import {validateLivingPersonalSource} from './personal-journey-study.js';
import {stereoWav} from '../loom/model.js';

/** Match the isolated opening's centered stereo, fixed gain8 and PCM16 format. */
export function personalOriginalWav(pcm,value){
 const source=validateLivingPersonalSource(value),frames=source.fadeStart+Math.round(.025*source.sampleRate);
 if(JSON.stringify(pcm?.record)!==JSON.stringify(source)||pcm.sampleRate!==source.sampleRate||pcm.frames!==frames||pcm.channels?.length!==1||!(pcm.channels[0] instanceof Float32Array)||pcm.channels[0].length!==frames)throw Error('The original recording does not match your phrase.');
 const channels=[Math.cos(Math.PI/4),Math.sin(Math.PI/4)].map(gain=>{
  const channel=Float32Array.from(pcm.channels[0],sample=>0+sample*gain);
  for(let i=0;i<channel.length;i++){channel[i]*=8;if(!Number.isFinite(channel[i])||Math.abs(channel[i])>1)throw Error('The original exceeds preview headroom.');}
  return channel;
 });
 return stereoWav({sampleRate:source.sampleRate,frames,channels});
}
