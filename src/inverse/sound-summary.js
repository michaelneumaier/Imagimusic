/** One min/max interval per bucket; every source frame contributes exactly once.
 * Display reduction only. Samples, channels and their relative scales are unchanged.
 */
export function summarizeInverseSound(decoded,bucketLimit=640){
 if(!Number.isInteger(bucketLimit)||bucketLimit<1||bucketLimit>2048)throw new Error('Invalid waveform bucket limit.');
 const count=Math.min(bucketLimit,decoded.frameCount);
 const waveforms=decoded.channels.map(samples=>{
  const minimum=new Float64Array(count),maximum=new Float64Array(count);minimum.fill(Infinity);maximum.fill(-Infinity);
  let squareSum=0,sum=0;
  for(let i=0;i<samples.length;i++){const value=samples[i],bucket=Math.min(count-1,Math.floor(i*count/samples.length));minimum[bucket]=Math.min(minimum[bucket],value);maximum[bucket]=Math.max(maximum[bucket],value);squareSum+=value*value;sum+=value;}
  return {minimum,maximum,rms:Math.sqrt(squareSum/samples.length),mean:sum/samples.length};
 });
 return {sampleRate:decoded.sampleRate,frameCount:decoded.frameCount,duration:decoded.duration,encoding:decoded.encoding,peak:decoded.peak,atOrAboveUnitySamples:decoded.atOrAboveUnitySamples,waveforms};
}
