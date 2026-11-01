import {composeOnPulsePhrase} from '../score/grove-pulse.js';
self.onmessage=({data})=>{try{self.postMessage({phrase:composeOnPulsePhrase(data.recipe)});}catch(error){self.postMessage({error:error.message});}};
