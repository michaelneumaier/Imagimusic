import {renderEnsembleRecord} from '../score/grove-ensemble-record.js';
self.onmessage=({data})=>{try{const rendered=renderEnsembleRecord(data.record),pcm={sampleRate:rendered.sampleRate,channels:rendered.channels};self.postMessage({pcm},pcm.channels.map(channel=>channel.buffer));}catch(error){self.postMessage({error:error.message});}};
