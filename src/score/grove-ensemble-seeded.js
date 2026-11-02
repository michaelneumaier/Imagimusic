// A seeded ensemble: a strict v1 ensemble record kept after "Continue from this passage", wrapped with its provenance.
// Proposal: collab/notes/fable-ensemble-seed.md (sections 7 and 8). The wrapper declares the source's identity (a hash, verifiable only with the
// source in hand), the signed placement of the remembered opening inside the kept passage, and a per-edge ledger of what was requested, what the
// processor applied or refused, and what it never reached. Nothing here schedules audio; the host owns the live passage.
import { validateEnsembleRecord, canonicalEnsembleRecord, ENSEMBLE_RECORD_KIND, ENSEMBLE_RECORD_VERSION } from './grove-ensemble-record.js';
import { canonicalEnsembleSha256 } from './grove-ensemble-derived.js';
import { continuationPlan, CONTINUATION_OPERATION, CONTINUATION_EDGES, CONTINUATION_MAX_EDGES } from './grove-ensemble-continuation.js';

export const ENSEMBLE_SEEDED_KIND = 'imagimusic-grove-ensemble-seeded', ENSEMBLE_SEEDED_VERSION = 1;
export const SEEDED_HANDOFFS = Object.freeze(['completed', 'aborted']);

const stable = value => JSON.stringify(value, (k, v) => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.fromEntries(Object.keys(v).sort().map(key => [key, v[key]])) : v);
const keysExactly = (obj, keys, what) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${what} must be an object.`); for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`${what}: unexpected key ${k}.`); for (const k of keys) if (!Object.hasOwn(obj, k)) throw new Error(`${what}: missing key ${k}.`); };
const signed = v => Number.isSafeInteger(v);
const INSTRUMENT_KEYS = ['version', 'kind', 'grove', 'voice', 'sampleRate', 'outputGain', 'zones', 'strengths'];
const instrument = record => stable(Object.fromEntries(INSTRUMENT_KEYS.map(k => [k, record[k]])));
/** The continuation plays the source's own instruments: every part's grove, voice, rate, gain, zones and strengths must be the source's, verbatim. */
function assertSameInstruments(ensemble, source) {
  if (ensemble.sampleRate !== source.sampleRate) throw new Error('The kept passage runs at another sample rate than its source.');
  ensemble.parts.forEach((p, i) => { if (instrument(p.record) !== instrument(source.parts[i].record)) throw new Error(`parts[${i}]: the kept passage's instrument differs from the source's.`); });
}

/** Strict validation of a seeded wrapper: exact keys, signed offsets, a coherent ledger, and the inner record as a strict v1 ensemble. */
export function validateSeededEnsemble(wrapper, { admission = true } = {}) {
  keysExactly(wrapper, ['kind', 'version', 'seededFrom', 'sourceStartFrame', 'opening', 'ensemble'], 'SeededEnsemble');
  if (wrapper.kind !== ENSEMBLE_SEEDED_KIND || wrapper.version !== ENSEMBLE_SEEDED_VERSION) throw new Error('not a seeded ensemble (version 1).');
  keysExactly(wrapper.seededFrom, ['kind', 'version', 'canonicalSha256', 'operation'], 'seededFrom');
  const s = wrapper.seededFrom;
  if (s.kind !== ENSEMBLE_RECORD_KIND || s.version !== ENSEMBLE_RECORD_VERSION) throw new Error('seededFrom must name a version-1 ensemble record.');
  if (typeof s.canonicalSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(s.canonicalSha256)) throw new Error('seededFrom.canonicalSha256 must be 64 lowercase hex characters.');
  if (s.operation !== CONTINUATION_OPERATION) throw new Error(`unsupported seeding operation ${String(s.operation)}.`);
  if (!signed(wrapper.sourceStartFrame)) throw new Error('sourceStartFrame must be a signed safe integer (the opening\'s base relative to the kept passage\'s origin).');
  const o = wrapper.opening;
  keysExactly(o, o?.handoff === 'completed' ? ['handoff', 'effective', 'boundaryFrame', 'ledger'] : ['handoff', 'effective', 'ledger'], 'opening');
  if (!SEEDED_HANDOFFS.includes(o.handoff)) throw new Error('opening.handoff must be completed or aborted.');
  if (!Array.isArray(o.ledger) || !o.ledger.length || o.ledger.length > CONTINUATION_MAX_EDGES) throw new Error(`opening.ledger must hold 1 to ${CONTINUATION_MAX_EDGES} entries.`);
  let effective = false, maxApplied = null;
  o.ledger.forEach((entry, i) => {
    keysExactly(entry, ['id', 'part', 'edge', 'requestedFrame', 'appliedFrame', 'accepted', 'reason'], `opening.ledger[${i}]`);
    if (entry.id !== `continuation-${i}`) throw new Error(`opening.ledger[${i}].id must be continuation-${i} (plan order).`);
    if (![0, 1, 2].includes(entry.part)) throw new Error(`opening.ledger[${i}].part must be 0, 1 or 2.`);
    if (!CONTINUATION_EDGES.includes(entry.edge)) throw new Error(`opening.ledger[${i}].edge must be one of ${CONTINUATION_EDGES.join(', ')}.`);
    if (!signed(entry.requestedFrame)) throw new Error(`opening.ledger[${i}].requestedFrame must be a signed safe integer.`);
    if (entry.accepted === null) { if (entry.appliedFrame !== null || entry.reason !== null) throw new Error(`opening.ledger[${i}]: an unprocessed edge has appliedFrame, accepted and reason all null.`); if (o.handoff === 'completed') throw new Error(`opening.ledger[${i}]: a completed handoff leaves no edge unprocessed.`); return; }
    if (typeof entry.accepted !== 'boolean' || !signed(entry.appliedFrame) || entry.appliedFrame < entry.requestedFrame) throw new Error(`opening.ledger[${i}]: a processed edge has a boolean accepted and an appliedFrame at or after requestedFrame.`);
    if (entry.accepted ? entry.reason !== null : (typeof entry.reason !== 'string' || !entry.reason.length)) throw new Error(`opening.ledger[${i}]: reason is null when accepted and a non-empty string when refused.`);
    maxApplied = maxApplied === null ? entry.appliedFrame : Math.max(maxApplied, entry.appliedFrame);
    if (entry.accepted && (entry.edge === 'strike' || entry.edge === 'set')) effective = true;
  });
  if (o.effective !== effective) throw new Error('opening.effective must be true exactly when an accepted strike or contact set exists in the ledger.');
  if (o.handoff === 'completed' && (!signed(o.boundaryFrame) || o.boundaryFrame < maxApplied)) throw new Error('opening.boundaryFrame must be a signed safe integer at or after every applied frame.');
  return validateEnsembleRecord(wrapper.ensemble, { admission });
}

/** Build the wrapper from the host's continuation metadata (absolute processor frames) after the passage has ended. Inputs are snapshotted before the await. */
export async function seedEnsembleRecord({ source: sourceInput, continuation: continuationInput, ensemble: ensembleInput }) {
  const source = structuredClone(sourceInput), c = structuredClone(continuationInput), ensemble = structuredClone(ensembleInput);
  validateEnsembleRecord(ensemble);
  const plan = continuationPlan(source, { sampleRate: ensemble.sampleRate });
  assertSameInstruments(ensemble, source);
  if (!c || !['completed', 'aborted'].includes(c.state)) throw new Error('The passage must have ended with its handoff completed or aborted before it is kept.');
  if (!signed(c.baseFrame) || !signed(c.originFrame) || !Array.isArray(c.steps) || c.steps.length !== plan.steps.length || !Array.isArray(c.ledger)) throw new Error('Incomplete continuation metadata.');
  if (c.handoffFrame !== c.baseFrame + plan.handoffFrame) throw new Error('The host\'s handoff does not match the source\'s ending.');
  const sourceStartFrame = c.baseFrame - c.originFrame, planned = new Map(plan.steps.map(s => [s.id, s])), decisions = new Map();
  for (const e of c.ledger) {                                                                                      // every decision names one planned edge, once, on its part
    const step = e && planned.get(e.id);
    if (!step) throw new Error(`The host's ledger names an edge that is not in the plan: ${String(e?.id)}.`);
    if (decisions.has(e.id)) throw new Error(`The host's ledger decides ${e.id} twice.`);
    if (e.part !== step.part) throw new Error(`The host's ledger decides ${e.id} on part ${e.part}, not ${step.part}.`);
    decisions.set(e.id, e);
  }
  let maxApplied = null;
  const ledger = plan.steps.map((step, i) => {
    const hostStep = c.steps[i];
    if (!hostStep || hostStep.id !== step.id || hostStep.part !== step.part || hostStep.frame !== c.baseFrame + step.frame || stable(hostStep.command) !== stable(step.command)) throw new Error(`The host's plan differs from the source's at ${step.id}.`);
    const d = decisions.get(step.id), base = { id: step.id, part: step.part, edge: step.edge, requestedFrame: sourceStartFrame + step.frame };
    if (!d) return { ...base, appliedFrame: null, accepted: null, reason: null };
    if (d.requestedFrame !== hostStep.frame || !signed(d.appliedFrame) || d.appliedFrame < d.requestedFrame || typeof d.accepted !== 'boolean') throw new Error(`Contradictory acknowledgement for ${step.id}.`);
    maxApplied = maxApplied === null ? d.appliedFrame : Math.max(maxApplied, d.appliedFrame);
    return { ...base, appliedFrame: d.appliedFrame - c.originFrame, accepted: d.accepted, reason: d.accepted ? null : String(d.reason) };
  });
  if (c.state === 'completed' && (ledger.some(e => e.accepted === null) || c.boundaryFrame !== Math.max(c.handoffFrame, maxApplied))) throw new Error('A completed handoff decides every edge and its boundary is max(handoff, last applied frame).');
  const effective = ledger.some(e => e.accepted && (e.edge === 'strike' || e.edge === 'set'));
  const opening = c.state === 'completed'
    ? { handoff: 'completed', effective, boundaryFrame: (signed(c.boundaryFrame) ? c.boundaryFrame : (() => { throw new Error('A completed handoff needs its boundary frame.'); })()) - c.originFrame, ledger }
    : { handoff: 'aborted', effective, ledger };
  const wrapper = { kind: ENSEMBLE_SEEDED_KIND, version: ENSEMBLE_SEEDED_VERSION, seededFrom: { kind: ENSEMBLE_RECORD_KIND, version: ENSEMBLE_RECORD_VERSION, canonicalSha256: await canonicalEnsembleSha256(source), operation: CONTINUATION_OPERATION }, sourceStartFrame, opening, ensemble };
  validateSeededEnsemble(wrapper);
  return wrapper;
}

