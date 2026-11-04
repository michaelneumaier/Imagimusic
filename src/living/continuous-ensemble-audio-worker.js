import {prepareContinuousEnsembleAudio} from './continuous-ensemble-audio.js';
self.onmessage=({data})=>{try{const pcm=prepareContinuousEnsembleAudio(data);self.postMessage({pcm},[pcm.wav]);}catch(error){self.postMessage({error:error.message});}};
