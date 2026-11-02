import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe } from '../src/score/grove-rest.js';
import { retuneGroveCluster } from '../src/score/grove-tuning.js';
import { composeEnsemblePhrase, ensembleRecords } from '../src/score/grove-ensemble.js';
import { ensembleRecordFromParts, canonicalEnsembleRecord } from '../src/score/grove-ensemble-record.js';
import { continuationPlan, CONTINUATION_MAX_EDGES } from '../src/score/grove-ensemble-continuation.js';

// Self-contained fixture: the authored demonstration phrase (the same the kept study uses), composed here rather than read from renders/.
const sampleRate = 48000, recipes = [48, 51, 55].map(note => createGroveRestRecipe(retuneGroveCluster(composeGrove({ seed: 3 }), note), DEFAULT_VOICE_CONFIG, { sampleRate }));
const demonstration = () => ensembleRecordFromParts(ensembleRecords(recipes, composeEnsemblePhrase(recipes, { together: false, velocity: 0.5 })));
const brief = plan => plan.steps.map(s => `${s.frame}:${s.part}:${s.edge}`).join(' ');
const contact = (body, start, end, order, zone = 2, strength = 1) => ({ body, zone, strength, start, end, order });

test('the demonstration source gives its gesture edges in the total order, its Quiet and fade omitted, source untouched', () => {
  const source = demonstration(), before = canonicalEnsembleRecord(source), plan = continuationPlan(source, { sampleRate });
  assert.equal(brief(plan), '0:0:strike 40000:1:strike 80000:2:strike 140000:0:set 240000:0:release');
  assert.equal(plan.handoffFrame, 320000, 'handoff is the source ending, not its last gesture'); assert.equal(plan.sampleRate, sampleRate);
  assert.deepEqual(plan.steps.map(s => s.id), plan.steps.map((s, i) => `continuation-${i}`));
  assert.deepEqual(plan.steps[3].command, { kind: 'contact', body: 0, zone: 2, strength: 1 }); assert.deepEqual(plan.steps[4].command, { kind: 'contact', body: 0, zone: null, strength: null });
  assert.equal(plan.steps.some(s => s.command.kind === 'quiet'), false);
  assert.equal(canonicalEnsembleRecord(source), before); assert.ok(Object.isFrozen(plan) && Object.isFrozen(plan.steps) && Object.isFrozen(plan.steps[0]) && Object.isFrozen(plan.steps[0].command));
  assert.deepEqual(continuationPlan(demonstration()), plan, 'pure: equal inputs give equal outputs');
});

test('contact corner cases: contiguous contacts use the new set only; a terminal endpoint gets one release at the handoff; three holds', () => {
  const contiguous = demonstration(); contiguous.parts[0].record.contacts = [contact(0, 3584, 8064, 1), contact(0, 8064, 57728, 3, 1)];     // 8064: a change of zone, not a lift
  assert.equal(brief(continuationPlan(contiguous)), '0:0:strike 3584:0:set 8064:0:set 40000:1:strike 57728:0:release 80000:2:strike');
  const terminal = demonstration(); terminal.parts[0].record.contacts = [contact(0, 3584, 8064, 1), contact(0, 8960, terminal.ended.frame, 3)];      // closed by the source's Quiet
  const plan = continuationPlan(terminal), releases = plan.steps.filter(s => s.edge === 'release');
  assert.equal(releases.length, 2); assert.equal(releases.at(-1).frame, plan.handoffFrame, 'one release at the handoff, from the stored endpoint');
  const holds = demonstration(); holds.parts[0].record.contacts = [contact(0, 16000, 16768, 1), contact(0, 18432, 51584, 3), contact(1, 217728, 252417, 5)];
  assert.equal(brief(continuationPlan(holds)), '0:0:strike 16000:0:set 16768:0:release 18432:0:set 40000:1:strike 51584:0:release 80000:2:strike 217728:0:set 252417:0:release');
});

test('total order at one frame: lower part first; synthetic releases before explicit events; explicit events by stored order; then body', () => {
  const source = demonstration(), p0 = source.parts[0].record, p1 = source.parts[1].record, F = 8064;
  p0.contacts = [contact(0, 3584, F, 1)]; p1.events[0].frame = F;                                                                        // part 1 strike at part 0's release frame
  p0.events.push({ frame: F, order: 7, body: 2, position: 0, velocity: 0.3 }, { frame: F, order: 9, body: 1, position: 0, velocity: 0.3 });   // same frame; stored order 7 (body 2) before 9 (body 1), not body order
  const at = continuationPlan(source).steps.filter(s => s.frame === F);
  assert.equal(at.map(s => `${s.part}:${s.edge}:${s.body}`).join(' '), '0:release:0 0:strike:2 0:strike:1 1:strike:0');
});

test('refusals rather than truncation: wrong kind, other rate, over 20 s, over 32 edges, no strike, contact past the ending', () => {
  assert.throws(() => continuationPlan({ kind: 'imagimusic-grove-ensemble-derived', ensemble: demonstration() }), /original saved ensemble/);
  assert.throws(() => continuationPlan(demonstration(), { sampleRate: 44100 }), /same rate/);
  const long = demonstration(); const ended = { frame: 21 * sampleRate, fadeFrames: 1200 }; long.ended = ended; for (const part of long.parts) part.record.ended = { ...ended };
  assert.throws(() => continuationPlan(long), /longer than 20 s/);
  const many = demonstration(); const r = many.parts[1].record; for (let i = 1; i < CONTINUATION_MAX_EDGES; i++) r.events.push({ ...r.events[0], frame: r.events[0].frame + i, order: i });
  assert.throws(() => continuationPlan(many), /at most 32/);
  const silent = demonstration(); for (const part of silent.parts) { part.record.events = []; part.silent = true; }
  assert.throws(() => continuationPlan(silent), /no strike/);
});