/** Canonical text: keys sorted, the inner record canonical. Identity for hashing and comparison. */
export function canonicalSeededEnsemble(wrapper) {
  validateSeededEnsemble(wrapper);
  return stable({ kind: wrapper.kind, version: wrapper.version, seededFrom: wrapper.seededFrom, sourceStartFrame: wrapper.sourceStartFrame, opening: wrapper.opening, ensemble: JSON.parse(canonicalEnsembleRecord(wrapper.ensemble)) });
}

/** Expected remembered content per part, reconstructed from the accepted ledger edges by the capture's own rules (applied-frame order, ties in plan
 * order; a set closes the body's open contact; a release of nothing is ignored; an interval of zero length is dropped; open contacts close at the ending
 * when the handoff was aborted, and otherwise stay open past the boundary). Frames are the kept passage's. */
function expectedRememberedContent(wrapper, plan) {
  const parts = [0, 1, 2].map(() => ({ events: [], contacts: [], open: new Map() }));
  const accepted = wrapper.opening.ledger.map((e, i) => ({ e, i })).filter(({ e }) => e.accepted === true).sort((a, b) => a.e.appliedFrame - b.e.appliedFrame || a.i - b.i);
  const close = (part, body, frame) => { const open = part.open.get(body); if (!open) return; if (frame > open.start) part.contacts.push({ ...open, end: frame }); part.open.delete(body); };
  for (const { e, i } of accepted) {
    const part = parts[e.part], cmd = plan.steps[i].command, f = e.appliedFrame;
    if (e.edge === 'strike') part.events.push({ frame: f, body: cmd.body, position: cmd.position, velocity: cmd.velocity });
    else if (e.edge === 'set') { close(part, cmd.body, f); part.open.set(cmd.body, { body: cmd.body, zone: cmd.zone, strength: cmd.strength, start: f }); }
    else close(part, cmd.body, f);
  }
  const ended = wrapper.ensemble.ended.frame;
  return parts.map(part => ({ events: part.events, contacts: part.contacts, open: [...part.open.values()].map(o => wrapper.opening.handoff === 'aborted' ? { ...o, end: ended } : o) }));
}
const eventKey = x => `${x.frame}:${x.body}:${x.position}:${x.velocity}`, contactKey = x => `${x.start}:${x.end}:${x.body}:${x.zone}:${x.strength}`;
const sortedKeys = (list, key) => list.map(key).sort();

