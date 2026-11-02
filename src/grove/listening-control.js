import {listeningGain} from './listening-level.js';
/** One explicit listening preference shared by a page's live and replay paths. */
export function bindListeningControl({input,output,targets,defaultDb,storageKey,storage}){
 listeningGain(defaultDb);
 if(!targets.length||targets.some(t=>typeof t.setListeningDb!=='function'))throw new Error('Listening control needs audio targets');
 let store=storage;
 if(store===undefined)try{store=globalThis.localStorage;}catch{store=null;}
 let db=defaultDb;
 try{const value=store?.getItem(storageKey);if(typeof value==='string'&&value.trim()){const parsed=Number(value);listeningGain(parsed);db=parsed;}}catch{}
 function apply(value){listeningGain(value);targets.forEach(target=>target.setListeningDb(value));input.value=String(value);output.textContent='+'+value+' dB';}
 apply(db);
 const change=()=>{const value=Number(input.value);apply(value);try{store?.setItem(storageKey,String(value));}catch{}};
 input.addEventListener('input',change);
 return {dispose(){input.removeEventListener('input',change);}};
}
