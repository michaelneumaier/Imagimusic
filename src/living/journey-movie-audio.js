import {readLivingJourneyReport} from './journey-report.js';

/** Decode only the canonical stereo PCM16 container produced by this study.
 * Film encodes the actual kept samples, not a fresh Float32 approximation.
 */
export async function prepareLivingJourneyMovieAudio(artifact,manifest,{signal,digest=bytes=>crypto.subtle.digest('SHA-256',bytes)}={}){
 const check=()=>{if(signal?.aborted)throw new DOMException('Journey soundtrack preparation cancelled.','AbortError');};
 check();
 if(!(artifact?.wav instanceof ArrayBuffer)||artifact.wav.byteLength<44||artifact.wav.byteLength>64*1024*1024)throw Error('Use a bounded generated journey WAV.');
 // Snapshot before hashing yields: caller edits cannot change this soundtrack.
 const wav=artifact.wav.slice(0),{wav:ignored,...fields}=artifact;
 const reportText=JSON.stringify(fields),kept=readLivingJourneyReport(reportText),report=JSON.parse(reportText);
 if(manifest?.kind!=='imagimusic-living-journey-movie-plan'||manifest.version!==1||JSON.stringify(kept.request)!==JSON.stringify(manifest.request)||JSON.stringify(kept.plan)!==JSON.stringify(manifest.journey)||manifest.sampleRate!==report.sampleRate||manifest.audioSamples!==report.frames||manifest.duration!==report.seconds)throw Error('The soundtrack belongs to a different journey film.');
 const sampleRate=report.sampleRate,frames=report.frames;
 const view=new DataView(wav),tag=offset=>String.fromCharCode(...new Uint8Array(wav,offset,4));
 if(wav.byteLength!==44+frames*4||tag(0)!=='RIFF'||view.getUint32(4,true)!==wav.byteLength-8||tag(8)!=='WAVE'||tag(12)!=='fmt '||view.getUint32(16,true)!==16||view.getUint16(20,true)!==1||view.getUint16(22,true)!==2||view.getUint32(24,true)!==sampleRate||view.getUint32(28,true)!==sampleRate*4||view.getUint16(32,true)!==4||view.getUint16(34,true)!==16||tag(36)!=='data'||view.getUint32(40,true)!==frames*4)throw Error('The journey soundtrack is not its canonical stereo PCM16 WAV.');
 const sha256=Array.from(new Uint8Array(await digest(wav)),v=>v.toString(16).padStart(2,'0')).join('');check();
 if(sha256!==kept.expectedSha256)throw Error('The journey soundtrack failed its kept audio identity check.');
 const channels=[new Float32Array(frames),new Float32Array(frames)];
 for(let i=0;i<frames;i++)for(let ch=0;ch<2;ch++)channels[ch][i]=view.getInt16(44+(i*2+ch)*2,true)/32768;
 check();
 return {wav,report,pcm:{sampleRate,frames,channels},evidence:{sha256,sampleRate,frames,channels:2,format:'stereo PCM16 WAV',previewGain:8,decoding:'Signed PCM16 divided by32768. AAC input is the decoded kept WAV, with no additional gain; original Float32 samples are not recovered.'}};
}
