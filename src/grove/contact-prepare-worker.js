import {createGroveRestRecipe} from '../score/grove-rest.js';
self.onmessage=({data})=>{try{self.postMessage({recipe:createGroveRestRecipe(data.grove,data.voice,{sampleRate:data.sampleRate})});}catch(error){self.postMessage({error:error.message});}};
