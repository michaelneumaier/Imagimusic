/** A local filename label only; never part of the saved gesture contract. */
export function touchKeepNames(name=''){
 const label=Array.from(String(name).normalize('NFC')
  .replace(/[<>:"/\\|?*\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,'-')
  .replace(/\s+/gu,' ').trim()).slice(0,40).join('').replace(/^[. -]+|[. -]+$/g,'');
 const stem='imagimusic-touch'+(label?'-'+label:'');
 return {sound:stem+'.wav',gestures:stem+'.json'};
}
