// Continue from this passage: a pure, bounded generator of continuation steps from a strict ensemble record.
// Proposal: collab/notes/fable-ensemble-seed.md (sections 2 and 7). No audio is scheduled here; no wrapper or schema is written here.
// The steps are "an opening made from the passage": the source's gesture edges replayed on a fresh mount, its Quiet and fade omitted,
// hands still down at the source's ending released once at the handoff, which is the source's ended.frame.
import { validateEnsembleRecord, ENSEMBLE_RECORD_KIND } from './grove-ensemble-record.js';

export const CONTINUATION_MAX_SECONDS = 20;
export const CONTINUATION_MAX_EDGES = 32;
export const CONTINUATION_OPERATION = 'continue-from-passage';
export const CONTINUATION_EDGES = Object.freeze(['release', 'set', 'strike']);
export const CONTINUATION_ORDER = 'frame, then part, then synthetic releases before explicit events at that frame, then explicit strikes and contact sets by the record\'s stored order, then body';

/** Generate the bounded continuation steps of a strict, ordinary ensemble record; refuses rather than truncates. Pure: equal inputs give equal outputs; the source is never modified. */
export function continuationSteps(input, { sampleRate } = {}) {
  if (!input || typeof input !== 'object' || input.kind !== ENSEMBLE_RECORD_KIND) throw new Error('Choose an original saved ensemble as the source of a continuation.');
  const source = structuredClone(input);
  validateEnsembleRecord(source, { admission: false });                                   // strict ordinary schema; admission belongs to the live host on reapplication
  if (sampleRate !== undefined && source.sampleRate !== sampleRate) throw new Error(`The source was kept at ${source.sampleRate} Hz; this passage runs at ${sampleRate} Hz. Continuation needs the same rate.`);
  const handoffFrame = source.ended.frame;
  if (handoffFrame > CONTINUATION_MAX_SECONDS * source.sampleRate) throw new Error(`The source lasts longer than ${CONTINUATION_MAX_SECONDS} s before its ending; continuation takes the whole passage or nothing.`);
  const steps = [];
  source.parts.forEach((part, index) => {
    const record = part.record;
    for (const e of record.events) steps.push({ frame: e.frame, part: index, edge: 'strike', order: e.order, body: e.body, command: { kind: 'strike', body: e.body, position: e.position, velocity: e.velocity } });
    const starts = new Set(record.contacts.map(c => `${c.body}:${c.start}`));
    for (const c of record.contacts) {
      steps.push({ frame: c.start, part: index, edge: 'set', order: c.order, body: c.body, command: { kind: 'contact', body: c.body, zone: c.zone, strength: c.strength } });
      // A release is synthetic (no stored order). None when the next contact on the body starts exactly at this end (a change of zone, applied by its own set).
      // A contact ending at the source's ending was closed by its Quiet: one release at the handoff, generated once from the stored endpoint.
      if (c.end > handoffFrame) throw new Error('A contact ends after the source\'s ending.');
      if (!starts.has(`${c.body}:${c.end}`)) steps.push({ frame: c.end, part: index, edge: 'release', order: null, body: c.body, command: { kind: 'contact', body: c.body, zone: null, strength: null } });
    }
  });
  if (steps.length > CONTINUATION_MAX_EDGES) throw new Error(`The source has ${steps.length} gesture edges; continuation takes at most ${CONTINUATION_MAX_EDGES}.`);
  if (!steps.some(s => s.edge === 'strike')) throw new Error('The source has no strike to continue from.');
  // Total order: frame, part, synthetic releases before explicit events, explicit events by stored order, then body.
  const rank = s => (s.order === null ? 0 : 1);
  steps.sort((a, b) => a.frame - b.frame || a.part - b.part || rank(a) - rank(b) || (a.order === null ? 0 : a.order - b.order) || a.body - b.body);
  return Object.freeze(steps.map((s, i) => Object.freeze({ ...s, id: `continuation-${i}`, command: Object.freeze(s.command) })));
}

/** The handoff frame is the source's ending, in the source's own frame space; the steps' frames are offsets from the continuation's scheduling base. */
export function continuationHandoffFrame(input) {
  if (!input || typeof input !== 'object' || !input.ended || !Number.isSafeInteger(input.ended.frame)) throw new Error('not an ensemble record');
  return input.ended.frame;
}