/** With the source in hand: does the ledger describe this source's plan, is the boundary where the ledger says, and is the kept passage's remembered
 * content exactly the content the accepted edges produce (multiplicity included)? A completed handoff compares everything at or before the boundary and
 * open contacts by their start; an aborted one compares the whole passage, since no personal input was enabled. Late timing and partial openings are
 * reported, not rejected: the capture is still valid. Inputs are snapshotted across the await. */
export async function verifySeededEnsemble(wrapperInput, sourceInput) {
  const wrapper = structuredClone(wrapperInput), source = structuredClone(sourceInput);
  validateSeededEnsemble(wrapper);
  const report = { verified: false, hashMatches: false, instrumentsMatch: false, planMatches: false, boundaryMatches: null, contentMatches: false, handoff: wrapper.opening.handoff, effective: wrapper.opening.effective, timingChanged: false, partial: false, refused: [], unprocessed: [], mismatches: [] };
  report.hashMatches = (await canonicalEnsembleSha256(source)) === wrapper.seededFrom.canonicalSha256;
  if (!report.hashMatches) { report.mismatches.push('the source\'s canonical hash is not the declared one'); return report; }
  let plan; try { plan = continuationPlan(source, { sampleRate: wrapper.ensemble.sampleRate }); } catch (error) { report.mismatches.push(error.message); return report; }
  try { assertSameInstruments(wrapper.ensemble, source); report.instrumentsMatch = true; } catch (error) { report.instrumentsMatch = false; report.mismatches.push(error.message); return report; }
  const ledger = wrapper.opening.ledger, start = wrapper.sourceStartFrame;
  report.planMatches = ledger.length === plan.steps.length && ledger.every((e, i) => e.id === plan.steps[i].id && e.part === plan.steps[i].part && e.edge === plan.steps[i].edge && e.requestedFrame === start + plan.steps[i].frame);
  if (!report.planMatches) { report.mismatches.push('the ledger does not describe this source\'s continuation plan'); return report; }
  for (const e of ledger) { if (e.accepted === null) report.unprocessed.push(e.id); else if (!e.accepted) report.refused.push({ id: e.id, reason: e.reason }); else if (e.appliedFrame > e.requestedFrame) report.timingChanged = true; }
  report.partial = report.refused.length > 0 || report.unprocessed.length > 0;
  const processed = ledger.filter(e => e.accepted !== null).map(e => e.appliedFrame), boundary = wrapper.opening.boundaryFrame;
  if (wrapper.opening.handoff === 'completed') {
    report.boundaryMatches = boundary === Math.max(start + plan.handoffFrame, ...processed);
    if (!report.boundaryMatches) report.mismatches.push(`the boundary ${boundary} is not max(handoff ${start + plan.handoffFrame}, last applied frame ${Math.max(...processed)})`);
  }
  const expected = expectedRememberedContent(wrapper, plan);
  wrapper.ensemble.parts.forEach((p, part) => {
    const r = p.record, x = expected[part], completed = wrapper.opening.handoff === 'completed';
    const events = completed ? r.events.filter(e => e.frame <= boundary) : r.events, closed = completed ? r.contacts.filter(c => c.start <= boundary && c.end <= boundary) : r.contacts;
    if (sortedKeys(events, eventKey).join('|') !== sortedKeys(x.events, eventKey).join('|')) report.mismatches.push(`part ${part}: the remembered strikes differ from the accepted ledger (${events.length} kept, ${x.events.length} expected)`);
    const openKept = completed ? r.contacts.filter(c => c.start <= boundary && c.end > boundary) : [];
    if (sortedKeys(closed, contactKey).join('|') !== sortedKeys(x.contacts.concat(completed ? [] : x.open), contactKey).join('|')) report.mismatches.push(`part ${part}: the remembered contacts differ from the accepted ledger (${closed.length} kept, ${x.contacts.length + (completed ? 0 : x.open.length)} expected)`);
    if (completed && sortedKeys(openKept, c => `${c.start}:${c.body}:${c.zone}:${c.strength}`).join('|') !== sortedKeys(x.open, c => `${c.start}:${c.body}:${c.zone}:${c.strength}`).join('|')) report.mismatches.push(`part ${part}: the contacts still held at the boundary differ from the accepted ledger`);
  });
  report.contentMatches = report.mismatches.length === 0;
  report.verified = report.hashMatches && report.instrumentsMatch && report.planMatches && report.boundaryMatches !== false && report.contentMatches;
  return report;
}
