import {canonicalImportedScore,compileImportedScore} from './mapping.js';
import {DEFAULT_TENSIONER} from '../fm.js';
import {DEFAULT_PATCH} from '../model.js';
import {DEFAULT_COMPOSITION} from '../stage/composition.js';

const PREFIX='imagimusic.midi.';
/** Each explicit handoff has its own key, so another desk cannot replace it. */
export function saveMidiStage(storage,imported,id=crypto.randomUUID()){
 const saved=canonicalImportedScore(imported);
 const {report}=compileImportedScore(JSON.parse(saved),DEFAULT_PATCH,48000);
 if(report.counts.unassigned)throw new Error('Assign or omit every note in the excerpt first.');
 if(!report.onsets)throw new Error('Choose a mapping with at least one playable entrance.');
 if(!/^[\w-]{1,80}$/.test(id))throw new Error('Invalid MIDI session key.');
 storage.setItem(PREFIX+id,saved);
 return id;
}
export function readMidiStage(storage,id){
 if(!/^[\w-]{1,80}$/.test(id))throw new Error('Invalid MIDI session key.');
 const raw=storage.getItem(PREFIX+id);
 if(!raw)throw new Error('This MIDI passage is not available in this browser session. Return to the MIDI desk and use the mapping again.');
 return JSON.parse(canonicalImportedScore(JSON.parse(raw)));
}
export function midiComposition(imported){
 const {report}=compileImportedScore(imported,DEFAULT_PATCH,48000);
 const composition={...structuredClone(DEFAULT_COMPOSITION),version:2,fm:{enabled:false,settings:{...DEFAULT_TENSIONER}}};
 for(const family of ['loom','fm'])composition[family].enabled=!!report.children[family];
 return composition;
}
