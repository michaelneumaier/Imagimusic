import {parseEnsembleImport} from './ensemble-import.js';
import {continuationPlan} from '../score/grove-ensemble-continuation.js';
import {canonicalEnsembleRecord,ENSEMBLE_RECORD_KIND} from '../score/grove-ensemble-record.js';
import {sha256Hex} from '../score/grove-ensemble-derived.js';

/** Worker-side source preparation only. No audio or live capture is changed. */
export async function prepareEnsembleContinuation(source,{sampleRate}={}){
 if(source?.kind!==ENSEMBLE_RECORD_KIND)throw new Error('Choose an original ensemble passage as the source of a continuation.');
 const {record}=parseEnsembleImport(JSON.stringify(source),{allowDerived:false});
 const plan=continuationPlan(record,{sampleRate});
 const canonical=canonicalEnsembleRecord(record);
 const canonicalSha256=await sha256Hex(canonical);
 return {plan,canonicalSha256,text:canonical+'\n'};
}
