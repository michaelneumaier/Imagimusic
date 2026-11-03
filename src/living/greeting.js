import {createLivingRecord} from './record.js';
import {createTineDesign} from '../tine/address.js';
/** Authored invitation, separate from any visitor capture. A strong beginning,
 * a light nearby answer, then a more distant third touch and room to decay. */
export function createLivingGreeting(){
 return createLivingRecord({kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:24000,strength:.1},{frame:55200,strength:.025},{frame:105600,strength:.05}],fadeStart:190800}).source;
}
