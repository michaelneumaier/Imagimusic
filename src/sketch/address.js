import {varySketchDecay} from './variation.js';
export const SKETCH_ADDRESS_LIMIT=8192;
const fields=(value,names)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===names.length&&names.every(name=>Object.hasOwn(value,name));
export function createSketchAddressRecord(label,parameters,decayScale=1){
 if(typeof label!=='string'||!label.trim()||label.length>160||/[\u0000-\u001f\u007f]/.test(label))throw Error('Sketch label must contain 1…160 printable characters.');
 if(!Number.isFinite(decayScale)||decayScale!==Math.round(decayScale*20)/20)throw Error('Use a decay multiplier in steps of 0.05.');
 const source=varySketchDecay(parameters,1).parameters;
 varySketchDecay(source,decayScale);
 return Object.freeze({kind:'imagimusic-resonance-sketch',version:1,label,parameters:source,decayScale});
}
function validate(record){
 if(!fields(record,['kind','version','label','parameters','decayScale'])||record.kind!=='imagimusic-resonance-sketch'||record.version!==1||!fields(record.parameters,['frequencies','decays','coefficients']))throw Error('Unsupported sketch address record.');
 return createSketchAddressRecord(record.label,record.parameters,record.decayScale);
}
export function sketchAddressFragment(record){
 const fragment='#sketch='+encodeURIComponent(JSON.stringify(validate(record)));
 if(fragment.length>SKETCH_ADDRESS_LIMIT)throw Error('Sketch address exceeds its size limit.');
 return fragment;
}
export function readSketchAddress(hash){
 if(!hash||hash==='#')return null;
 if(typeof hash!=='string'||hash.length>SKETCH_ADDRESS_LIMIT||!hash.startsWith('#sketch='))throw Error('Unsupported or oversized sketch address.');
 let record;try{record=JSON.parse(decodeURIComponent(hash.slice(8)));}catch{throw Error('The sketch address could not be read.');}
 return validate(record);
}
