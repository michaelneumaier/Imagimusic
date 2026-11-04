import {validateMemoryReturnFinished} from './memory-return-result.js';
self.onmessage=({data})=>{
 try{
  const keys=['seed','sampleRate','data','touches','originAudioFrame','quietFrame'];
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length!==keys.length||!keys.every(key=>Object.hasOwn(data,key)))throw Error('Unsupported continuous verification request.');
  const result=validateMemoryReturnFinished(data.seed,data.sampleRate,data.data,data.touches,data.originAudioFrame,data.quietFrame);
  self.postMessage({type:'verified',result});
 }catch(error){self.postMessage({type:'error',message:error.message});}
};
