import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove, validateGrove, canonicalGrove, groveSystem, describeGrove, composeGroveGreeting, validateGroveGreeting, greetingStrikes, greetingDuration, groveNeighbors, groveEnvelope, GROVE_SEEDS, GROVE_TOPOLOGIES, GREETING_BOUNDS } from '../src/score/grove.js';
import { networkStrikeResponse } from '../src/coupling.js';

test('composeGrove is deterministic, canonical and within bounds; layout is normalized and bridges follow the topology', () => {
  const seen = new Set();
  for (let seed = 0; seed < 60; seed++) {
    const g = composeGrove({ seed }), h = composeGrove({ seed });
    assert.deepEqual(g, h); assert.equal(canonicalGrove(g), canonicalGrove(JSON.parse(canonicalGrove(g))));
    assert.ok(GROVE_TOPOLOGIES.includes(g.topology)); seen.add(g.topology);
    assert.equal(g.bodies.length, 3); assert.ok(g.layout.every(p => Math.abs(p.x) <= 1 && Math.abs(p.z) <= 1));
    assert.equal(g.bridges.length, g.topology === 'chain' ? 2 : 3);
    assert.ok(g.bodies.every(b => Math.abs(b.cents) <= 40) && g.bodies[0].cents === 0, 'a near-resonant cluster around the base');
    const sys = groveSystem(g); assert.ok(sys.eigen.residual < 1e-12 && sys.eigen.orthogonality < 1e-12);
  }
  assert.equal(seen.size, 2, 'both topologies occur across seeds');
  assert.notEqual(canonicalGrove(composeGrove({ seed: 1 })), canonicalGrove(composeGrove({ seed: 2 })));
  assert.throws(() => composeGrove({ seed: -1 }), /seed/);
});

test('validateGrove rejects anatomy that does not follow the model', () => {
  const ok = composeGrove({ seed: 5 });
  const rejects = (f, re) => { const c = structuredClone(ok); f(c); assert.throws(() => validateGrove(c), re); };
  rejects(c => { c.bodies[1].hz += 5; }, /does not follow from the cluster base/);
  rejects(c => { c.bodies[0].cents = 10; c.bodies[0].hz = c.cluster.baseHz * 2 ** (10 / 1200); }, /body 0 sits on the cluster base/);
  rejects(c => { c.bridges.push({ a: 0, b: 2, coupling: 0.01 }); }, /bridges must match the topology/);
  rejects(c => { c.bridges[0].coupling = 0.1; }, /coupling/);
  rejects(c => { c.layout[0].x = 2; }, /layout 0\.x/);
  rejects(c => { c.bodies[2].mass = 0.5; }, /mass/);
  rejects(c => { c.loss = 0.1; }, /loss/);
  rejects(c => { c.extra = 1; }, /unsupported field/);
  rejects(c => { c.cluster.baseMidi = 49; }, /garden notes/);
  rejects(c => { c.cluster.baseHz = NaN; }, /cluster\.baseHz/);
  rejects(c => { c.cluster.baseMidi = 51; }, /garden notes|frequency of cluster\.baseMidi|does not follow/);
  rejects(c => { c.cluster.baseHz += 1; }, /frequency of cluster\.baseMidi/);
});

test('describeGrove measures swells from the drawn envelope and participation sums to one; curated seeds are distinct and documented', () => {
  const table = {};
  for (const seed of GROVE_SEEDS) {
    const g = composeGrove({ seed }), d = describeGrove(g);
    assert.equal(d.swells.length, 6);
    const sys = groveSystem(g);
    for (const s of d.swells) {
      if (s.swellSeconds === null) continue;
      const r = networkStrikeResponse(sys, sys.m.map((_, i) => (i === s.struck ? 1 : 0))), env = t => groveEnvelope(sys, r, t)[s.body];
      assert.ok(env(s.swellSeconds) >= env(s.swellSeconds - 0.002) - 1e-12 && env(s.swellSeconds) >= env(s.swellSeconds + 0.002) - 1e-12, `seed ${seed}: swell of ${s.body} after ${s.struck} is a local maximum`);
    }
    for (const p of d.participation) assert.ok(Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-5, 'participation (rounded to 6 places) sums to one per mode');
    assert.ok(/not energy/.test(d.metric));
    table[seed] = { topology: d.topology, modes: d.normalFreqsHz, split: d.modeSplitHz, ring: d.ringSeconds, swells: d.swells.map(s => `${s.struck}→${s.body}: ${s.swellSeconds}s ×${s.ratio}`) };
  }
  console.log('grove curated seeds (measured):', JSON.stringify(table));
  assert.equal(new Set(GROVE_SEEDS.map(seed => composeGrove({ seed }).topology)).size, 2, 'the curated set shows both topologies');
});

