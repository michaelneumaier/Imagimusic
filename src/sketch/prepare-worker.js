import {prepareSketchPlayback} from './transport.js';
self.onmessage=({data})=>{
 try{const result=prepareSketchPlayback(data.parameters,data.sampleRate,{seconds:data.seconds??4});self.postMessage({result},result.buffers.map(buffer=>buffer.buffer));}
 catch(error){self.postMessage({error:error.message});}
};
