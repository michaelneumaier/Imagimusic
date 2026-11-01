import {DEFAULT_TENSIONER,validateTensioner} from '../fm.js';
const keys=Object.keys(DEFAULT_TENSIONER);
export function createTensionerPatch(settings=DEFAULT_TENSIONER,sampleRate=48000){
 const validated=validateTensioner(settings,sampleRate);
 return {version:1,settings:Object.fromEntries(keys.map(key=>[key,validated[key]]))};
}
export function parseTensionerPatch(value,sampleRate=48000){
 const record=typeof value==='string'?JSON.parse(value):value;
 if(record?.version!==1||!record.settings||typeof record.settings!=='object'||Array.isArray(record.settings))throw new Error('Unsupported FM sound settings');
 const canonical=createTensionerPatch(record.settings,sampleRate);
 if(Object.keys(record).length!==2||Object.keys(record.settings).length!==keys.length||keys.some(key=>record.settings[key]!==canonical.settings[key]))throw new Error('FM sound settings must use the complete canonical format');
 return canonical;
}
export function readTensionerSearch(search,sampleRate=48000){
 const value=new URLSearchParams(search).get('fm');
 return value===null?createTensionerPatch(DEFAULT_TENSIONER,sampleRate):parseTensionerPatch(value,sampleRate);
}
export function tensionerURL(base,settings,sampleRate=48000){
 const url=new URL(base);url.searchParams.set('fm',JSON.stringify(createTensionerPatch(settings,sampleRate)));return url.href;
}
