import {prepareEnsembleSeededKeep} from './ensemble-seeded-keep.js';
self.onmessage=async({data})=>{
 try{self.postMessage(await prepareEnsembleSeededKeep(data));}
 catch(error){self.postMessage({error:error.message});}
};
