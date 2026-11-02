import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe } from '../src/score/grove-rest.js';
import { renderEnsembleRecord, canonicalEnsembleRecord } from '../src/score/grove-ensemble-record.js';
import { canonicalEnsembleSha256 } from '../src/score/grove-ensemble-derived.js';
import { continuationPlan } from '../src/score/grove-ensemble-continuation.js';
import { createEnsembleHost } from '../src/grove/ensemble-host.js';
import { seedEnsembleRecord, validateSeededEnsemble, canonicalSeededEnsemble, verifySeededEnsemble, ENSEMBLE_SEEDED_KIND } from '../src/score/grove-ensemble-seeded.js';

// The production processor and host under mocked Web Audio plumbing (the harness of Astra's parity tests): a first passage is kept, becomes the source,
// and a second passage continues from it; the wrapper is built from the host's own continuation metadata. Computation tests, not device clearance.
const processors = {};
globalThis.sampleRate = 8000; globalThis.currentFrame = 0;
globalThis.AudioWorkletProcessor = class { constructor() { this.messages = []; this.port = { postMessage: m => this.messages.push(m) }; } };
globalThis.registerProcessor = (name, value) => { processors[name] = value; };
await import('../src/grove/ensemble-worklet.js');
const grove = composeGrove({ seed: 3 }), recipe = createGroveRestRecipe(grove, { ...DEFAULT_VOICE_CONFIG, partials: 1 }, { sampleRate: 8000 }), recipes = [recipe, recipe, recipe];
function fixture() {
  let processor, node, nextFrame = 0; const audio = [[], []];
  const context = { sampleRate: 8000, currentTime: 0, state: 'running', destination: {}, audioWorklet: { addModule: async () => {} }, async resume() {}, async close() { this.state = 'closed'; } };
  const host = createEnsembleHost({ createContext: () => context, prepareRecipes: async () => ({ recipes }), createListeningStage: () => ({ input: {}, output: { connect() {} }, dispose() {}, setDb() {} }), createNode: (_, options) => {
    processor = new processors['imagimusic-grove-ensemble']({ processorOptions: options.processorOptions });
    node = { port: { postMessage: data => processor.port.onmessage({ data }), close() {} }, connect() {}, disconnect() {} }; return node;
  }, onChange: () => {} });
  function block(n = 1) { for (let k = 0; k < n; k++) { globalThis.currentFrame = nextFrame; const output = [new Float32Array(128), new Float32Array(128)]; processor.process([], [output]); output.forEach((c, ch) => audio[ch].push(...c)); nextFrame += 128; context.currentTime = nextFrame / 8000; for (const message of processor.messages.splice(0)) node.port.onmessage?.({ data: message }); } }
  function until(condition) { for (let i = 0; i < 2000 && !condition(); i++) block(); assert.ok(condition(), 'expected state within bounded render'); }
  function verify(origin) { const record = host.recording(), pcm = renderEnsembleRecord(record); for (let ch = 0; ch < 2; ch++) assert.deepEqual(Float32Array.from(audio[ch].slice(origin, origin + pcm.channels[ch].length)), pcm.channels[ch]); return record; }
  return { host, block, until, verify };
}
async function keepSource() {
  const { host, block, until } = fixture(); await host.enable([grove, grove, grove]);
  assert.ok(host.send(0, { kind: 'strike', body: 0, position: 0, velocity: 0.25 }).queued); block(4);
  assert.ok(host.send(0, { kind: 'contact', body: 0, zone: 2, strength: 1 }).queued); block(4);
  assert.ok(host.send(1, { kind: 'strike', body: 1, position: 0, velocity: 0.2 }).queued); block(4);
  assert.ok(host.send(0, { kind: 'contact', body: 0, zone: null }).queued); block(4);
  host.quiet(); until(() => host.state === 'ended'); const source = host.recording(); host.dispose(); return source;
}
const planSteps = plan => plan.steps.map(({ part, frame, command }) => ({ part, frame, command }));

test('a completed continuation keeps a verified seeded wrapper: remembered edges at their requested frames, the personal answer after the boundary', async () => {
  const source = await keepSource(), sourceText = canonicalEnsembleRecord(source), plan = continuationPlan(source, { sampleRate: 8000 });
  assert.equal(plan.steps.map(s => s.edge).join(' '), 'strike set strike release');
  const { host, block, until, verify } = fixture(); await host.enable([grove, grove, grove]);
  assert.ok(host.scheduleContinuation(planSteps(plan), { handoffFrame: plan.handoffFrame }).queued);
  until(() => host.continuation.state === 'completed');
  assert.ok(host.send(2, { kind: 'strike', body: 2, position: 0, velocity: 0.3 }).queued); block(4);
  host.quiet(); until(() => host.state === 'ended');
  const ensemble = verify(host.continuation.originFrame), pending = seedEnsembleRecord({ source, continuation: host.continuation, ensemble });
  source.parts[0].record.events[0].velocity = 0.9;                                                                 // mutation during the await cannot reach the wrapper
  const wrapper = await pending; host.dispose();
  assert.equal(wrapper.kind, ENSEMBLE_SEEDED_KIND); assert.equal(wrapper.seededFrom.canonicalSha256, await canonicalEnsembleSha256(JSON.parse(sourceText)));
  assert.equal(wrapper.sourceStartFrame, 0, 'the first remembered strike was accepted at the base, so the base is the origin');
  assert.equal(wrapper.opening.handoff, 'completed'); assert.equal(wrapper.opening.effective, true); assert.equal(wrapper.opening.boundaryFrame, plan.handoffFrame);
  assert.deepEqual(wrapper.opening.ledger.map(e => [e.edge, e.accepted, e.appliedFrame - e.requestedFrame]), [['strike', true, 0], ['set', true, 0], ['strike', true, 0], ['release', true, 0]]);
  assert.ok(wrapper.ensemble.parts[2].record.events[0].frame > wrapper.opening.boundaryFrame, 'the personal strike lies after the boundary');
  const report = await verifySeededEnsemble(wrapper, JSON.parse(sourceText));
  assert.deepEqual([report.verified, report.timingChanged, report.partial, report.mismatches], [true, false, false, []]);
  const text = canonicalSeededEnsemble(wrapper); assert.equal(canonicalSeededEnsemble(JSON.parse(text)), text); validateSeededEnsemble(JSON.parse(text));
  assert.equal((await verifySeededEnsemble(wrapper, source)).hashMatches, false, 'the mutated source is not the declared one');
});

