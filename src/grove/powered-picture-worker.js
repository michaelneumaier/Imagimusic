import {poweredRecordPictureFrames} from '../score/grove-powered.js';
self.onmessage=({data})=>{try{self.postMessage({picture:poweredRecordPictureFrames(data.record,data.recipe,{fps:60})});}catch(error){self.postMessage({error:error.message});}};
