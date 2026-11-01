import {renderRestRecord} from '../score/grove-rest.js';
self.onmessage=({data})=>{try{const pcm=renderRestRecord(data.record,data.recipe);self.postMessage({pcm},pcm.channels.map(channel=>channel.buffer));}catch(error){self.postMessage({error:error.message});}};