test('an early Quiet keeps an aborted opening: no boundary key, unprocessed edges as null triples, the refused release listed; still verified as partial', async () => {
  const source = await keepSource(), plan = continuationPlan(source, { sampleRate: 8000 });
  const { host, block, until, verify } = fixture(); await host.enable([grove, grove, grove]);
  assert.ok(host.scheduleContinuation(planSteps(plan), { handoffFrame: plan.handoffFrame }).queued);
  block(2); host.quiet(); until(() => host.state === 'ended');
  const wrapper = await seedEnsembleRecord({ source, continuation: host.continuation, ensemble: verify(host.continuation.originFrame) }); host.dispose();
  assert.equal(wrapper.opening.handoff, 'aborted'); assert.equal('boundaryFrame' in wrapper.opening, false);
  const states = wrapper.opening.ledger.map(e => e.accepted); assert.ok(states.includes(null) || states.includes(false), 'some edge was never reached or was refused after Quiet');
  for (const e of wrapper.opening.ledger) if (e.accepted === null) assert.deepEqual([e.appliedFrame, e.reason], [null, null]); else if (!e.accepted) assert.equal(typeof e.reason, 'string');
  const report = await verifySeededEnsemble(wrapper, source);
  assert.deepEqual([report.verified, report.partial, report.handoff, report.mismatches], [true, true, 'aborted', []]);
  assert.equal(wrapper.opening.effective, wrapper.opening.ledger.some(e => e.accepted && e.edge !== 'release'));
});

test('signed placement: when every remembered edge is refused and the first accepted gesture is personal, the start is negative and the opening not effective', async () => {
  const source = await keepSource(), plan = continuationPlan(source, { sampleRate: 8000 });
  const { host, until, verify, block } = fixture(); await host.enable([grove, grove, grove]);
  host.scheduleContinuation(planSteps(plan), { handoffFrame: plan.handoffFrame }); until(() => host.continuation.state === 'completed');
  host.send(2, { kind: 'strike', body: 2, position: 0, velocity: 0.3 }); block(4); host.quiet(); until(() => host.state === 'ended');
  const c = structuredClone(host.continuation), ensemble = verify(c.originFrame); host.dispose();
  c.ledger = c.ledger.map(e => ({ ...e, accepted: false, reason: 'admission' })); c.originFrame = c.baseFrame + 1000;      // as if the personal strike had been the first accepted gesture
  const wrapper = await seedEnsembleRecord({ source, continuation: c, ensemble });
  assert.equal(wrapper.sourceStartFrame, -1000); assert.equal(wrapper.opening.effective, false); assert.equal(wrapper.opening.ledger[0].requestedFrame, -1000);
  assert.equal(wrapper.opening.boundaryFrame, c.boundaryFrame - c.originFrame); validateSeededEnsemble(wrapper);
});

test('strict validation: extra keys, a boundary on an aborted opening, an inconsistent effective flag, a malformed hash and a wrong plan are refused', async () => {
  const source = await keepSource(), plan = continuationPlan(source, { sampleRate: 8000 });
  const { host, until, verify, block } = fixture(); await host.enable([grove, grove, grove]);
  host.scheduleContinuation(planSteps(plan), { handoffFrame: plan.handoffFrame }); until(() => host.continuation.state === 'completed'); block(2); host.quiet(); until(() => host.state === 'ended');
  const wrapper = await seedEnsembleRecord({ source, continuation: host.continuation, ensemble: verify(host.continuation.originFrame) }); host.dispose();
  const mutate = f => { const w = structuredClone(wrapper); f(w); return w; };
  assert.throws(() => validateSeededEnsemble(mutate(w => { w.extra = 1; })), /unexpected key/);
  assert.throws(() => validateSeededEnsemble(mutate(w => { w.opening.handoff = 'aborted'; })), /unexpected key boundaryFrame/);
  assert.throws(() => validateSeededEnsemble(mutate(w => { w.opening.effective = false; })), /effective/);
  assert.throws(() => validateSeededEnsemble(mutate(w => { w.seededFrom.canonicalSha256 = 'x'; })), /64 lowercase hex/);
  assert.throws(() => validateSeededEnsemble(mutate(w => { w.opening.ledger[0].accepted = null; })), /all null|unprocessed/);
  assert.throws(() => validateSeededEnsemble(mutate(w => { w.sourceStartFrame = 0.5; })), /sourceStartFrame/);
  const other = mutate(w => { w.opening.ledger[1].requestedFrame -= 1; });   // still a valid entry, no longer this source's plan
  assert.equal((await verifySeededEnsemble(other, source)).planMatches, false);
  await assert.rejects(seedEnsembleRecord({ source, continuation: { ...structuredClone(wrapper), state: 'waiting' }, ensemble: wrapper.ensemble }), /ended with its handoff/);
});
