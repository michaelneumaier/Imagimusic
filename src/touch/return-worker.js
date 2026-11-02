import {prepareTouchReturn} from './return-preparation.js';
self.onmessage=({data})=>{
 try{const result=prepareTouchReturn(data.text);self.postMessage({result},result.pcm.channels.map(channel=>channel.buffer));}
 catch(error){self.postMessage({error:error.message});}
};
