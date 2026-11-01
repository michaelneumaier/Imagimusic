// Performer planner (proposal 006): the visible actors that carry exciters between slots.
// Pure and deterministic: a plan is data, poses are functions of t. Contact timing is NOT decided here; the
// per-slot striker (excitation.strikerPose) still lands on the audible onset. The planner only explains how an
// actor got there, and admits when none could ("unplanned").

const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a finite number.`); return v; };

export const DEFAULT_PLANNER = Object.freeze({ approach: 0.18, recover: 0.28, speedSlotsPerSecond: 6, maxActors: 6 });

export function planPerformers(events, { family = 'garden', slots, approach = DEFAULT_PLANNER.approach, recover = DEFAULT_PLANNER.recover, speedSlotsPerSecond = DEFAULT_PLANNER.speedSlotsPerSecond, maxActors = DEFAULT_PLANNER.maxActors, restSlot } = {}) {
  if (!Array.isArray(events)) throw new Error('events must be an array.');
  if (!Number.isInteger(slots) || slots < 1) throw new Error('slots must be a positive integer.');
  for (const [k, v] of Object.entries({ approach, recover, speedSlotsPerSecond })) { finite(v, k); if (v <= 0) throw new Error(`${k} must be positive.`); }
  if (!Number.isInteger(maxActors) || maxActors < 0) throw new Error('maxActors must be a non-negative integer.');
  const rest = restSlot === undefined ? (slots - 1) / 2 : finite(restSlot, 'restSlot');
  const sorted = events.map((e, i) => {
    if (!e || !Number.isInteger(e.slot) || e.slot < 0 || e.slot >= slots) throw new Error(`event ${i}: slot must be an integer in 0..${slots - 1}.`);
    finite(e.noteOn, `event ${i}.noteOn`);
    return { eventId: e.id ?? i, slot: e.slot, noteOn: e.noteOn };
  }).sort((a, b) => a.noteOn - b.noteOn || a.slot - b.slot);
  const travel = (from, to) => Math.abs(to - from) / speedSlotsPerSecond;
  const actors = [], unplanned = [];
  const freeAt = actor => actor.assignments.length ? actor.assignments.at(-1).leaveAt : -Infinity;
  const whereAt = actor => actor.assignments.length ? actor.assignments.at(-1).slot : actor.restSlot;
  for (const ev of sorted) {
    const deadline = ev.noteOn - approach;
    let best = null, bestArrival = Infinity;
    for (const actor of actors) {
      const arrival = Math.max(freeAt(actor), 0) + travel(whereAt(actor), ev.slot);
      const sameSlotRepeat = whereAt(actor) === ev.slot && freeAt(actor) <= ev.noteOn; // may keep striking the same slot
      const feasible = arrival <= deadline || (sameSlotRepeat && freeAt(actor) <= deadline + approach);
      if (feasible && arrival < bestArrival) { best = actor; bestArrival = arrival; }
    }
    if (!best) {
      if (actors.length >= maxActors) { unplanned.push({ ...ev, reason: 'no-actor' }); continue; }
      // Performers take their places before the music starts: a new actor rests at the shared rest slot if it can
      // reach its first note from there in time, otherwise it is already standing at that note's slot.
      const fromRest = travel(rest, ev.slot);
      const spawned = { id: `${family}/${actors.length}`, restSlot: fromRest <= deadline ? rest : ev.slot, assignments: [] };
      actors.push(spawned); best = spawned; bestArrival = fromRest <= deadline ? fromRest : 0;
    }
    const arriveBy = Math.min(deadline, Math.max(bestArrival, deadline)); // arrive exactly at the approach start when early
    best.assignments.push({ eventId: ev.eventId, slot: ev.slot, noteOn: ev.noteOn, arriveBy: Math.max(0, Math.min(deadline, bestArrival <= deadline ? deadline : arriveBy)), leaveAt: ev.noteOn + recover });
  }
  return { family, actors, unplanned, meta: { approach, recover, speedSlotsPerSecond, maxActors, restSlot: rest, slots, events: sorted.length } };
}

/** Where an actor is and what it is doing at time t. Pure function of the plan. */
export function actorPose(plan, actorId, t) {
  finite(t, 't');
  const actor = plan.actors.find(a => a.id === actorId);
  if (!actor) throw new Error(`unknown actor '${actorId}'.`);
  const { approach, recover, speedSlotsPerSecond } = plan.meta;
  const travel = (from, to) => Math.abs(to - from) / speedSlotsPerSecond;
  let from = actor.restSlot, freeAt = 0;
  for (const a of actor.assignments) {
    const departAt = Math.max(freeAt, a.arriveBy - travel(from, a.slot));
    if (t < departAt) return { slot: from, phase: 'rest', progress01: 0, eventId: null };
    if (t < a.arriveBy && from !== a.slot) {
      const p = (t - departAt) / Math.max(1e-9, a.arriveBy - departAt);
      return { slot: from + (a.slot - from) * p, phase: 'travel', progress01: p, eventId: a.eventId };
    }
    if (t < a.noteOn) return { slot: a.slot, phase: 'approach', progress01: (t - (a.noteOn - approach)) / approach < 0 ? 0 : (t - (a.noteOn - approach)) / approach, eventId: a.eventId };
    if (t < a.noteOn + recover) {
      const p = (t - a.noteOn) / recover;
      return { slot: a.slot, phase: p < 0.125 ? 'contact' : 'recover', progress01: p, eventId: a.eventId };
    }
    from = a.slot; freeAt = a.leaveAt;
  }
  return { slot: from, phase: 'rest', progress01: 0, eventId: null };
}

/** StateFrame.global fragment: every actor of every plan at t. */
export function performerFrame(plans, t) {
  return { performers: plans.flatMap(plan => plan.actors.map(actor => ({ id: actor.id, family: plan.family, ...actorPose(plan, actor.id, t) }))) };
}
