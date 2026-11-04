import {validateLivingRecord} from './record.js';
export const LIVING_RECIPE_FILE_LIMIT=8192;
export async function readLivingRecipeFile(file){
 if(!file||typeof file.text!=='function'||!Number.isSafeInteger(file.size)||file.size<1||file.size>LIVING_RECIPE_FILE_LIMIT)throw Error('Choose a Living Instrument recipe JSON file up to 8 KiB.');
 const text=await file.text();if(typeof text!=='string'||new TextEncoder().encode(text).length>LIVING_RECIPE_FILE_LIMIT)throw Error('The recipe file is too large.');
 let value;try{value=JSON.parse(text);}catch{throw Error('The recipe is not readable JSON.');}
 if(value?.kind==='imagimusic-living-movie')throw Error('This is a film manifest. Choose the separate recipe JSON file.');
 return validateLivingRecord(value);
}

/** The encounter limit stays 8 KiB; the paired exploration admits 16 KiB. */
export async function readLivingKeptFile(file){
 const {LIVING_EXPLORATION_FILE_LIMIT,validateLivingExploration}=await import('./exploration-record.js');
 if(!file||typeof file.text!=='function'||!Number.isSafeInteger(file.size)||file.size<1||file.size>LIVING_EXPLORATION_FILE_LIMIT)throw Error('Choose a kept encounter or exploration JSON file up to 16 KiB.');
 const text=await file.text();if(typeof text!=='string'||new TextEncoder().encode(text).length>LIVING_EXPLORATION_FILE_LIMIT)throw Error('The kept file is too large.');
 let value;try{value=JSON.parse(text);}catch{throw Error('The kept file is not readable JSON.');}
 if(value?.kind==='imagimusic-living-exploration')return validateLivingExploration(value);
 return readLivingRecipeFile({size:file.size,text:async()=>text});
}
