import {prepareEnsembleJourneyAudio} from './ensemble-journey-audio.js';
self.onmessage=({data})=>{try{const pcm=prepareEnsembleJourneyAudio(data);self.postMessage({pcm},[pcm.wav]);}catch(error){self.postMessage({error:error.message});}};
