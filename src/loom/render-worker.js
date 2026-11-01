import {makeLoom,renderLoom} from './model.js';
import {createLoomPerformance,renderLoomPerformance} from './performance.js';
self.onmessage=({data})=>{
 try{
  const {settings,body,sampleRate}=data;
  const pcm=body===null?renderLoomPerformance(createLoomPerformance(settings),sampleRate):renderLoom(makeLoom(settings,body),sampleRate);
  self.postMessage({pcm},pcm.channels.map(channel=>channel.buffer));
 }catch(error){self.postMessage({error:error.message});}
};
