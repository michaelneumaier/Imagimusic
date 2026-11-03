/** A local filename label only; never part of the saved gesture contract. */
export function touchKeepNames(name=''){
 const label=Array.from(String(name).normalize('NFC')
  .replace(/[<>:"/\\|?*\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'-')
  .replace(/\s+/gu,' ').trim()).slice(0,40).join('').replace(/^[. -]+|[. -]+$/g,'');
 const stem='imagimusic-touch'+(label?'-'+label:'');
 return {sound:stem+'.wav',gestures:stem+'.json'};
}

/** Preserve the opened file's label; a comparison is a separate standalone file. */
export function touchReturnKeepNames(filename,{targetId}={}){
 let stem=String(filename).normalize('NFC').replace(/\.json$/i,'')
  .replace(/[<>:"/\\|?*\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'-')
  .replace(/\s+/gu,' ').trim().replace(/^[. -]+|[. -]+$/g,'');
 if(!stem.startsWith('imagimusic-touch'))stem='imagimusic-touch'+(stem?'-'+stem:'');
 let suffix='';
 if(targetId!==undefined){
  if(typeof targetId!=='string'||!/^[-a-z0-9]{1,32}$/.test(targetId))throw new Error('Invalid comparison filename label.');
  suffix='-'+targetId+'-comparison';
 }
 const encoder=new TextEncoder(),limit=240-encoder.encode(suffix).length;let bounded='';
 for(const point of stem){if(encoder.encode(bounded+point).length>limit)break;bounded+=point;}
 bounded=bounded.replace(/[. ]+$/g,'')+suffix;
 return {sound:bounded+'.wav',gestures:bounded+'.json'};
}
