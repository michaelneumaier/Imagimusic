import {renderLivingExploration} from './exploration-record.js';
self.onmessage=({data})=>{
 try{const pcm=renderLivingExploration(data);self.postMessage({pcm},[...pcm.original.channels,...pcm.response.channels].map(channel=>channel.buffer));}
 catch(error){self.postMessage({error:error.message});}
};
