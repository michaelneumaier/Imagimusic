import {prepareContinuousReturnAudio} from './continuous-return-audio.js';
self.onmessage=({data})=>{try{const pcm=prepareContinuousReturnAudio(data);self.postMessage({pcm},[pcm.wav]);}catch(error){self.postMessage({error:error.message});}};
