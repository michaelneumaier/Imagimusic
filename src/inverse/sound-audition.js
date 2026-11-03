/** A listening copy, never an analysis input. One scalar preserves channel
 * balance; quiet files are not boosted. Float32 is the Web Audio buffer format.
 */
export function prepareSoundAudition(decoded){
 const gain=.25/Math.max(1,decoded.peak);
 return {sampleRate:decoded.sampleRate,gain,
  channels:decoded.channels.map(channel=>Float32Array.from(channel,value=>value*gain))};
}
