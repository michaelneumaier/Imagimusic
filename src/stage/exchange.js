import { validatePatch } from '../model.js';
const KEY='imagimusic-stage-patch-v4';
export function storeStagePatch(storage,patch){const validated=validatePatch(patch);storage.setItem(KEY,JSON.stringify(validated));return validated;}
export function readStagePatch(storage){const text=storage.getItem(KEY);if(text===null)throw new Error('No laboratory instrument was transferred.');if(text.length>20000)throw new Error('Transferred instrument is too large.');return validatePatch(JSON.parse(text));}
