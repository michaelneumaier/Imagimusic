import {prepareEnsembleImport} from './ensemble-import.js';
self.onmessage=({data})=>{try{const result=prepareEnsembleImport(data.text);self.postMessage(result,result.pcm.channels.map(ch=>ch.buffer));}catch(error){self.postMessage({error:error.message});}};
