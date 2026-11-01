import test from 'node:test';
import assert from 'node:assert/strict';
import { composeLoomJourney, validateLoomJourney, canonicalLoomJourney, loomScoreFrom, journeyDuration, journeySectionAt, describeLoomSetting, beatSeconds, LOOM_JOURNEY_SETTINGS, JOURNEY_BOUNDS } from '../src/score/loom-journey.js';
import { createLoomPerformance, loomPerformanceFrame } from '../src/loom/performance.js';

const SETTINGS = Object.keys(LOOM_JOURNEY_SETTINGS);

test('deterministic and canonical; every setting compiles through the real Loom performance within the duration bound', () => {
  for (const setting of SETTINGS) {
    const a = composeLoomJourney({ setting }), b = composeLoomJourney({ setting });
    assert.deepEqual(a, b); assert.equal(canonicalLoomJourney(a), canonicalLoomJourney(JSON.parse(canonicalLoomJourney(b))));
    const passage = createLoomPerformance(a.settings, loomScoreFrom(a));
    assert.equal(passage.events.length, a.strikes.length);
    assert.ok(Math.abs(passage.duration - journeyDuration(a)) < 1e-9, 'the model decides the length: last strike plus its ring');
    assert.ok(journeyDuration(a) >= JOURNEY_BOUNDS.minSeconds && journeyDuration(a) <= JOURNEY_BOUNDS.maxSeconds, `${setting}: ${journeyDuration(a).toFixed(1)} s`);
  }
  assert.notEqual(canonicalLoomJourney(composeLoomJourney({ setting: 'close-kin' })), canonicalLoomJourney(composeLoomJourney({ setting: 'tight-weave' })));
  assert.throws(() => composeLoomJourney({ setting: 'loose' }), /setting must be/);
});

test('the shape is what the study promises: solo strikes one body, the other sounds unstruck, the answer is late, the weave alternates, silence ends it', () => {
  for (const setting of SETTINGS) {
    const j = composeLoomJourney({ setting }), passage = createLoomPerformance(j.settings, loomScoreFrom(j));
    const [solo, response, weave, silence] = j.sections;
    const inSection = (k, s) => k.beat >= s.beats[0] && k.beat < s.beats[1];
    assert.ok(j.strikes.filter(k => inSection(k, solo)).every(k => k.body === 0) && j.strikes.filter(k => inSection(k, solo)).length === 3);
    // body 1 sounds during the solo although it is never struck: the coupling carries energy across (a real modeled relationship)
    const mid = beatSeconds(j, 1.5), frame = loomPerformanceFrame(passage, mid);
    assert.ok(frame.envelope[1] > 0 && frame.envelope[0] > 0, `${setting}: unstruck body sounds (${frame.envelope[1].toExponential(2)})`);
    const first1 = j.strikes.find(k => k.body === 1);
    assert.ok(first1.beat >= response.beats[0] + 1, 'the first answer arrives later than the section it belongs to begins');
    const weaveStrikes = j.strikes.filter(k => inSection(k, weave) && k.role !== 'shared' && k.role !== 'last');
    for (let i = 1; i < weaveStrikes.length; i++) assert.notEqual(weaveStrikes[i].body, weaveStrikes[i - 1].body, 'the weave alternates bodies');
    const gaps = []; for (let i = 1; i < weaveStrikes.length; i += 2) gaps.push(weaveStrikes[i].beat - weaveStrikes[i - 1].beat);
    for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] <= gaps[i - 1], 'the answers draw closer');
    const shared = j.strikes.filter(k => k.role === 'shared'); assert.equal(shared.length, 2); assert.equal(shared[0].beat, shared[1].beat); assert.notEqual(shared[0].body, shared[1].body);
    assert.ok(j.strikes.every(k => !inSection(k, silence)), 'nothing is struck in the silence');
    const lastStrike = beatSeconds(j, Math.max(...j.strikes.map(k => k.beat)));
    assert.ok(journeyDuration(j) - lastStrike >= 5, 'at least five seconds of unstruck ring at the end');
    assert.equal(journeySectionAt(j, 0).id, 'pre-roll'); assert.equal(journeySectionAt(j, beatSeconds(j, 6)).id, 'response'); assert.equal(journeySectionAt(j, beatSeconds(j, 20)).id, 'silence'); assert.equal(journeySectionAt(j, 1000).id, 'tail');
    // coherent impulses: each role repeats one velocity
    const byRole = new Map(); for (const k of j.strikes) byRole.set(k.role, (byRole.get(k.role) ?? new Set()).add(k.velocity));
    for (const [role, set] of byRole) assert.equal(set.size, 1, `${role} uses one velocity`);
  }
});

