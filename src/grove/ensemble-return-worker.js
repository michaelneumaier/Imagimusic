import {prepareEnsembleReturn} from './ensemble-return-prepare.js';
self.onmessage=async({data})=>{
 try{const result=await prepareEnsembleReturn(data.record);self.postMessage(result,result.pcm.channels.map(channel=>channel.buffer));}
 catch(error){self.postMessage({error:error.message});}
};
