import {stereoWav} from '../loom/model.js';
const hex=buffer=>Array.from(new Uint8Array(buffer),v=>v.toString(16).padStart(2,'0')).join('');
export const groveSha256=async bytes=>hex(await crypto.subtle.digest('SHA-256',bytes));
/** Fingerprints of source float samples, separate from lossy AAC and PCM16 WAV. */
export async function groveMovieAudioEvidence(pcm,wavFile){
 const sha256=[];
 for(const channel of pcm.channels){const bytes=new ArrayBuffer(channel.length*4),view=new DataView(bytes);for(let i=0;i<channel.length;i++)view.setFloat32(i*4,channel[i],true);sha256.push(await groveSha256(bytes));}
 const wav=stereoWav(pcm);
 return {wav,audio:{sampleRate:pcm.sampleRate,frames:pcm.channels[0].length,channels:2,sourcePcm:{format:'float32-le',layout:'one hash per planar channel, left then right',sha256},wav:{file:wavFile,format:'stereo PCM16 WAV',sha256:await groveSha256(wav)}}};
}
