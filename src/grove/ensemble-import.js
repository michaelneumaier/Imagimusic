import {ENSEMBLE_RECORD_KIND,renderEnsembleRecord} from '../score/grove-ensemble-record.js';
import {REST_IMPORT_MAX_BYTES} from './read-rest-file.js';
/** Reader limits are deliberately narrower than the archival schema. */
export function prepareEnsembleImport(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>REST_IMPORT_MAX_BYTES)throw new Error('Choose an ensemble JSON file no larger than 256 KiB.');
 let record;try{record=JSON.parse(text);}catch{throw new Error('The ensemble file is not valid JSON.');}
 if(record?.kind!==ENSEMBLE_RECORD_KIND)throw new Error('Choose a saved ensemble file. Single Grove and Rest files use Return to a passage.');
 if(!Number.isInteger(record.sampleRate)||record.sampleRate<8000||record.sampleRate>48000)throw new Error('This reader supports ensemble sample rates from 8 to 48 kHz.');
 const frames=record.ended?.frame+record.ended?.fadeFrames;
 if(!Number.isSafeInteger(frames)||frames<1||frames>30*record.sampleRate)throw new Error('This reader supports finished ensembles up to 30 seconds, including the ending fade.');
 const rendered=renderEnsembleRecord(record);
 return {record,pcm:{sampleRate:rendered.sampleRate,channels:rendered.channels},duration:frames/record.sampleRate};
}
