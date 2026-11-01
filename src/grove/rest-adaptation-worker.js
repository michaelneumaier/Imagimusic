import {prepareRestAdaptation} from './rest-adaptation.js';
self.onmessage=({data})=>{try{const result=prepareRestAdaptation(data.text);self.postMessage(result,[...result.original.pcm.channels,...result.changed.pcm.channels].map(channel=>channel.buffer));}catch(error){self.postMessage({error:error.message});}};
