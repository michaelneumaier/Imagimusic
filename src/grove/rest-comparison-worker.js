import {prepareRestComparison} from './rest-comparison.js';
self.onmessage=({data})=>{
 try{const result=prepareRestComparison(data.record,data.targetSeed);self.postMessage(result,result.pcm?.channels.map(channel=>channel.buffer)??[]);}
 catch(error){self.postMessage({error:error.message});}
};
