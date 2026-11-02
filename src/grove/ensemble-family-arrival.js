import {GROVE_SEEDS} from '../score/grove.js';
/** A link chooses an initial anatomy, never starts audio or restores a passage. */
export function ensembleFamilyFromSearch(search){
 const values=new URLSearchParams(search).getAll('family');
 return values.length===1&&GROVE_SEEDS.some(seed=>String(seed)===values[0])?Number(values[0]):3;
}
