// Starter bindings catalogue (slice A): the declared motions for the three families, matched to the body
// handles Astra's stage exposes (modal shell offsets, striker reach, tine deflection, iris aperture, bellows
// fill, horn intensity, LFO angle). Targets are 'family/slotN/part'. Every binding carries its honesty label and
// the caption note the UI renders, so caption and behavior share one source.
import { validateBindings } from './bindings.js';

const clamp01 = v => Math.max(0, Math.min(1, v));

// Per-parameter inputs and notes, keyed by family then stage parameter name, for the inspector: what a viewer is
// told a motion depends on. The stage projection (src/stage/projection.js) looks these up by (family, param) so
// aggregate per-slot fields and truthful inputs come from one place. 'modeN' covers mode0..mode4.
export const STAGE_INPUTS = {
  garden: {
    modeN:   { inputs: ['material', 'brightness', 'damping', 'strikePosition', 'voice.velocity'], note: 'shell N shows the summed energy envelope of partial N+1 across overlapping strikes; slow sway is stylized, not audio-rate motion' },
    striker: { inputs: ['strikePosition', 'tempo'], note: 'the mallet approaches so contact lands on the audible onset; where it lands changes which partials ring' },
    damper:  { inputs: ['release'], note: 'a resting damper settles the body; release time is the patch release' },
  },
  tine: {
    length:     { inputs: ['geometry.lengthM'], note: 'beam length from the patch geometry; pitch falls with the square of length' },
    thickness:  { inputs: ['geometry.thicknessM'], note: 'beam thickness from the patch geometry; pitch rises with thickness' },
    width:      { inputs: ['geometry.widthM'], note: 'beam width from the patch geometry; it changes mass and stiffness together, so pitch does not change' },
    deflection: { inputs: ['geometry.lengthM', 'geometry.thicknessM', 'geometry.material', 'damping', 'strikePosition', 'voice.velocity'], note: 'amplified, slowed mode-shape deflection; frequencies and shapes follow from geometry, amplitude weights are stylized' },
    reach:      { inputs: ['strikePosition'], note: 'mallet on the clamped-free tine' },
    position:   { inputs: ['strikePosition'], note: '0 = clamp, 1 = free tip; the strike point weights each mode by its shape there' },
    visible:    { inputs: [], note: 'the mallet is shown only during approach, contact, and recovery' },
    damper:     { inputs: ['release'], note: 'a resting damper settles the tine; release time is the patch release' },
    modeN:      { inputs: ['geometry.lengthM', 'geometry.thicknessM', 'geometry.material', 'damping'], note: 'energy of mode N+1' },
  },
  bellows: {
    fill:      { inputs: ['bellows.adsr.a', 'bellows.adsr.d', 'bellows.adsr.s', 'bellows.adsr.r'], note: 'bellows squeeze on attack, hold through sustain, relax on release (amp envelope)' },
    // cutoff = cutoffHz · 2^(envAmount · env) · 2^(depth · lfo if target = cutoff) · (noteHz / C4)^keyTrack, so every ADSR
    // stage and every LFO control is causal for the iris.
    aperture:  { inputs: ['bellows.cutoffHz', 'bellows.envAmount', 'bellows.adsr.a', 'bellows.adsr.d', 'bellows.adsr.s', 'bellows.adsr.r', 'bellows.keyTrack', 'bellows.lfo.wave', 'bellows.lfo.rateHz', 'bellows.lfo.depthOct', 'bellows.lfo.target', 'voice.noteHz'], note: 'iris opening = filter cutoff on a log scale (20 Hz closed, 20 kHz open); the bellows sweeps it by envAmount octaves and the pendulum by depth octaves when aimed at cutoff' },
    // amp = env · velocity · tremolo(lfo if target = amp)
    level:     { inputs: ['bellows.adsr.a', 'bellows.adsr.d', 'bellows.adsr.s', 'bellows.adsr.r', 'bellows.lfo.wave', 'bellows.lfo.rateHz', 'bellows.lfo.depthOct', 'bellows.lfo.target', 'voice.velocity'], note: 'horn light follows modeled output level (envelope × velocity × tremolo); no acoustic radiation is modeled' },
    swing:     { inputs: ['bellows.lfo.rateHz', 'bellows.lfo.wave'], note: 'pendulum = LFO; above ~8 Hz the bob is not drawn and only its swing range is shown' },
    fast:      { inputs: ['bellows.lfo.rateHz'], note: 'pendulum too fast to draw at 60 fps (above ~8 Hz): its swing range is shown as an arc instead of the bob' },
    resonance: { inputs: ['bellows.resonance'], note: 'membrane tautness = filter resonance' },
    source:    { inputs: ['bellows.source'], note: 'reed / toothed wheel / jet; air has no fundamental, its pitch target scales playback rate' },
    tautness:  { inputs: ['bellows.resonance'], note: 'membrane tautness = filter resonance' },
  },
  stage: {
    intensity: { inputs: [], note: 'modeled output intensity (sum of voice levels), not a measured RMS' },
  },
};

/** Look up inputs/note for a stage binding; 'mode3' falls back to 'modeN'. Returns null when nothing is declared. */
export function stageInputsFor(family, param) {
  const table = STAGE_INPUTS[family]; if (!table) return null;
  return table[param] ?? (/^mode\d+$/.test(param) ? table.modeN ?? null : null);
}

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
