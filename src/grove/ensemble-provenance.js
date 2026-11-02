/** Presentation for validated reader results. A declared history is not proof
 * of its source: the reader has only the supplied wrapper, not the original. */
export function ensembleProvenance({derived=null,seeded=null}={}){
 if(seeded){
  const {opening,seededFrom,ensemble}=seeded,ledger=opening.ledger;
  const accepted=ledger.filter(e=>e.accepted===true).length,refused=ledger.filter(e=>e.accepted===false).length,unprocessed=ledger.filter(e=>e.accepted===null).length;
  const handoff=opening.handoff==='aborted'?'Stopped before the live response.':opening.boundaryFrame<0?'The declared handoff was before the first kept gesture.':`The file places the handoff at ${(opening.boundaryFrame/ensemble.sampleRate).toFixed(2)} s. Touches after that point belong to the live response.`;
  return {label:'A CONTINUED PASSAGE',noun:'continued passage',filename:'imagimusic-ensemble-continuation.wav',text:`${handoff} Remembered gestures: ${accepted} accepted, ${refused} refused, ${unprocessed} not reached.${opening.effective?'':' No remembered strike or touch was accepted.'} Source fingerprint: ${seededFrom.canonicalSha256}. This history and source identity are declared by the file; the original has not been supplied for verification.`};
 }
 if(derived)return {label:'A DERIVED RETURN',noun:'derived return',filename:'imagimusic-ensemble-return.wav',text:`Voice histories moved to the next instrument. Source fingerprint: ${derived.derivedFrom.canonicalSha256}. This is a declared source identity; the source file has not been supplied for verification.`};
 return {label:'A SAVED ENSEMBLE',noun:'saved ensemble',filename:'imagimusic-ensemble.wav',text:''};
}
