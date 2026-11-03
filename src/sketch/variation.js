import {createResonanceSketch} from './model.js';
/** Change envelope time constants while retaining the supplied oscillation
 * frequencies and quadratures. This reconstructs stiffness and initial velocity
 * along with damping; it is not a damping-only edit to a fixed physical body.
 */
export function varySketchDecay(input,scale=1){
 if(!Number.isFinite(scale)||scale<.5||scale>2)throw Error('Decay multiplier must be within 0.5…2.');
 const original=createResonanceSketch(input);
 const parameters={frequencies:original.modes.map(m=>m.frequency),decays:original.modes.map(m=>m.decay*scale),coefficients:original.modes.flatMap(m=>[m.a,m.b])};
 // Refuse rather than silently clipping any time constant outside the model.
 createResonanceSketch(parameters);
 for(const array of Object.values(parameters))Object.freeze(array);
 return Object.freeze({parameters:Object.freeze(parameters),scale,changed:scale!==1});
}
