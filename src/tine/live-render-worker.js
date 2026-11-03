import {renderTineLiveRecord} from './live-record.js';
self.onmessage=({data})=>{try{const pcm=renderTineLiveRecord(data);self.postMessage({pcm},pcm.channels.map(c=>c.buffer));}catch(error){self.postMessage({error:error.message});}};
