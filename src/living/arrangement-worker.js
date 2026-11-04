import {validateLivingRecord} from './record.js';
import {renderLivingArrangement} from './arrangement.js';
self.onmessage=({data})=>{
 try{const record=data?.kind==='imagimusic-living-encounter'?validateLivingRecord(data):null;const pcm=renderLivingArrangement(record?record.source:data,record?record.arrangementVersion:1);self.postMessage({pcm},pcm.channels.map(channel=>channel.buffer));}
 catch(error){self.postMessage({error:error.message});}
};