test('the greeting keeps its promise for every curated seed and compiles to strikes in seconds within the bound', () => {
  for (const seed of GROVE_SEEDS) {
    const g = composeGrove({ seed }), greeting = composeGroveGreeting(g), { neighbor, third } = groveNeighbors(g);
    assert.deepEqual(composeGroveGreeting(g), greeting);
    assert.ok(greeting.strikes.filter(k => k.beat < 5).every(k => k.body === 0));
    assert.ok(greeting.strikes.find(k => k.body === third).beat > greeting.strikes.find(k => k.body === neighbor).beat);
    const strikes = greetingStrikes(greeting);
    assert.ok(strikes.every(s => s.time >= 0.35 && [0, 1, 2].includes(s.body) && s.velocity > 0 && s.velocity <= 1));
    const d = greetingDuration(greeting, g); assert.ok(d >= GREETING_BOUNDS.minSeconds && d <= GREETING_BOUNDS.maxSeconds, `${seed}: ${d}`);
    assert.ok(d - strikes.at(-1).time >= 5, 'at least five seconds of untouched ring');
    const rejects = (f, re) => { const c = structuredClone(greeting); f(c); assert.throws(() => validateGroveGreeting(c, g), re); };
    rejects(c => { c.strikes[0].body = neighbor; }, /solo touches body 0 only/);
    rejects(c => { c.strikes.push({ id: 'late', beat: 19, body: 0, velocity: 0.5, role: 'solo' }); }, /nothing is touched in the silence/);
    rejects(c => { c.strikes.find(k => k.id === 'shared:3').body = 0; }, /all three bodies/);
    rejects(c => { c.neighbor = third; c.third = neighbor; }, /follow the grove/);
    rejects(c => { c.tempo = 40; }, /greeting lasts/);
    assert.throws(() => validateGroveGreeting(greeting, composeGrove({ seed: seed + 1 })), /belong to this grove|follow the grove/);
  }
});

test('the settled lines state the authored fact of each passage and refuse other recipes', async () => {
  const { greetingSettledLine, composeGroveGreeting } = await import('../src/score/grove.js');
  const { voiceGreetingSettledLine, composeGroveVoiceGreeting } = await import('../src/score/grove-voice.js');
  const { restInvitationSettledLine, composeRestInvitation, createGroveRestRecipe } = await import('../src/score/grove-rest.js');
  const g = composeGrove({ seed: 7 }), greeting = composeGroveGreeting(g), voice = composeGroveVoiceGreeting(g), rest = composeRestInvitation(createGroveRestRecipe(g, undefined, { sampleRate: 8000 }));
  assert.match(greetingSettledLine(greeting), new RegExp(`Body ${greeting.neighbor + 1} answered`));
  assert.match(voiceGreetingSettledLine(voice), /three places/);
  assert.match(restInvitationSettledLine(rest), /not simply quieter/);
  assert.throws(() => greetingSettledLine(voice), /not a Grove greeting/); assert.throws(() => voiceGreetingSettledLine(greeting), /not a position-aware/); assert.throws(() => restInvitationSettledLine(greeting), /not a Rest invitation/);
  for (const line of [greetingSettledLine(greeting), voiceGreetingSettledLine(voice), restInvitationSettledLine(rest)]) assert.ok(!/feel|beautiful|calm|sacred/i.test(line), 'no claims about the listener');
});
