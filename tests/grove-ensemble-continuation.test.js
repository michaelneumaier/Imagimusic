import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { continuationSteps, continuationHandoffFrame, CONTINUATION_MAX_EDGES } from '../src/score/grove-ensemble-continuation.js';
import { canonicalEnsembleRecord } from '../src/score/grove-ensemble-record.js';

const load = f => JSON.parse(readFileSync(new URL('../renders/' + f, import.meta.url), 'utf8'));
const brief = steps => steps.map(s => `${s.frame}:${s.part}:${s.edge}`).join(' ');
const kept = () => load('ensemble-return-study/original.json'), live = () => load('ensemble-live-contact/ensemble.json');

test('the kept demonstration source gives its gesture edges in the total order, its Quiet and fade omitted, source untouched', () => {
  const source = kept(), before = canonicalEnsembleRecord(source), steps = continuationSteps(source, { sampleRate: 48000 });
  assert.equal(brief(steps), '0:0:strike 40000:1:strike 80000:2:strike 140000:0:set 240000:0:release');
  assert.equal(continuationHandoffFrame(source), 320000, 'handoff is the source ending, not its last gesture');
  assert.deepEqual(steps.map(s => s.id), steps.map((s, i) => `continuation-${i}`));
  assert.deepEqual(steps[3].command, { kind: 'contact', body: 0, zone: 2, strength: 1 }); assert.deepEqual(steps[4].command, { kind: 'contact', body: 0, zone: null, strength: null });
  assert.equal(steps.some(s => s.command.kind === 'quiet'), false);
  assert.equal(canonicalEnsembleRecord(source), before); assert.ok(Object.isFrozen(steps) && Object.isFrozen(steps[0]) && Object.isFrozen(steps[0].command));
  assert.deepEqual(continuationSteps(kept()), steps, 'pure: equal inputs give equal outputs');
});

test('contact corner cases: contiguous contacts use the new set only; a terminal endpoint gets one release at the handoff', () => {
  const contiguous = live(); contiguous.parts[0].record.contacts[1].start = contiguous.parts[0].record.contacts[0].end;     // 8064: a change of zone, not a lift
  assert.equal(brief(continuationSteps(contiguous)), '0:0:strike 3584:0:set 8064:0:set 57728:0:release 58496:1:strike');
  const terminal = live(); terminal.parts[0].record.contacts[1].end = terminal.ended.frame;                                   // closed by the source's Quiet
  const steps = continuationSteps(terminal), releases = steps.filter(s => s.edge === 'release');
  assert.equal(releases.length, 2); assert.equal(releases.at(-1).frame, continuationHandoffFrame(terminal), 'one release at the handoff, from the stored endpoint');
  assert.equal(brief(continuationSteps(load('ensemble-keyboard-holds/ensemble.json'))), '0:0:strike 16000:0:set 16768:0:release 18432:0:set 51584:0:release 217728:0:set 252417:0:release');
});

test('total order at one frame: lower part first; synthetic releases before explicit events; explicit events by stored order', () => {
  const source = live(); const p0 = source.parts[0].record, p1 = source.parts[1].record;
  p1.events[0].frame = p0.contacts[0].end;                                                                                     // part 1 strike at part 0's release frame
  p0.events.push({ frame: p0.contacts[0].end, order: 9, body: 1, position: 0, velocity: 0.3 }); source.parts[0].silent = false;   // part 0 strike at the same frame, later stored order
  const steps = continuationSteps(source), at = steps.filter(s => s.frame === p0.contacts[0].end);
  assert.equal(at.map(s => `${s.part}:${s.edge}`).join(' '), '0:release 0:strike 1:strike');
});

test('refusals rather than truncation: wrong kind, other rate, over 20 s, over 32 edges, no strike', () => {
  assert.throws(() => continuationSteps({ kind: 'imagimusic-grove-ensemble-derived', ensemble: kept() }), /original saved ensemble/);
  assert.throws(() => continuationSteps(kept(), { sampleRate: 44100 }), /same rate/);
  assert.throws(() => continuationSteps(load('ensemble-long-return/ensemble-48k.json')), /longer than 20 s/);
  const many = kept(); const r = many.parts[1].record; for (let i = 1; i < CONTINUATION_MAX_EDGES; i++) r.events.push({ ...r.events[0], frame: r.events[0].frame + i, order: i });
  assert.throws(() => continuationSteps(many), /at most 32/);
  const silent = kept(); for (const part of silent.parts) { part.record.events = []; part.silent = true; }
  assert.throws(() => continuationSteps(silent), /no strike/);
});
