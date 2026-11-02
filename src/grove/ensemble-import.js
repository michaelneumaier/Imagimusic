import {ENSEMBLE_DERIVED_KIND,validateDerivedEnsemble} from '../score/grove-ensemble-derived.js';
import {ENSEMBLE_RECORD_KIND} from '../score/grove-ensemble-record.js';
import {renderEnsembleMix} from './ensemble-mix.js';
import {REST_MAX_SECONDS} from '../rest/limits.js';
import {REST_IMPORT_MAX_BYTES} from './read-rest-file.js';
/** Parse and bound browser work. Full identity/admission validation occurs in the model/render step. */
export function parseEnsembleImport(text,{allowDerived=true}={}){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>REST_IMPORT_MAX_BYTES)throw new Error('Choose an ensemble JSON file no larger than 256 KiB.');
 let file;try{file=JSON.parse(text);}catch{throw new Error('The ensemble file is not valid JSON.');}
 const derived=file?.kind===ENSEMBLE_DERIVED_KIND?file:null,record=derived?derived.ensemble:file;
 if(derived&&!allowDerived)throw new Error('Choose an original saved ensemble as the source of a return.');
 if(record?.kind!==ENSEMBLE_RECORD_KIND)throw new Error('Choose a saved ensemble file. Single Grove and Rest files use Return to a passage.');
 if(!Number.isInteger(record.sampleRate)||record.sampleRate<8000||record.sampleRate>48000)throw new Error('This reader supports ensemble sample rates from 8 to 48 kHz.');
 const frames=record.ended?.frame+record.ended?.fadeFrames;
 if(!Number.isSafeInteger(record.ended?.frame)||record.ended.frame<0||record.ended.frame>REST_MAX_SECONDS*record.sampleRate||!Number.isInteger(record.ended?.fadeFrames)||record.ended.fadeFrames<1||record.ended.fadeFrames>record.sampleRate)throw new Error('This reader supports endings up to two minutes, followed by a fade of up to one second.');
 if(derived)validateDerivedEnsemble(derived,{admission:false});
 return {record,duration:frames/record.sampleRate,derived};
}
/** Reader limits are deliberately narrower than the archival schema. */
export function prepareEnsembleImport(text){
 const {record,duration,derived}=parseEnsembleImport(text),rendered=renderEnsembleMix(record);
 return {record,pcm:{sampleRate:rendered.sampleRate,channels:rendered.channels},duration,derived};
}
