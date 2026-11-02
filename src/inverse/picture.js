export const INVERSE_ENVELOPE_DISPLAY_GAIN=1800;
export const INVERSE_MAX_WIDENING=.14;
/** A display interpretation, not energy or acoustic deformation. One gain for
 * every body/candidate; overlap adds envelopes, not per-candidate normalization. */
export function inversePicture(snapshot,{reducedMotion=false}={}){
 const envelopes=[0,0,0],strikes=[];
 for(const strike of snapshot.strikes??[]){
  if(!Number.isInteger(strike.body)||strike.body<0||strike.body>2||!Number.isFinite(strike.age)||strike.age<0)throw new Error('Picture needs a valid strike identity and age.');
  if(!Array.isArray(strike.envelope)||strike.envelope.length!==3)throw new Error('Picture needs three response envelopes.');
  for(let i=0;i<3;i++){const value=strike.envelope[i];if(!Number.isFinite(value)||value<0||!Number.isFinite(envelopes[i]+value))throw new Error('Picture envelopes and their sums must be finite and nonnegative.');envelopes[i]+=value;}
  strikes.push({body:strike.body,age:strike.age,strikeU:.5});
 }
 return {strikes,bodies:envelopes.map(envelope=>{
  const level=Math.min(1,envelope*INVERSE_ENVELOPE_DISPLAY_GAIN);
  return {envelope,level,width:reducedMotion?1:1+INVERSE_MAX_WIDENING*level,haloOpacity:.15+.65*level,shellEmission:.025+.5*level,coreEmission:.1+level};
 })};
}
