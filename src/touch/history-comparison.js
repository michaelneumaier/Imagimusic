import {prepareTouchHistory} from './history.js';
import {getLoomJourney} from '../listen/journeys.js';
/** Two independently admitted histories, unchanged gestures and one shared axis. */
export function prepareTouchHistoryComparison(record,targetId){
 const original=prepareTouchHistory(record),target=getLoomJourney(targetId);
 const changes=Object.keys(original.record.settings).filter(key=>original.record.settings[key]!==target.settings[key]).map(parameter=>({parameter,from:original.record.settings[parameter],to:target.settings[parameter]}));
 if(!changes.length)throw new Error('This connection already matches the original.');
 const changed={...structuredClone(original.record),settings:structuredClone(target.settings)};
 const comparison=prepareTouchHistory(changed);
 return {original,comparison,targetId:target.id,targetTitle:target.title,changes,duration:Math.max(original.duration,comparison.duration)};
}
