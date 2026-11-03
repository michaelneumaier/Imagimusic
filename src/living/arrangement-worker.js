import {renderLivingArrangement} from './arrangement.js';
self.onmessage=({data})=>{
 try{const pcm=renderLivingArrangement(data);self.postMessage({pcm},pcm.channels.map(channel=>channel.buffer));}
 catch(error){self.postMessage({error:error.message});}
};
