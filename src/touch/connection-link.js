import {createTouchSession} from './session.js';
import {LOOM_JOURNEYS,getLoomJourney} from '../listen/journeys.js';
const keys=['frequency','coupling','detune','loss'];
function connection(settings){
 if(!settings||typeof settings!=='object'||Array.isArray(settings)||Object.keys(settings).length!==keys.length||keys.some(key=>!Object.hasOwn(settings,key)||!Number.isFinite(settings[key])))throw Error('A connection needs exactly four numeric settings.');
 const canonical=createTouchSession(settings).snapshot().settings;
 const preset=LOOM_JOURNEYS.find(item=>keys.every(key=>item.settings[key]===canonical[key]));
 return preset?{id:preset.id,title:preset.title,settings:canonical,custom:false}:{id:'custom',title:'Custom connection',settings:canonical,custom:true};
}
/** Carries an instrument, never a performance or an instruction to start audio. */
export function touchConnectionHref(settings){
 const selected=connection(settings),query=new URLSearchParams();
 if(selected.custom)query.set('connection',JSON.stringify(Object.fromEntries(keys.map(key=>[key,selected.settings[key]]))));
 else query.set('bridge',selected.id);
 return `touch.html?${query}`;
}
export function readTouchConnection(search){
 const query=new URLSearchParams(search),custom=query.getAll('connection'),preset=query.getAll('bridge');
 if(custom.length>1||preset.length>1||(custom.length&&preset.length))throw Error('The linked connection is ambiguous.');
 if(custom.length){
  if(custom[0].length>256)throw Error('The linked connection is too long.');
  let settings;try{settings=JSON.parse(custom[0]);}catch{throw Error('The linked connection is not valid JSON.');}
  return connection(settings);
 }
 return connection(getLoomJourney(preset[0]??'close-kin').settings);
}
