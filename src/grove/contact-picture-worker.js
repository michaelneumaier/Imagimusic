import {createRestReplayPicture} from './rest-replay-picture.js';
self.onmessage=({data})=>{try{self.postMessage({picture:createRestReplayPicture(data.record,data.recipe)});}catch(error){self.postMessage({error:error.message});}};
