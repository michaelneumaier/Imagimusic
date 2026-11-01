import test from 'node:test';
import assert from 'node:assert/strict';
import { composeConversation, validateScore, scheduledEvents, compileScoreEvents, sectionAt, eventsPerBar, canonicalScore, lastOnsetSeconds, beatSeconds, CHARACTERS, midiHz } from '../src/score/conversation.js';
import { planPerformers, DEFAULT_PLANNER } from '../src/perform/planner.js';
import { createPerformanceFromEvents } from '../src/stage/performance.js';
import { createAuthoredPerformance } from '../src/stage/authored-performance.js';
import { DEFAULT_PATCH } from '../src/model.js';
import { DEFAULT_COMPOSITION } from '../src/stage/composition.js';
import { DEFAULT_TENSIONER } from '../src/fm.js';

const GRID = []; for (const character of CHARACTERS) for (const density of [0, 0.5, 0.7, 1]) for (const seed of [731, 1, 2]) GRID.push({ character, density, seed });
const bothChildren = { ...structuredClone(DEFAULT_COMPOSITION), version: 2, loom: { ...DEFAULT_COMPOSITION.loom, enabled: true }, fm: { enabled: true, settings: { ...DEFAULT_TENSIONER } } };

test('composition is deterministic and canonical, and the canonical form keeps simultaneous-event order', () => {
  const a = composeConversation(), b = composeConversation();
  assert.deepEqual(a, b); assert.equal(canonicalScore(a), canonicalScore(b));
  assert.deepEqual(compileScoreEvents(a), compileScoreEvents(b));
  assert.notEqual(canonicalScore(a), canonicalScore(composeConversation({ seed: 1 })));
  assert.notEqual(canonicalScore(a), canonicalScore(composeConversation({ character: 'bright' })));
  const beat32 = a.events.filter(e => e.beat === 32).map(e => e.id);
  assert.deepEqual(JSON.parse(canonicalScore(a)).events.filter(e => e.beat === 32).map(e => e.id), beat32);
  assert.ok(beat32.length >= 2, 'the FM turn and the inverted motif share beat 32');
  assert.equal(JSON.stringify(Object.keys(JSON.parse(canonicalScore(a)))), JSON.stringify(Object.keys(JSON.parse(canonicalScore(a))).slice().sort()));
});

test('density removes non-anchor events only, nested, with anchors alone at density 0', () => {
  const ids = s => new Set(scheduledEvents(s).map(e => e.id));
  for (const character of CHARACTERS) {
    const full = composeConversation({ character, density: 1 });
    let previous = null;
    for (const density of [0, 0.25, 0.5, 0.7, 1]) {
      const s = composeConversation({ character, density }), set = ids(s);
      assert.deepEqual(s.events, full.events, 'density never changes the candidate events, only which are scheduled');
      if (previous) for (const id of previous) assert.ok(set.has(id), `${id} survives from density below ${density}`);
      previous = set;
      for (const e of scheduledEvents(s)) assert.equal(beatSeconds(s, e.beat), beatSeconds(full, e.beat), 'time is never compressed');
    }
    const anchorsOnly = composeConversation({ character, density: 0 });
    assert.ok(scheduledEvents(anchorsOnly).every(e => e.anchor === true));
    assert.ok(scheduledEvents(anchorsOnly).some(e => e.family === 'loom'), 'an enabled Loom still has a strike');
    assert.equal(scheduledEvents(anchorsOnly).filter(e => e.family === 'fm').length, 1);
    assert.ok(scheduledEvents(anchorsOnly).length < scheduledEvents(full).length);
  }
});

test('tempo scales time uniformly; character changes voices on the same beats', () => {
  const slow = composeConversation({ tempo: 60 }), fast = composeConversation({ tempo: 120 });
  assert.deepEqual(slow.events.map(e => e.beat), fast.events.map(e => e.beat));
  const cs = compileScoreEvents(slow), cf = compileScoreEvents(fast);
  for (let i = 0; i < cs.events.length; i++) assert.ok(Math.abs((cs.events[i].time - 0.35) - 2 * (cf.events[i].time - 0.35)) < 1e-9);
  // restless syncopates the tine (off-beat 0.75 instead of 0.5); every other family keeps its beats across characters
  const beatsOf = s => s.events.filter(e => e.family !== 'tine').map(e => e.beat);
  for (const character of CHARACTERS) assert.deepEqual(beatsOf(composeConversation({ character })), beatsOf(composeConversation()));
  assert.deepEqual(composeConversation({ character: 'bright' }).events.map(e => e.beat), composeConversation().events.map(e => e.beat));
  assert.notDeepEqual(composeConversation({ character: 'bright' }).events.map(e => e.slot), composeConversation().events.map(e => e.slot));
});

