import {prepareEnsembleContinuation} from './ensemble-continuation-prepare.js';
self.onmessage=async({data})=>{
 try{self.postMessage(await prepareEnsembleContinuation(data.record,{sampleRate:data.sampleRate}));}
 catch(error){self.postMessage({error:error.message});}
};
