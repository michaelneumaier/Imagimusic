import {validateTensioner,tensionerCore,renderTensioner} from '../fm.js';
self.onmessage=({data})=>{
 try{
  const {settings,sampleRate}=data,model=tensionerCore(validateTensioner(settings,sampleRate));
  const samples=renderTensioner(model,sampleRate);
  self.postMessage({pcm:{samples,sampleRate}},[samples.buffer]);
 }catch(error){self.postMessage({error:error.message});}
};
