/** Recorded excitation cues; independent of the modeled response envelope.
 * Most recent strike wins per body, with no accumulated animation state.
 * `remembered` (default false) is carried through untouched: it says only whether the acknowledged strike belonged to a remembered opening
 * (the host decides, by plan membership), never whether it was authored or personal. */
export function groveStrikeMarkers(strikes,bodyCount){
 const markers=Array(bodyCount).fill(null);
 for(const strike of strikes){
  if(!Number.isInteger(strike.body)||strike.body<0||strike.body>=bodyCount||!Number.isFinite(strike.age)||strike.age<0||strike.age>=.3)continue;
  const old=markers[strike.body];if(old&&old.age<strike.age)continue;
  const progress=strike.age/.3;
  markers[strike.body]={age:strike.age,u:strike.strikeU??.5,opacity:.8*(1-progress)**2,scale:1+.35*progress,remembered:strike.remembered===true};
 }
 return markers;
}
