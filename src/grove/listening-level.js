export const LISTENING_MAX_DB=20;
export const LISTENING_CEILING=.95;
export function listeningGain(db){
 if(!Number.isFinite(db)||db<0||db>LISTENING_MAX_DB)throw new Error('Listening level must be between 0 and 20 dB');
 return 10**(db/20);
}
/** Piecewise-linear sample ceiling, not a loudness guarantee or a true-peak limiter.
 * Below the ceiling the curve is linear; larger samples can distort. */
export function listeningCeilingCurve(){
 const curve=new Float32Array(8193);
 for(let i=0;i<curve.length;i++){const x=2*i/(curve.length-1)-1;curve[i]=Math.max(-LISTENING_CEILING,Math.min(LISTENING_CEILING,x));}
 return curve;
}
/** Downstream listening treatment only. Never place this in a canonical renderer. */
export function createListeningLevel(context,{db=0}={}){
 const initial=listeningGain(db),gain=context.createGain(),ceiling=context.createWaveShaper();
 let disposed=false,currentDb=db;
 gain.gain.value=initial;ceiling.curve=listeningCeilingCurve();ceiling.oversample='none';
 gain.connect(ceiling);
 return {input:gain,output:ceiling,setDb(next){
  const value=listeningGain(next);if(disposed)throw new Error('Listening stage is closed');
  const now=context.currentTime;
  // cancelAndHold retains a ramp's instantaneous value during rapid adjustments.
  if(typeof gain.gain.cancelAndHoldAtTime==='function')gain.gain.cancelAndHoldAtTime(now);
  else{gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);}
  gain.gain.linearRampToValueAtTime(value,now+.03);currentDb=next;
 },get db(){return currentDb;},dispose(){if(disposed)return;disposed=true;gain.disconnect();ceiling.disconnect();}};
}
