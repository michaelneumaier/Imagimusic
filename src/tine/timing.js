// Integer milliseconds preserve the UI grid exactly. Strength and total impulse
// budget do not change when the visitor changes the space between touches.
export function createTineTiming({firstGapMs=800,secondGapMs=1300}={}){
 for(const value of [firstGapMs,secondGapMs])if(!Number.isInteger(value)||value<200||value>2000||value%100)throw Error('Each gap must be 200…2000 milliseconds in steps of 100.');
 return Object.freeze({firstGapMs,secondGapMs});
}
export function tineTimingPhrase(value=createTineTiming()){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==2||!Object.hasOwn(value,'firstGapMs')||!Object.hasOwn(value,'secondGapMs'))throw Error('Unsupported tine timing.');
 const timing=createTineTiming(value),lastMs=timing.firstGapMs+timing.secondGapMs;
 return Object.freeze({timing,events:Object.freeze([
  Object.freeze({time:0,strength:.25}),
  Object.freeze({time:timing.firstGapMs/1000,strength:.15}),
  Object.freeze({time:lastMs/1000,strength:.25})
 ]),seconds:(lastMs+4000)/1000});
}
