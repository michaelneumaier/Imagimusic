/** Local study artifact verification. Reports are provenance, not a saved
 * encounter format. Hash checking ties the selected bytes to the current plan. */
export function createLivingJourneyMedia({fetchFile=fetch,makeURL=blob=>URL.createObjectURL(blob),revokeURL=url=>URL.revokeObjectURL(url),digest=bytes=>crypto.subtle.digest('SHA-256',bytes)}={}){
 let generation=0,controller=null,currentURL=null;
 const limit=64*1024*1024;
 function cancel(){generation++;controller?.abort();controller=null;}
 function clear(){cancel();if(currentURL){revokeURL(currentURL);currentURL=null;}}
 async function prepare(url,plan){
  cancel();const own=generation;controller=new AbortController();const signal=controller.signal;
  const fresh=()=>{if(own!==generation||signal.aborted)throw new DOMException('Journey preparation cancelled.','AbortError');};
  try{
   const response=await fetchFile(url.replace(/\.wav$/,'.json'),{signal,cache:'no-store'});fresh();
   if(!response.ok)throw Error('The journey report is missing. Render this study locally first.');
   const report=await response.json();fresh();
   if(report.previewGain!==8||JSON.stringify(report.plan)!==JSON.stringify(plan)||typeof report.sha256!=='string'||!/^[a-f0-9]{64}$/.test(report.sha256))throw Error('The rendered study does not match this score. Render it again before listening.');
   const audio=await fetchFile(url,{signal,cache:'no-store'});fresh();
   if(!audio.ok)throw Error('The journey audio is missing. Render this study locally first.');
   if(Number(audio.headers.get('content-length'))>limit)throw Error('The study audio exceeds the local preparation limit.');
   const bytes=await audio.arrayBuffer();fresh();
   if(bytes.byteLength>limit)throw Error('The study audio exceeds the local preparation limit.');
   const hash=Array.from(new Uint8Array(await digest(bytes)),v=>v.toString(16).padStart(2,'0')).join('');fresh();
   if(hash!==report.sha256)throw Error('The journey audio differs from its report. Render this study again.');
   const nextURL=makeURL(new Blob([bytes],{type:'audio/wav'}));
   if(currentURL)revokeURL(currentURL);currentURL=nextURL;return nextURL;
  }finally{if(own===generation)controller=null;}
 }
 return {prepare,cancel,clear};
}
