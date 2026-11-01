import test from 'node:test';
import assert from 'node:assert/strict';
import { planPerformers, actorPose, performerFrame, DEFAULT_PLANNER } from '../src/perform/planner.js';
import { DEFAULT_PATCH } from '../src/model.js';
import { createPerformance } from '../src/stage/performance.js';

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`);

test('a slow melody needs one actor and every assignment brackets its note with approach and recovery', () => {
  const events = [0, 3, 7, 2, 5].map((slot, i) => ({ id: `e${i}`, slot, noteOn: 1 + i * 1.5, position: 0.3 + i * 0.1, velocity: 0.7 }));
  const plan = planPerformers(events, { slots: 8 });
  assert.equal(plan.actors.length, 1); assert.deepEqual(plan.unplanned, []);
  for (const a of plan.actors[0].assignments) { assert.ok(a.arriveBy <= a.noteOn - DEFAULT_PLANNER.approach + 1e-12); close(a.leaveAt, a.noteOn + DEFAULT_PLANNER.recover); assert.equal(a.approach, DEFAULT_PLANNER.approach); assert.equal(a.velocity, 0.7); }
  assert.deepEqual(plan.actors[0].assignments.map(a => a.eventId), ['e0', 'e1', 'e2', 'e3', 'e4']);
  plan.actors[0].assignments.forEach((a, i) => close(a.position, 0.3 + i * 0.1));
});

test('simultaneous distant notes spawn actors; the music decides the anatomy', () => {
  const chord = [{ id: 'a', slot: 0, noteOn: 2 }, { id: 'b', slot: 7, noteOn: 2 }];
  const two = planPerformers(chord, { slots: 8 });
  assert.equal(two.actors.length, 2);
  const three = planPerformers([...chord, { id: 'c', slot: 4, noteOn: 2.1 }], { slots: 8 });
  assert.equal(three.actors.length, 3);
  assert.equal(planPerformers([...chord, { id: 'c', slot: 4, noteOn: 2.1 }], { slots: 8, maxActors: 2 }).unplanned[0].reason, 'no-actor');
});

test('an unreachable jump with one actor is reported, not faked; a first note too early to walk to is taken from position', () => {
  const plan = planPerformers([{ id: 'a', slot: 0, noteOn: 1 }, { id: 'b', slot: 7, noteOn: 1.2 }], { slots: 8, maxActors: 1 });
  assert.equal(plan.actors.length, 1); assert.equal(plan.actors[0].assignments.length, 1);
  assert.deepEqual(plan.unplanned.map(u => [u.eventId, u.reason]), [['b', 'no-actor']]);
  const early = planPerformers([{ id: 'a', slot: 7, noteOn: 0.2 }], { slots: 8, speedSlotsPerSecond: 1 });
  assert.deepEqual(early.unplanned, []); assert.equal(early.actors.length, 1); assert.equal(early.actors[0].restSlot, 7);
  assert.deepEqual(actorPose(early, early.actors[0].id, 0), { slot: 7, phase: 'rest', progress01: 0, eventId: null, previousEventId: null });
  assert.equal(actorPose(early, early.actors[0].id, 0.2).phase, 'contact');
});

test('poses are pure functions of time: rest, travel at the configured speed, approach, contact at noteOn, recover', () => {
  const plan = planPerformers([{ id: 'a', slot: 6, noteOn: 2 }, { id: 'b', slot: 6, noteOn: 2.3 }], { slots: 8, speedSlotsPerSecond: 5 });
  const id = plan.actors[0].id;
  assert.deepEqual(actorPose(plan, id, 0), { slot: 3.5, phase: 'rest', progress01: 0, eventId: null, previousEventId: null });
  const a = plan.actors[0].assignments[0];
  const depart = a.arriveBy - 2.5 / 5;                       // 2.5 slots at 5 slots/s
  const mid = actorPose(plan, id, depart + 0.25);
  assert.equal(mid.phase, 'travel'); close(mid.slot, 3.5 + 2.5 * (0.25 / 0.5));
  assert.equal(actorPose(plan, id, 2 - 0.1).phase, 'approach');
  const contact = actorPose(plan, id, 2); assert.equal(contact.phase, 'contact'); assert.equal(contact.slot, 6); assert.equal(contact.eventId, 'a');
  assert.equal(actorPose(plan, id, 2.05).phase, 'recover');
  assert.equal(actorPose(plan, id, 2.2).phase, 'approach');  // already approaching the quick repeat
  assert.equal(actorPose(plan, id, 2.3).eventId, 'b');       // same-slot repeat served without travel
  // The repeat at 2.3 needs its approach from 2.12, so the first recovery is truncated to 2.12 and the picture shows it.
  const [first, second] = plan.actors[0].assignments;
  assert.equal(first.truncated, true); close(first.leaveAt, 2.3 - 0.18); assert.equal(second.truncated, false);
  assert.equal(actorPose(plan, id, 2.11).phase, 'recover'); assert.equal(actorPose(plan, id, 2.11).truncated, true);
  assert.equal(actorPose(plan, id, 2.13).phase, 'approach'); assert.equal(actorPose(plan, id, 2.13).eventId, 'b');
  assert.equal(first.approach, 0.18);
  // A repeat sooner than minRecover after contact cannot be served by the same actor and spawns another.
  const tooFast = planPerformers([{ id: 'a', slot: 6, noteOn: 2 }, { id: 'b', slot: 6, noteOn: 2.2 }], { slots: 8, speedSlotsPerSecond: 5 });
  assert.equal(tooFast.actors.length, 2);
  assert.throws(() => planPerformers([], { slots: 8, minRecover: 1 }), /minRecover/);
  assert.deepEqual(actorPose(plan, id, 10), { slot: 6, phase: 'rest', progress01: 0, eventId: null, previousEventId: 'b' });
  // previousEventId lets a renderer keep continuity: rest after 'a' names 'a'; approaching 'b' after a truncated recovery names 'a'.
  assert.equal(actorPose(plan, id, 2.13).previousEventId, 'a');
  const walk = planPerformers([{ id: 'a', slot: 0, noteOn: 1 }, { id: 'b', slot: 7, noteOn: 4 }], { slots: 8, speedSlotsPerSecond: 5 });
  const w = walk.actors[0].id, travelling = actorPose(walk, w, 4 - 0.18 - 0.7);
  assert.equal(travelling.phase, 'travel'); assert.equal(travelling.eventId, 'b'); assert.equal(travelling.previousEventId, 'a');
  assert.equal(actorPose(walk, w, 1.5).previousEventId, 'a'); assert.equal(actorPose(walk, w, 0.5).previousEventId, null);
  const times = [2.2, 0, 2, 1.9, 10, depart + 0.25];
  const shuffled = times.map(t => actorPose(plan, id, t)), ordered = [...times].sort((x, y) => x - y).map(t => actorPose(plan, id, t));
  times.forEach((t, i) => assert.deepEqual(shuffled[i], ordered[[...times].sort((x, y) => x - y).indexOf(t)]));
  assert.throws(() => actorPose(plan, 'nope', 1), /unknown actor/); assert.throws(() => actorPose(plan, id, NaN), /t must/);
});

test('performerFrame lists every actor of every plan; the default passage is a fact about the phrase: five garden arms, nothing unplanned', () => {
  const passage = createPerformance(DEFAULT_PATCH);
  const garden = planPerformers(passage.snapshots.garden.voices.map(v => ({ id: v.id, slot: v.slot, noteOn: v.noteOn })), { family: 'garden', slots: 8 });
  const tine = planPerformers(passage.snapshots.tine.voices.map(v => ({ id: v.id, slot: 0, noteOn: v.noteOn })), { family: 'tine', slots: 1 });
  assert.equal(garden.actors.length, 5, `garden actors ${garden.actors.length}`);   // pinned: a tempo or seed change that alters this is worth noticing
  assert.deepEqual(garden.unplanned, []); assert.equal(tine.actors.length, 1);
  assert.equal(planPerformers(passage.snapshots.garden.voices.map(v => ({ id: v.id, slot: v.slot, noteOn: v.noteOn })), { family: 'garden', slots: 8, maxActors: 4 }).unplanned.length, 1);
  const frame = performerFrame([garden, tine], 1.0);
  assert.equal(frame.performers.length, garden.actors.length + 1);
  assert.ok(frame.performers.every(p => typeof p.slot === 'number' && ['rest', 'travel', 'approach', 'contact', 'recover'].includes(p.phase)));
  assert.deepEqual(performerFrame([garden, tine], 5.25), performerFrame([garden, tine], 5.25));
});

test('validation rejects malformed events and parameters', () => {
  assert.throws(() => planPerformers('x', { slots: 8 }), /array/);
  assert.throws(() => planPerformers([], { slots: 0 }), /slots/);
  assert.throws(() => planPerformers([{ slot: 9, noteOn: 1 }], { slots: 8 }), /slot/);
  assert.throws(() => planPerformers([{ slot: 1, noteOn: NaN }], { slots: 8 }), /noteOn/);
  assert.throws(() => planPerformers([], { slots: 8, approach: 0 }), /approach/);
  assert.throws(() => planPerformers([], { slots: 8, maxActors: -1 }), /maxActors/);
});
