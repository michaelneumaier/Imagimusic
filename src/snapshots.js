/** Copy only model inputs into the visual bus; never expose AudioNodes or geometry functions. */
export function modalSnapshot(voice){
  return {id:voice.id,slot:voice.index,noteHz:voice.modes[0]?.frequency??0,velocity:voice.velocity,noteOn:voice.time,end:voice.end,position:voice.position,approach:voice.approach,
    fadeAt:voice.fadeAt,fadeDuration:voice.fadeDuration,fadeFrom:voice.fadeFrom,
    modes:voice.modes.map(({frequency,amplitude,decay})=>({frequency,amplitude,decay}))};
}
export function bellowsSnapshot(voice){
  return {id:voice.id,slot:voice.slot,noteHz:voice.noteHz,velocity:voice.velocity,noteOn:voice.noteOn,noteOff:voice.noteOff,
    bellows:structuredClone(voice.patch.bellows),stolenAt:voice.stolenAt,stolenFade:.04,stolenAmp:voice.stolenAmp,stolenEnv:voice.stolenEnv};
}
