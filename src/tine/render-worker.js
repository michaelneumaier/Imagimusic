import {prepareTineRequest,tineTransferBuffers} from './preparation.js';
self.onmessage=({data})=>{try{const result=prepareTineRequest(data);self.postMessage({result},tineTransferBuffers(result));}catch(error){self.postMessage({error:error.message});}};