test('the recipe is exactly the compiler input plus child timing, and compiles through the real compiler and assembly', () => {
  const s = composeConversation(), r = compileScoreEvents(s);
  assert.deepEqual(Object.keys(r).sort(), ['events', 'fmTime', 'holdUntil', 'loomScore']);
  assert.equal(r.fmTime, beatSeconds(s, 32));
  assert.ok(r.loomScore.length >= 2 && r.loomScore.every(l => [0, 1].includes(l.body) && l.velocity > 0 && l.time > 0.35));
  const bellows = r.events.filter(e => e.family === 'bellows');
  assert.ok(bellows.length > 0 && bellows.every(e => e.noteOff > e.time && Math.abs(e.noteHz - midiHz(Math.round(69 + 12 * Math.log2(e.noteHz / 440)))) < 1e-9));
  assert.ok(r.events.filter(e => e.family !== 'bellows').every(e => e.position >= 0 && e.position <= 1));
  const base = createPerformanceFromEvents({ ...DEFAULT_PATCH, tempo: s.tempo }, r.events, 48000);
  assert.equal(base.events.length, r.events.length);
  const assembled = createAuthoredPerformance({ ...DEFAULT_PATCH, tempo: s.tempo }, r, bothChildren, 48000);
  assert.ok(assembled.duration >= r.holdUntil);
  assert.equal(r.holdUntil, lastOnsetSeconds(s) + s.hold);
});

test('reachability is evidence from the real planner: 0 unplanned across the authored grid', () => {
  for (const g of GRID) {
    const r = compileScoreEvents(composeConversation(g));
    const garden = planPerformers(r.events.filter(e => e.family === 'garden').map(e => ({ id: e.id, slot: e.slot, noteOn: e.time })), { family: 'garden', slots: 8 });
    const tine = planPerformers(r.events.filter(e => e.family === 'tine').map(e => ({ id: e.id, slot: 0, noteOn: e.time })), { family: 'tine', slots: 1 });
    assert.equal(garden.unplanned.length, 0, `garden unplanned for ${JSON.stringify(g)}`);
    assert.equal(tine.unplanned.length, 0, `tine unplanned for ${JSON.stringify(g)}`);
    assert.ok(garden.actors.length <= DEFAULT_PLANNER.maxActors);
  }
});

test('anticipation: in the opening, no other onset falls inside any garden strike approach window', () => {
  for (const g of GRID) {
    const s = composeConversation(g), r = compileScoreEvents(s), onsets = [...r.events.map(e => e.time), ...r.loomScore.map(l => l.time), r.fmTime];
    const openingEnd = beatSeconds(s, s.sections[0].beats[1]);
    for (const e of r.events.filter(e => e.family === 'garden' && e.time < openingEnd)) {
      const intruders = onsets.filter(t => t !== e.time && t > e.time - DEFAULT_PLANNER.approach && t < e.time);
      assert.deepEqual(intruders, [], `onset inside the approach of ${e.id}`);
    }
  }
});

test('settling: release counts fall, the hold is onset-free, every voice reaches its natural end inside the passage', () => {
  for (const g of GRID) {
    const s = composeConversation(g), r = compileScoreEvents(s), bars = eventsPerBar(s), releaseStart = s.sections[2].beats[0] / s.beatsPerBar;
    const release = bars.slice(releaseStart);
    for (let i = 1; i < release.length; i++) assert.ok(release[i] <= release[i - 1], `release counts non-increasing for ${JSON.stringify(g)}: ${release}`);
    assert.ok(release.at(-1) >= 1, 'the final strike is always there');
    const last = lastOnsetSeconds(s), onsets = [...r.events.map(e => e.time), ...r.loomScore.map(l => l.time), r.fmTime];
    assert.ok(onsets.every(t => !(t > last && t <= last + s.hold)), 'no onset in (lastOnset, lastOnset + hold]');
    assert.ok(r.events.every(e => e.time <= last));
    if (g.seed !== 731) continue;
    const p = createAuthoredPerformance({ ...DEFAULT_PATCH, tempo: s.tempo }, r, bothChildren, 48000);
    for (const e of p.events) assert.ok(e.voice.end <= p.duration + 1e-9, `${e.voice.scoreId} ends after the passage`);
  }
});

