import {renderPoweredRecord} from '../score/grove-powered.js';
self.onmessage=({data})=>{try{const pcm=renderPoweredRecord(data.record,data.recipe);self.postMessage({pcm},pcm.channels.map(ch=>ch.buffer));}catch(error){self.postMessage({error:error.message});}};