test('the three settings differ in the ways the docs claim, measured from the model', () => {
  const kin = describeLoomSetting(LOOM_JOURNEY_SETTINGS['close-kin']), cousins = describeLoomSetting(LOOM_JOURNEY_SETTINGS['distant-cousins']), tight = describeLoomSetting(LOOM_JOURNEY_SETTINGS['tight-weave']);
  assert.ok(tight.beatHz > kin.beatHz * 2, `tight weave exchanges faster (${tight.beatHz.toFixed(3)} vs ${kin.beatHz.toFixed(3)} Hz)`);
  assert.ok(kin.modalAmplitudeRatio > 0.9, `identical bodies: the unstruck body's modal amplitude matches the struck one's (${kin.modalAmplitudeRatio.toFixed(3)})`);
  assert.ok(cousins.modalAmplitudeRatio < kin.modalAmplitudeRatio * 0.7, `detuned bodies drive the unstruck body much less (${cousins.modalAmplitudeRatio.toFixed(3)})`);
  assert.ok(kin.ringSeconds > tight.ringSeconds, `close kin rings longer (${kin.ringSeconds.toFixed(1)} vs ${tight.ringSeconds.toFixed(1)} s)`);
  console.log('loom journey settings (measured):', JSON.stringify({ kin, cousins, tight }, (k, v) => typeof v === 'number' ? +v.toFixed(4) : v));
});

test('validator rejects a journey that breaks the promise', () => {
  const ok = composeLoomJourney();
  const rejects = (f, re) => { const c = structuredClone(ok); f(c); assert.throws(() => validateLoomJourney(c), re); };
  rejects(c => { c.strikes[0].body = 1; }, /solo strikes body 0 only/);
  rejects(c => { c.strikes.push({ id: 'late', beat: 21, body: 0, velocity: 0.5, role: 'last' }); }, /nothing is struck in the silence/);
  rejects(c => { c.strikes.find(k => k.body === 1).beat = 6; c.strikes.sort((a, b) => a.beat - b.beat); }, /at least one beat into the response/);
  rejects(c => { c.settings.coupling = 0.05; }, /Invalid coupling/);
  rejects(c => { c.tempo = 40; }, /journey lasts/);   // a valid tempo that stretches the strikes past the 35 s bound
  rejects(c => { c.tempo = 30; }, /tempo/);
  rejects(c => { c.sections[1].beats = [7, 12]; }, /contiguous/);
  rejects(c => { c.sections[1].beats = [6, 12, 13]; }, /exactly/);
  rejects(c => { c.strikes[1].role = 'shout'; }, /unknown strike role/);
  rejects(c => { c.extra = 1; }, /unsupported field/);
});

test('doorway API: LOOM_JOURNEYS and getLoomJourney give fresh canonical definitions with honest chapters', async () => {
  const { getLoomJourney, LOOM_JOURNEYS, LOOM_JOURNEY_IDS } = await import('../src/score/loom-journey.js');
  assert.deepEqual(LOOM_JOURNEYS.map(j => j.id), LOOM_JOURNEY_IDS);
  for (const id of LOOM_JOURNEY_IDS) {
    const a = getLoomJourney(id), b = getLoomJourney(id);
    assert.notEqual(a, b); assert.deepEqual(a, b); assert.ok(a.title && a.description && a.chapters.length === 4);
    assert.ok(a.score.length <= 20 && a.score.every(s => Number.isFinite(s.time) && [0, 1].includes(s.body)));
    const passage = createLoomPerformance(a.settings, a.score); assert.ok(Math.abs(passage.duration - a.durationSeconds) < 1e-9);
    for (let i = 1; i < a.chapters.length; i++) assert.ok(a.chapters[i].time > a.chapters[i - 1].time);
    assert.ok(!/silent|alone/i.test(a.chapters[0].description), 'the unstruck body is never called silent or alone');
    assert.ok(/unstruck|never touched/i.test(a.chapters[0].description));
    assert.equal(a.measured.ringSeconds, describeLoomSetting(a.settings).ringSeconds);
  }
  assert.throws(() => getLoomJourney('nope'), /unknown Loom journey/);
  assert.throws(() => getLoomJourney('close-kin', { setting: 'tight-weave' }), /tempo and lead only/);
  assert.equal(getLoomJourney('close-kin', { tempo: 90 }).journey.tempo, 90);
  assert.throws(() => { LOOM_JOURNEYS[0].title = 'x'; }, TypeError);
  assert.throws(() => { LOOM_JOURNEYS[0].settings.coupling = 0; }, TypeError);
  assert.throws(() => { LOOM_JOURNEYS[0].score[0].time = 9; }, TypeError);
  assert.ok(!/as strongly/.test(LOOM_JOURNEYS[0].description));
});
