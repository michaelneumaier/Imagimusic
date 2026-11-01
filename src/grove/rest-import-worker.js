import {prepareRestImport} from './rest-import.js';
self.onmessage=({data})=>{try{const result=prepareRestImport(data.text);self.postMessage(result,result.pcm.channels.map(ch=>ch.buffer));}catch(error){self.postMessage({error:error.message});}};
