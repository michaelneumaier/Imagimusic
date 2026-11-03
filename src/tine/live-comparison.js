import {createTineDesign} from './address.js';
import {validateTineLiveRecord,renderTineLiveRecord} from './live-record.js';
/** Keep the performed phrase and its original body intact. Dimensional changes
 * preserve relative strike/pickup positions, not their distances from the clamp.
 * Every candidate is re-admitted at the original rate and cumulative budget.
 */
export function createTineLiveComparison(source,dimensions){
 const original=validateTineLiveRecord(source);
 if(!dimensions||typeof dimensions!=='object'||Array.isArray(dimensions)||Object.keys(dimensions).length!==2||!Object.hasOwn(dimensions,'lengthMm')||!Object.hasOwn(dimensions,'widthMm'))throw Error('Choose only a length and width for this comparison.');
 const design=createTineDesign({...original.design,...dimensions});
 const candidate=validateTineLiveRecord({...original,design});
 return Object.freeze({original,candidate});
}
export function renderTineLiveComparison(source,dimensions){
 const pair=createTineLiveComparison(source,dimensions);
 // Validate both records before allocating either output. Neither input is edited.
 return {original:renderTineLiveRecord(pair.original),candidate:renderTineLiveRecord(pair.candidate)};
}
