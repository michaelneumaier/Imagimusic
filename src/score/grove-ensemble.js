// A fixed authored phrase for an ensemble of intact Groves (Astra's harmonic experiment, 2026-11-01): three separately admitted Rest records
// on a shared beat grid, one per Grove, so the same gesture histories can be rendered on all-C3 and on C3/E♭3/G3 and mixed as an arrangement.
// The mix is an audio sum made elsewhere; nothing here couples the Groves. Pure; no claim about what the result sounds like.
import { canonicalVoiceConfig } from './grove-voice.js';
import { canonicalGrove } from './grove.js';
import { restInvitationRecord, validateRestAdmission, REST_QUIET_FADE_SECONDS } from './grove-rest.js';

export const ENSEMBLE_PHRASE_VERSION = 1;
export const ENSEMBLE_BOUNDS = Object.freeze({ parts: 3, minSeconds: 6, maxSeconds: 20 });

/** The chord arrives one Grove at a time (beats 0, 1, 2 on body 1 of each), a firm hand rests on the first Grove's struck body while the other
 *  two ring (beats 3.5 to 6), then all three are struck together (beat 8), and every part goes Quiet at beat 12 so the arrangement ends together.
 *  Requires three recipes with the same voice and sample rate; their Groves may differ (that is the point). Per-part commands are identical
 *  across arrangements because they depend only on the beat grid, the position vocabulary and the firm strength. */
export function composeEnsemblePhrase(recipes, { tempo = 72 } = {}) {
  if (!Array.isArray(recipes) || recipes.length !== ENSEMBLE_BOUNDS.parts) throw new Error(`the ensemble phrase is written for ${ENSEMBLE_BOUNDS.parts} parts.`);
  if (!Number.isInteger(tempo) || tempo < 40 || tempo > 160) throw new Error('tempo must be an integer in 40..160.');
  const sr = recipes[0].sampleRate, voice = canonicalVoiceConfig(recipes[0].voice);
  recipes.forEach((r, i) => { if (r.sampleRate !== sr) throw new Error(`part ${i}: sample rate differs.`); if (canonicalVoiceConfig(r.voice) !== voice) throw new Error(`part ${i}: voice differs.`); if (r.strengths.findIndex(s => s.name === 'firm') < 0 || !r.zones?.length || !r.positions?.length) throw new Error(`part ${i}: needs the firm strength, a zone and a position.`); });
  const beat = b => Math.round(b * 60 / tempo * sr), firm = recipes[0].strengths.findIndex(s => s.name === 'firm'), tip = recipes[0].zones.length - 1, position = Math.floor((recipes[0].positions.length - 1) / 2);
  const strike = (id, b, velocity) => ({ id, kind: 'strike', frame: beat(b), body: 0, position, velocity });
  const quiet = { id: 'ensemble-quiet', kind: 'quiet', frame: beat(12), fadeFrames: Math.round(REST_QUIET_FADE_SECONDS * sr) };
  const parts = [
    { index: 0, role: 'root', commands: [strike('ensemble-arrive-1', 0, 0.6), { id: 'ensemble-hand', kind: 'contact', frame: beat(3.5), body: 0, zone: tip, strength: firm }, { id: 'ensemble-lift', kind: 'contact', frame: beat(6), body: 0, zone: null }, strike('ensemble-together-1', 8, 0.5), { ...quiet }] },
    { index: 1, role: 'third', commands: [strike('ensemble-arrive-2', 1, 0.6), strike('ensemble-together-2', 8, 0.5), { ...quiet }] },
    { index: 2, role: 'fifth', commands: [strike('ensemble-arrive-3', 2, 0.6), strike('ensemble-together-3', 8, 0.5), { ...quiet }] },
  ];
  const seconds = +(beat(12) / sr + REST_QUIET_FADE_SECONDS).toFixed(3);
  if (seconds < ENSEMBLE_BOUNDS.minSeconds || seconds > ENSEMBLE_BOUNDS.maxSeconds) throw new Error(`phrase lasts ${seconds} s; bound is ${ENSEMBLE_BOUNDS.minSeconds}..${ENSEMBLE_BOUNDS.maxSeconds} s.`);
  const sections = [{ id: 'arrive', beats: [0, 3.5] }, { id: 'hand', beats: [3.5, 6] }, { id: 'ring', beats: [6, 8] }, { id: 'together', beats: [8, 12] }, { id: 'quiet', beats: [12, 12] }];
  return { version: ENSEMBLE_PHRASE_VERSION, tempo, sampleRate: sr, voice, seconds, endFrame: beat(12), position, zone: tip, parts, sections, bases: recipes.map(r => r.grove.cluster.baseMidi), groves: recipes.map(r => canonicalGrove(r.grove)) };
}

/** One admitted Rest record per part, on its own recipe; the same commands composed on different recipes yield records that differ only in
 *  grove and voice-derived fields. Each record is validated and admitted independently; the arrangement is their sum elsewhere. */
export function ensembleRecords(recipes, phrase) {
  if (phrase?.version !== ENSEMBLE_PHRASE_VERSION || recipes.length !== phrase.parts.length) throw new Error('phrase does not match these recipes.');
  // Bound to the exact instruments it was composed for (the commands are grove-independent, the record is not).
  return phrase.parts.map((part, i) => { if (recipes[i].sampleRate !== phrase.sampleRate || canonicalVoiceConfig(recipes[i].voice) !== phrase.voice || canonicalGrove(recipes[i].grove) !== phrase.groves[i]) throw new Error(`part ${i}: recipe differs from the phrase.`); const record = restInvitationRecord(recipes[i], { commands: part.commands }); validateRestAdmission(record, recipes[i]); return record; });
}
