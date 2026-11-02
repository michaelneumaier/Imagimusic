import {parseEnsembleImport} from './ensemble-import.js';
import {REST_IMPORT_MAX_BYTES} from './read-rest-file.js';
import {rotateEnsembleVoices,canonicalDerivedEnsemble} from '../score/grove-ensemble-derived.js';
import {renderEnsembleMix} from './ensemble-mix.js';

/** Worker-side only: separate derived file + sound, with no playback or source replacement. */
export async function prepareEnsembleReturn(source){
 const {record,duration}=parseEnsembleImport(JSON.stringify(source),{allowDerived:false});
 const derived=await rotateEnsembleVoices(record);
 const text=canonicalDerivedEnsemble(derived)+'\n';
 if(new TextEncoder().encode(text).byteLength>REST_IMPORT_MAX_BYTES)throw new Error('The derived gesture file exceeds this reader’s 256 KiB limit. The source passage is unchanged.');
 const pcm=renderEnsembleMix(derived.ensemble);
 return {derived,text,pcm,duration};
}
