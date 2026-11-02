import {parseInverseSound} from './sound-file.js';
import {summarizeInverseSound} from './sound-summary.js';
self.onmessage=async({data})=>{
 try{
  const result=summarizeInverseSound(parseInverseSound(data.bytes));
  const digest=await crypto.subtle.digest('SHA-256',data.bytes);
  result.sha256=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  result.byteLength=data.bytes.byteLength;
  self.postMessage({result});
 }catch(error){self.postMessage({error:error.message});}
};
