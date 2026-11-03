import {renderTineImpulse} from './render.js';
import {renderTinePhrase} from './phrase.js';
self.onmessage=({data})=>{try{
 if(data.kind!==undefined&&data.kind!=='body')throw Error('Unsupported tine preparation kind.');
 const single=renderTineImpulse(data.geometry,data.options);
 if(data.kind==='body'){
  const phrase=renderTinePhrase(data.geometry,{...data.options,seconds:6.1});
  self.postMessage({result:{single,phrase}},[...single.channels,...phrase.channels].map(channel=>channel.buffer));
 }else self.postMessage({result:single},single.channels.map(channel=>channel.buffer));
}catch(error){self.postMessage({error:error.message});}};
