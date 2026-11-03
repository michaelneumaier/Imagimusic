import {parseInverseSound} from './sound-file.js';
import {prepareSoundAudition} from './sound-audition.js';
import {summarizeInverseSound} from './sound-summary.js';
self.onmessage=async({data})=>{
 try{
  const decoded=parseInverseSound(data.bytes);
  const result=summarizeInverseSound(decoded);
  result.audition=prepareSoundAudition(decoded);
  const digest=await crypto.subtle.digest('SHA-256',data.bytes);
  result.sha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  result.byteLength=data.bytes.byteLength;
  self.postMessage({result},result.audition.channels.map(channel=>channel.buffer));
 }catch(error){self.postMessage({error:error.message});}
};
