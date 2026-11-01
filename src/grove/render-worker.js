import {createGroveInstrument,renderGroveBank} from './performance.js';
self.onmessage=({data})=>{try{const pcm=renderGroveBank(createGroveInstrument(data.grove,data.sampleRate));self.postMessage({pcm},pcm.flatMap(unit=>unit.channels.map(channel=>channel.buffer)));}catch(error){self.postMessage({error:error.message});}};
