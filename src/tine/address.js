import {TINE_PICKUP_GAIN} from './render.js';
export const TINE_ADDRESS_LIMIT=2048;
const fields=['kind','version','lengthMm','widthMm','activation','pickup'];
export function createTineDesign({lengthMm=80,widthMm=10,activation=.85,pickup=.85}={}){
 if(!Number.isInteger(lengthMm)||lengthMm<60||lengthMm>120||lengthMm%5)throw Error('Length must be 60…120 mm in steps of 5.');
 if(!Number.isInteger(widthMm)||widthMm<5||widthMm>20)throw Error('Width must be 5…20 mm in steps of 1.');
 // Match the actual range-control values exactly; do not round accepted records.
 for(const [name,x] of Object.entries({activation,pickup}))if(typeof x!=='number'||!Number.isFinite(x)||x<0||x>1||x!==Math.round(x*20)/20)throw Error(`${name} must be 0…1 in steps of 0.05.`);
 return Object.freeze({kind:'imagimusic-tine-design',version:1,lengthMm,widthMm,activation,pickup});
}
function validate(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==fields.length||!fields.every(key=>Object.hasOwn(value,key))||value.kind!=='imagimusic-tine-design'||value.version!==1)throw Error('Unsupported tine design record.');
 return createTineDesign(value);
}
/** Version 1 fixes the page's material, thickness, impulse, retained modes,
 * pickup conversion and listening ending. No held reference or gesture data.
 */
export function requestForTineDesign(value){
 const record=validate(value);
 if(TINE_PICKUP_GAIN!==100)throw Error('The version 1 tine pickup conversion is unavailable.');
 return {geometry:{kind:'beam',support:'clamped-free',lengthM:record.lengthMm/1000,widthM:record.widthMm/1000,thicknessM:.001,material:{E:200e9,rho:7850,eta:.0002}},options:{count:4,activation:record.activation,pickup:record.pickup,impulseNs:1e-6,sampleRate:48000,seconds:4}};
}
export function tineAddressFragment(value){return '#tine='+encodeURIComponent(JSON.stringify(validate(value)));}
export function readTineAddress(hash){
 if(hash===''||hash==='#')return null;
 if(typeof hash!=='string'||hash.length>TINE_ADDRESS_LIMIT||!hash.startsWith('#tine='))throw Error('Unsupported or oversized tine address.');
 let value;try{value=JSON.parse(decodeURIComponent(hash.slice(6)));}catch{throw Error('The tine address could not be read.');}
 return validate(value);
}
// Shared strict canonical copy for compound records; the body-only format stays v1.
export {validate as validateTineDesign};
