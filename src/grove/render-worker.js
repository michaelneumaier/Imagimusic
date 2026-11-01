import {createGroveInstrument,renderGroveBank} from './performance.js';
import {createVoiceInstrument,renderVoiceBank} from './voice-performance.js';
self.onmessage=({data})=>{try{const pcm=data.voice?renderVoiceBank(createVoiceInstrument(data.grove,data.voice,data.sampleRate)):renderGroveBank(createGroveInstrument(data.grove,data.sampleRate));self.postMessage({pcm},pcm.flatMap(unit=>unit.channels.map(channel=>channel.buffer)));}catch(error){self.postMessage({error:error.message});}};
