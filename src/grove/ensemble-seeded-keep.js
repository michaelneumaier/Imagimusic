import {parseEnsembleImport} from './ensemble-import.js';
import {REST_IMPORT_MAX_BYTES} from './read-rest-file.js';
import {ENSEMBLE_RECORD_KIND} from '../score/grove-ensemble-record.js';
import {seedEnsembleRecord,verifySeededEnsemble,canonicalSeededEnsemble} from '../score/grove-ensemble-seeded.js';

/** Worker-side keeping: source verification precedes any offered file. No audio. */
export async function prepareEnsembleSeededKeep({source,continuation,ensemble}){
 if(source?.kind!==ENSEMBLE_RECORD_KIND||ensemble?.kind!==ENSEMBLE_RECORD_KIND)throw new Error('Continuation keeping requires the original ensemble and its finished capture.');
 const original=parseEnsembleImport(JSON.stringify(source),{allowDerived:false}).record;
 const captured=parseEnsembleImport(JSON.stringify(ensemble),{allowDerived:false}).record;
 const metadata=structuredClone(continuation);
 const seeded=await seedEnsembleRecord({source:original,continuation:metadata,ensemble:captured});
 const verification=await verifySeededEnsemble(seeded,original);
 if(!verification.verified)throw new Error('The continuation history could not be verified: '+verification.mismatches.join('; '));
 const text=canonicalSeededEnsemble(seeded)+'\n';
 if(new TextEncoder().encode(text).byteLength>REST_IMPORT_MAX_BYTES)throw new Error('The continuation file exceeds this reader’s 256 KiB limit.');
 return {seeded,text,verification};
}