test('eventsPerBar reports actual counts and sectionAt covers pre-roll, bars and tail', () => {
  const s = composeConversation();
  assert.equal(eventsPerBar(s).reduce((a, b) => a + b, 0), scheduledEvents(s).length);
  assert.equal(eventsPerBar(s, { scheduled: false }).reduce((a, b) => a + b, 0), s.events.length);
  assert.equal(eventsPerBar(s).length, 16);
  assert.equal(sectionAt(s, 0).id, 'pre-roll');
  assert.deepEqual([sectionAt(s, 0.35).id, sectionAt(s, 0.35).bar, sectionAt(s, 0.35).cadence], ['opening', 1, 'anticipation']);
  const turn = sectionAt(s, beatSeconds(s, 32)); assert.deepEqual([turn.id, turn.bar, turn.beatInBar, turn.progress01], ['exchange', 9, 0, 0.5]);
  assert.equal(sectionAt(s, beatSeconds(s, 63.999)).id, 'release');
  assert.equal(sectionAt(s, beatSeconds(s, 64)).id, 'tail');
  assert.equal(sectionAt(s, 1000).progress01, 1);
});

test('the validator rejects what the families cannot do and what the schema does not say', () => {
  const ok = composeConversation(); validateScore(ok);
  const mutate = f => { const s = structuredClone(ok); f(s); return s; };
  const rejects = (f, re) => assert.throws(() => validateScore(mutate(f)), re);
  rejects(s => s.events.push({ id: 'fm:release:2', family: 'fm', beat: 63, anchor: true }), /exactly one fm/);
  rejects(s => { const fm = s.events.find(e => e.family === 'fm'); delete fm.anchor; fm.weight = 0.9; }, /fm event must be an anchor/);
  assert.equal(compileScoreEvents(composeConversation({ density: 0 })).fmTime, beatSeconds(ok, 32), 'the FM entrance survives density 0');
  rejects(s => { s.events[0].slot = 8; }, /slot/);
  rejects(s => { s.events.find(e => e.family === 'loom').body = 2; }, /body/);
  rejects(s => { s.events.find(e => e.family === 'bellows').noteMidi = 97; }, /noteMidi/);
  rejects(s => { s.events.find(e => e.family === 'bellows').noteMidi = 60.5; }, /noteMidi/);
  rejects(s => { s.events[0].weight = 0.5; }, /exactly one of anchor/);
  rejects(s => { delete s.events[0].anchor; }, /exactly one of anchor/);
  rejects(s => { s.events[0].anchor = 1; }, /anchor must be true/);
  rejects(s => { s.events[0].damper = true; }, /unsupported field/);
  rejects(s => { s.events[0].family = 'damper'; }, /unknown family/);
  rejects(s => { s.events[0].position = 1.5; }, /position/);
  rejects(s => { s.events[0].velocity = '0.5'; }, /velocity/);
  rejects(s => { s.events[0].beat = 20; }, /outside its section|sorted/);
  rejects(s => { s.sections[1].beats = [17, 48]; }, /contiguous/);
  rejects(s => { s.sections[2].beats = [48, 48]; }, /non-empty/);
  rejects(s => { s.extra = 1; }, /unsupported field/);
  rejects(s => { s.seed = 4294967296; }, /seed/);
  rejects(s => { s.tempo = 84.5; }, /tempo/);
  rejects(s => { s.controls.density = 1.1; }, /density/);
  rejects(s => { s.controls.character = 'loud'; }, /character/);
  rejects(s => { for (const e of s.events) if (e.family === 'loom') { delete e.anchor; e.weight = 0.5; } }, /Loom anchor/);
  rejects(s => { s.tempo = 40; s.events.find(e => e.family === 'bellows').durationBeats = 60; }, /beyond the compiler/);
  rejects(s => { for (let i = 0; i < 260; i++) s.events.push({ id: `tine:release:${100 + i}`, family: 'tine', beat: 63, velocity: 0.1, weight: 0.1 }); }, /candidate events/);
  assert.throws(() => composeConversation({ character: 'loud' }), /character/);
});
