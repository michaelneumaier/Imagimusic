import {prepareTouchComparison} from './comparison.js';
self.onmessage=({data})=>{
 try{const result=prepareTouchComparison(data.record,data.targetId);self.postMessage({result},result.pcm.channels.map(channel=>channel.buffer));}
 catch(error){self.postMessage({error:error.message});}
};
