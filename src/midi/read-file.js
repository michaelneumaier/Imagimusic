import {parseSMF,validateNoteList,DEFAULT_LIMITS} from './smf.js';

const checkAbort=signal=>{if(signal?.aborted)throw new DOMException('MIDI import cancelled.','AbortError');};

/** Local file intake only: no playback, persistence or network transmission.
 * An aborted read may finish internally, but never returns a usable import.
 * Provenance describes these exact bytes; later manifest reload cannot rehash
 * an original file that is no longer present. */
export async function readMidiFile(file,{signal}={}){
 checkAbort(signal);
 if(!file||typeof file.arrayBuffer!=='function'||typeof file.name!=='string')throw new TypeError('Choose a local MIDI file.');
 if(!Number.isSafeInteger(file.size)||file.size<0||file.size>DEFAULT_LIMITS.maxBytes)throw new RangeError(`MIDI file must be at most ${DEFAULT_LIMITS.maxBytes} bytes.`);
 const data=await file.arrayBuffer();checkAbort(signal);
 if(!(data instanceof ArrayBuffer)||data.byteLength!==file.size)throw new Error('MIDI file size changed while reading.');
 const name=file.name.slice(0,DEFAULT_LIMITS.maxTextChars),bytes=new Uint8Array(data);
 const notes=validateNoteList(parseSMF(bytes,{name}));checkAbort(signal);
 if(!globalThis.crypto?.subtle)throw new Error('This browser cannot compute the MIDI file fingerprint.');
 const digest=await globalThis.crypto.subtle.digest('SHA-256',bytes);checkAbort(signal);
 const sha256=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
 return {source:{name,bytes:data.byteLength,sha256},notes};
}
