import {searchThreeResonanceGroves} from '../score/grove-inverse.js';
import {createInverseInstrument} from './instrument.js';
import {reopenInverseCandidate} from '../score/grove-inverse-kept.js';
import {INVERSE_IMPORT_MAX_BYTES} from './read-file.js';

self.onmessage=({data})=>{
 try{
  if(data?.kind==='search'){
   self.postMessage({result:searchThreeResonanceGroves(data.target,data.options)});
  }else if(data?.kind==='reopen'){
   if(typeof data.text!=='string'||new TextEncoder().encode(data.text).byteLength>INVERSE_IMPORT_MAX_BYTES)throw new Error('The instrument file exceeds the 16 KiB limit.');
   self.postMessage({result:reopenInverseCandidate(JSON.parse(data.text))});
  }else if(data?.kind==='candidate'){
   const instrument=createInverseInstrument(data.grove,{sampleRate:data.sampleRate});
   const strikes=[0,1,2].map(body=>instrument.renderStrike(body));
   const result={kind:instrument.kind,grove:instrument.grove,sampleRate:instrument.sampleRate,frames:instrument.frames,
    ringFrames:instrument.ringFrames,fadeFrames:instrument.fadeFrames,duration:instrument.duration,
    normalFrequenciesHz:instrument.normalFrequenciesHz,decaySeconds:instrument.decaySeconds,
    model:instrument.model,pickupBodies:instrument.pickupBodies,singleStrikePeakBound:instrument.singleStrikePeakBound,strikes};
   self.postMessage({result},strikes.flatMap(strike=>strike.channels.map(channel=>channel.buffer)));
  }else throw new Error('Unknown inverse preparation request.');
 }catch(error){self.postMessage({error:error.message});}
};
