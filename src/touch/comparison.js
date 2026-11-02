import {rebuildTouchRecord} from './record.js';
import {prepareTouchRecord} from './return-preparation.js';
import {getLoomJourney} from '../listen/journeys.js';

/** One explicit derived version. Keep the source record as its own object;
 * settings are the only edit and every gesture must pass target admission.
 * This is an in-memory comparison result, not a new portable file format.
 */
export function prepareTouchComparison(input,targetId){
 const {record:source,session:original}=rebuildTouchRecord(input),target=getLoomJourney(targetId);
 const changes=Object.keys(source.settings).filter(key=>source.settings[key]!==target.settings[key]).map(key=>({parameter:key,from:source.settings[key],to:target.settings[key]}));
 if(!changes.length)throw new Error('This connection already matches the original. Choose a different connection.');
 const derived={...structuredClone(source),settings:structuredClone(target.settings)};
 // prepareTouchRecord replays every event through the target's admission rule;
 // rejection aborts this whole preparation, never a subset of the gestures.
 const prepared=prepareTouchRecord(derived);
 return {...prepared,source,sourcePickupScale:original.units[0].pickupScale,targetId:target.id,targetTitle:target.title,changes};
}
