import {createGroveRestRecipe} from '../score/grove-rest.js';
self.onmessage=({data})=>{try{
 if(!Array.isArray(data.groves)||data.groves.length!==3)throw new Error('Choose exactly three Groves');
 self.postMessage({recipes:data.groves.map(grove=>createGroveRestRecipe(grove,data.voice,{sampleRate:data.sampleRate}))});
}catch(error){self.postMessage({error:error.message});}};
