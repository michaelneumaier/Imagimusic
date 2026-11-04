import {readContinuousTineRecord,renderContinuousTineRecord} from './continuous-tine-record.js';
/** Raw pickup samples, with the recorded ending. No preview gain, ceiling,
 * normalization or integer quantization is baked into this mono float32 WAV.
 */
export function prepareContinuousReturnAudio(text){
 const pcm=renderContinuousTineRecord(readContinuousTineRecord(text)),samples=pcm.channels[0];
 const wav=new ArrayBuffer(58+samples.length*4),view=new DataView(wav);
 const tag=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};
 tag(0,'RIFF');view.setUint32(4,wav.byteLength-8,true);tag(8,'WAVE');tag(12,'fmt ');view.setUint32(16,18,true);
 view.setUint16(20,3,true);view.setUint16(22,1,true);view.setUint32(24,pcm.sampleRate,true);view.setUint32(28,pcm.sampleRate*4,true);view.setUint16(32,4,true);view.setUint16(34,32,true);view.setUint16(36,0,true);
 tag(38,'fact');view.setUint32(42,4,true);view.setUint32(46,pcm.frames,true);tag(50,'data');view.setUint32(54,pcm.frames*4,true);
 for(let i=0;i<samples.length;i++)view.setFloat32(58+i*4,samples[i],true);
 return {kind:'imagimusic-continuous-return-audio',version:1,record:pcm.record,sampleRate:pcm.sampleRate,frames:pcm.frames,wav};
}
