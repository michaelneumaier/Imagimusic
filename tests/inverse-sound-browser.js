import {stereoWav} from '../src/loom/model.js';
import {readInverseSoundFile,parseInverseSound} from '../src/inverse/sound-file.js';
import {createInverseJobs} from '../src/inverse/jobs.js';
const result=document.getElementById('result');
const jobs=createInverseJobs({makeWorker:()=>new Worker(new URL('../src/inverse/sound-worker.js',import.meta.url),{type:'module'})});
try{
 const file=new File([stereoWav({sampleRate:48000,channels:[Float32Array.of(-.5,0,.5),Float32Array.of(.25,-.25,0)]})],'generated-stereo.wav',{type:'audio/wav'});
 const opened=await readInverseSoundFile(file),decoded=parseInverseSound(opened.bytes);
 if(opened.name!==file.name||decoded.sampleRate!==48000||decoded.frameCount!==3||decoded.channels.length!==2)throw new Error('File metadata or layout mismatch.');
 if(Math.abs(decoded.channels[0][0]+.5)>1/32768||Math.abs(decoded.channels[1][0]-.25)>1/32768)throw new Error('Channel data mismatch.');
 const controller=new AbortController(),pending=readInverseSoundFile(file,{signal:controller.signal});controller.abort();
 try{await pending;throw new Error('Cancelled read completed.');}catch(error){if(error.name!=='AbortError')throw error;}
 const summary=await jobs.run({bytes:opened.bytes});
 if(summary.sha256!=='0d967ed12e62abd76345cb65683289f554a3dee562df77c4e3289f8b76d90e80'||summary.byteLength!==opened.bytes.byteLength||summary.waveforms.length!==2||summary.frameCount!==3)throw new Error('Worker identity or summary mismatch.');
 if(summary.audition.gain!==.25||summary.audition.sampleRate!==48000||!(summary.audition.channels[0] instanceof Float32Array)||Math.abs(summary.audition.channels[0][0]+.125)>1/32768)throw new Error('Worker audition copy mismatch.');
 const malformed=new Uint8Array(opened.bytes.byteLength+1);malformed.set(new Uint8Array(opened.bytes));
 try{await jobs.run({bytes:malformed.buffer});throw new Error('Malformed bytes accepted.');}catch(error){if(!error.message.includes('container length'))throw error;}
 const cancelled=jobs.run({bytes:opened.bytes});jobs.cancel();
 try{await cancelled;throw new Error('Cancelled worker completed.');}catch(error){if(error.name!=='AbortError')throw error;}
 const retried=await jobs.run({bytes:opened.bytes});if(retried.sha256!==summary.sha256)throw new Error('Worker retry changed file identity.');
 result.textContent='PASS 5/5\nReal File → selected bytes → stereo PCM samples.\nCancellation during the asynchronous File read refuses the result.\nActual module worker returns the known exact-byte SHA-256 and stereo summary, plus the attenuated Float32 audition copy.\nMalformed replacement bytes are refused.\nWorker cancellation rejects, and a fresh worker retries successfully.\nNo native-picker or sound-analysis claim.';
}catch(error){result.textContent='FAIL: '+error.message;}finally{jobs.cancel();}
