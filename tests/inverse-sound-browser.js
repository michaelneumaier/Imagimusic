import {stereoWav} from '../src/loom/model.js';
import {readInverseSoundFile,parseInverseSound} from '../src/inverse/sound-file.js';
const result=document.getElementById('result');
try{
 const file=new File([stereoWav({sampleRate:48000,channels:[Float32Array.of(-.5,0,.5),Float32Array.of(.25,-.25,0)]})],'generated-stereo.wav',{type:'audio/wav'});
 const opened=await readInverseSoundFile(file),decoded=parseInverseSound(opened.bytes);
 if(opened.name!==file.name||decoded.sampleRate!==48000||decoded.frameCount!==3||decoded.channels.length!==2)throw new Error('File metadata or layout mismatch.');
 if(Math.abs(decoded.channels[0][0]+.5)>1/32768||Math.abs(decoded.channels[1][0]-.25)>1/32768)throw new Error('Channel data mismatch.');
 const controller=new AbortController(),pending=readInverseSoundFile(file,{signal:controller.signal});controller.abort();
 try{await pending;throw new Error('Cancelled read completed.');}catch(error){if(error.name!=='AbortError')throw error;}
 result.textContent='PASS 2/2\nReal File → selected bytes → stereo PCM samples.\nCancellation during the asynchronous File read refuses the result.\nNo native-picker or sound-analysis claim.';
}catch(error){result.textContent='FAIL: '+error.message;}
