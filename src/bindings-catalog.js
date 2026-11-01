// Starter bindings catalogue (slice A): the declared motions for the three families, matched to the body
// handles Astra's stage exposes (modal shell offsets, striker reach, tine deflection, iris aperture, bellows
// fill, horn intensity, LFO angle). Targets are 'family/slotN/part'. Every binding carries its honesty label and
// the caption note the UI renders, so caption and behavior share one source.
import { validateBindings } from './bindings.js';

const clamp01 = v => Math.max(0, Math.min(1, v));

export function defaultBindings({ gardenSlots = 8, tineSlot = 8, bellowsSlots = 6, modeLayers = 5 } = {}) {
  const list = [];
  for (let slot = 0; slot < gardenSlots; slot++) {
    const voice = `voices[resonator=garden/${slot}]`, T = `garden/slot${slot}`;
    list.push({ id: `${T}/striker/reach`, target: `${T}/striker`, param: 'reach', field: `${voice}.exciter.reach`, inputs: ['strikePosition', 'tempo'], label: 'interpreted-physical', note: 'the mallet approaches so contact lands on the audible onset' });
    list.push({ id: `${T}/striker/contact`, target: `${T}/striker`, param: 'contact', field: `${voice}.exciter.contact`, inputs: ['strikePosition'], label: 'interpreted-physical', note: 'contact flash at the strike point' });
    list.push({ id: `${T}/striker/position`, target: `${T}/striker`, param: 'position01', field: `${voice}.exciter.pos01`, inputs: ['strikePosition'], label: 'interpreted-physical', note: 'where along the body the mallet lands; changes which modes ring' });
    list.push({ id: `${T}/damper/pressure`, target: `${T}/damper`, param: 'pressure', field: `${voice}.damper.pressure`, inputs: ['release'], label: 'interpreted', note: 'a resting damper settles the body; release time is the patch release' });
    for (let layer = 0; layer < modeLayers; layer++) {
      list.push({ id: `${T}/shell${layer}/energy`, target: `${T}/shell${layer}`, param: 'energy', field: `${voice}.modes[${layer}].energy`, map: v => clamp01(v * 3), inputs: ['material', 'brightness', 'damping', 'strikePosition'], label: 'interpreted', note: `shell ${layer} shows the energy envelope of partial ${layer + 1}, not audio-rate motion` });
    }
  }
  const tine = `voices[resonator=tine/${tineSlot}]`, TT = `tine/slot${tineSlot}`;
  list.push({ id: `${TT}/striker/reach`, target: `${TT}/striker`, param: 'reach', field: `${tine}.exciter.reach`, inputs: ['strikePosition'], label: 'physical', note: 'mallet on the clamped-free tine; 0 = clamp, 1 = free tip' });
  list.push({ id: `${TT}/striker/position`, target: `${TT}/striker`, param: 'position01', field: `${tine}.exciter.pos01`, inputs: ['strikePosition'], label: 'physical', note: 'strike position weights each mode by its shape at that point' });
  for (let layer = 0; layer < modeLayers; layer++) {
    list.push({ id: `${TT}/mode${layer}/energy`, target: `${TT}/deflection`, param: `mode${layer}`, field: `${tine}.modes[${layer}].energy`, map: v => clamp01(v * 3), inputs: ['geometry.lengthM', 'geometry.thicknessM', 'geometry.material', 'damping'], label: 'physical', note: `amplified deflection of mode shape ${layer + 1}; frequency and shape follow from geometry, amplitude weight is stylized` });
  }
  for (let slot = 0; slot < bellowsSlots; slot++) {
    const voice = `voices[resonator=bellows/${slot}]`, T = `bellows/slot${slot}`;
    list.push({ id: `${T}/iris/aperture`, target: `${T}/iris`, param: 'aperture', field: `${voice}.modules.filter.aperture01`, inputs: ['bellows.cutoffHz', 'bellows.envAmount', 'bellows.keyTrack', 'bellows.lfo.depthOct', 'bellows.lfo.target', 'voice.noteHz'], label: 'interpreted', note: 'iris opening = filter cutoff on a log scale (20 Hz closed, 20 kHz open)' });
    list.push({ id: `${T}/iris/tautness`, target: `${T}/iris`, param: 'tautness', field: `${voice}.modules.filter.resonance`, inputs: ['bellows.resonance'], label: 'interpreted', note: 'membrane tautness = filter resonance' });
    list.push({ id: `${T}/bellows/fill`, target: `${T}/bellows`, param: 'fill', field: `${voice}.exciter.fill01`, inputs: ['bellows.adsr.a', 'bellows.adsr.d', 'bellows.adsr.s', 'bellows.adsr.r'], label: 'interpreted', note: 'bellows squeeze on attack, hold through sustain, relax on release (amp envelope)' });
    list.push({ id: `${T}/pendulum/angle`, target: `${T}/pendulum`, param: 'angle', field: `${voice}.modules.lfo.value`, map: v => v * 0.65, inputs: ['bellows.lfo.rateHz', 'bellows.lfo.wave'], label: 'interpreted', note: 'pendulum = LFO; above ~8 Hz the stage draws its swing range, not the bob' });
    list.push({ id: `${T}/horn/intensity`, target: `${T}/horn`, param: 'intensity', field: `${voice}.modules.amp.level`, inputs: ['bellows.adsr.s', 'bellows.lfo.depthOct', 'voice.velocity'], label: 'interpreted', note: 'horn flare = output level; no acoustic radiation is modeled' });
    list.push({ id: `${T}/source/level`, target: `${T}/source`, param: 'level', field: `${voice}.modules.source.level`, inputs: ['bellows.source'], label: 'interpreted', note: 'reed / toothed wheel / jet drive; air has no fundamental, its pitch target scales playback rate' });
  }
  list.push({ id: 'stage/light/intensity', target: 'stage/light', param: 'intensity', field: 'out.modeledIntensity', inputs: [], label: 'interpreted', note: 'modeled output intensity (sum of voice levels), not a measured RMS' });
  return validateBindings(list);
}
