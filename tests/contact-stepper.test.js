import test from 'node:test';
import assert from 'node:assert/strict';
import { modalNetwork, stateStepper, stateAt, strikeImpulse, freeResponseFromState, statePickup, stateEnergy, contactDamping, freeDamping, matrixExponential, forcedStepper } from '../src/coupling.js';

const beam = (f0, mass, rates) => ({ mass, frequencies: [f0, f0 * 6.267, f0 * 17.55], decayRates: rates, shape: u => [u, u * u * (3 - 2 * u) * 1.2 - 0.3 * u, Math.sin(3.2 * u) * 0.9] });
const network = () => modalNetwork({ bodies: [beam(110, 1, [3, 6, 12]), beam(146.8, 0.8, [3.5, 7, 14]), beam(220, 1.3, [4, 8, 16])], edges: [{ a: 0, b: 1, kc: 4e4, ua: 1, ub: 1 }, { a: 1, b: 2, kc: 3e4, ua: 1, ub: 1 }] });
const norm = x => Math.sqrt(x.reduce((s, v) => s + v * v, 0));

test('matrix exponential: known cases', () => {
  const rot = matrixExponential(Float64Array.from([0, -Math.PI / 2, Math.PI / 2, 0]), 2);
  assert.ok(Math.abs(rot[0]) < 1e-15 && Math.abs(rot[1] + 1) < 1e-15 && Math.abs(rot[2] - 1) < 1e-15 && Math.abs(rot[3]) < 1e-15, 'rotation by 90 degrees');
  const big = matrixExponential(Float64Array.from([-30, 0, 0, 2]), 2);
  assert.ok(Math.abs(big[0] - Math.exp(-30)) < 1e-27 && Math.abs(big[3] - Math.exp(2)) < 1e-13, 'diagonal, scaled and squared');
});

test('with no contact the stepper reproduces the modal sums at every sample: same model, two computations', () => {
  const net = network(), sr = 8000, stepper = stateStepper(net, { sampleRate: sr });
  const strikes = [{ body: 0, u: 0.6, J: 1, time: 0 }];
  let x = strikeImpulse(net, strikes[0]), worst = 0, scale = 0;
  for (let i = 1; i <= 2 * sr; i++) { x = stepper.step(x); if (i % 97 === 0) { const ref = stateAt(net, strikes, i / sr); worst = Math.max(worst, norm(ref.map((v, k) => v - x[k]))); scale = Math.max(scale, norm(ref)); } }
  assert.ok(worst / scale < 1e-9, `relative discrepancy ${worst / scale} over two seconds (roundoff only)`);
});

test('a strike during stepping and a lift back to modal sums are exact: stepper state → freeResponseFromState equals stateAt', () => {
  const net = network(), sr = 8000, stepper = stateStepper(net, { sampleRate: sr });
  const strikes = [{ body: 0, u: 0.6, J: 1, time: 0 }, { body: 2, u: 1, J: 0.5, time: 0.25 }];
  let x = strikeImpulse(net, strikes[0]);
  for (let i = 1; i <= 0.5 * sr; i++) { x = stepper.step(x); if (i === 0.25 * sr) x = x.map((v, k) => v + strikeImpulse(net, strikes[1])[k]); }
  const free = freeResponseFromState(net, x);
  for (const tau of [0, 0.01, 0.3, 1]) { const ref = stateAt(net, strikes, 0.5 + tau), got = free(tau); assert.ok(norm(ref.map((v, k) => v - got[k])) / norm(ref) < 1e-9, `tau ${tau}`); }
});

test('a rest removes energy monotonically, damps where it rests, is heard across the bridge, and leaves the hand-off model unchanged', () => {
  const net = network(), sr = 8000, free = stateStepper(net, { sampleRate: sr }), rest = stateStepper(net, { contacts: [{ body: 0, u: 0.6, c: 60 }], sampleRate: sr });
  const strike = { body: 0, u: 0.6, J: 1 };
  let xf = strikeImpulse(net, strike), xr = Float64Array.from(xf), last = Infinity;
  const pick = x => [0, 1, 2].map(b => Math.abs(statePickup(net, x, b, 0.6)));
  let peakFree = [0, 0, 0], peakRest = [0, 0, 0];
  for (let i = 1; i <= 0.5 * sr; i++) {
    xf = free.step(xf); xr = rest.step(xr);
    const e = stateEnergy(net, xr); assert.ok(e <= last * (1 + 1e-12), `energy rose at sample ${i}`); last = e;
    if (i > 0.3 * sr) { const pf = pick(xf), pr = pick(xr); peakFree = peakFree.map((v, b) => Math.max(v, pf[b])); peakRest = peakRest.map((v, b) => Math.max(v, pr[b])); }
  }
  assert.ok(peakRest[0] < 0.05 * peakFree[0], `the rested body is damped (${peakRest[0] / peakFree[0]} of free)`);
  assert.ok(peakRest[1] < peakFree[1] && peakRest[1] > 0.02 * peakFree[1], 'the neighbour is quieter but still rings: the bridge carries the change');
  assert.ok(stateEnergy(net, xr) < 0.01 * stateEnergy(net, xf), 'energy under the hand far below the free passage');
  // Lift: from the rested state the model continues under the free damping only.
  const after = freeResponseFromState(net, xr), stepped = (() => { let x = Float64Array.from(xr); for (let i = 0; i < 400; i++) x = free.step(x); return x; })();
  assert.ok(norm(after(400 / sr).map((v, k) => v - stepped[k])) / norm(stepped) < 1e-9);
});

test('a Strang split of exact free steps and the rank-one contact exponential converges to Φ at second order (independent cross-check)', () => {
  const net = network(), contact = { body: 1, u: 0.6, c: 40 }, n = net.n;
  const Ct = contactDamping(net, contact), Cf = freeDamping(net);
  // Contact substep: rank-one damping on velocity only: ẏ ← ẏ + (e^{−s‖w‖² h} − 1) w (wᵀ ẏ)/‖w‖² where Ct = s · w wᵀ.
  const o = net.offsets[1], w = net.snapshot[1].shape(0.6), s = contact.c / net.snapshot[1].mass, ww = w.reduce((a, v) => a + v * v, 0);
  const contactStep = (x, h) => { const y = Float64Array.from(x); let dot = 0; for (let j = 0; j < w.length; j++) dot += w[j] * x[n + o + j]; const f = (Math.exp(-s * ww * h) - 1) * dot / ww; for (let j = 0; j < w.length; j++) y[n + o + j] += f * w[j]; return y; };
  const x0 = strikeImpulse(net, { body: 1, u: 0.6, J: 1 });
  const errorAt = h => {
    const exact = stateStepper(net, { contacts: [contact], sampleRate: Math.round(1 / h) }).step(x0);
    const half = freeResponseFromState(net, x0)(h / 2), mid = contactStep(half, h), full = freeResponseFromState(net, mid)(h / 2);
    return norm(exact.map((v, k) => v - full[k])) / norm(exact);
  };
  const e1 = errorAt(1 / 8000), e2 = errorAt(1 / 16000);
  // One step: the split's local error is O(h³) (second order globally), so halving h divides it by about 8.
  assert.ok(e1 > 1e-13 && e1 < 1e-2 && e2 < e1, `split error ${e1} at 8 kHz, ${e2} at 16 kHz`);
  assert.ok(e1 / e2 > 5 && e1 / e2 < 11, `third-order local convergence (ratio ${e1 / e2})`);
  assert.ok(Ct.every(v => Number.isFinite(v)) && Cf.every(v => Number.isFinite(v)));
});

test('forced stepper: zero force agrees with the passive stepper; a held sinusoidal force obeys the energy budget and a work/dissipation balance', () => {
  const net = network(), sr = 8000, h = 1 / sr, b = strikeImpulse(net, { body: 0, u: 0.6, J: 1 });
  const passive = stateStepper(net, { sampleRate: sr }), forced = forcedStepper(net, { sampleRate: sr, direction: b });
  let x = strikeImpulse(net, { body: 1, u: 1, J: 1 }), y = Float64Array.from(x);
  for (let i = 0; i < sr; i++) { x = passive.step(x); y = forced.step(y, 0); }
  assert.ok(norm(x.map((v, k) => v - y[k])) / norm(x) < 1e-10, 'zero force: the two exponentials agree to roundoff');
  // Budget: √(2E(t)) ≤ √(2E₀) + ‖b‖ ∫|f| (Astra's derivation), checked at every sample of a 2 s sinusoid at the body's fundamental, then release.
  const f0 = net.normalFreqsHz[0], A = 0.02, contacts = [{ body: 1, u: 0.6, c: 40 }], cases = [[], contacts];
  for (const cs of cases) {
    const st = forcedStepper(net, { sampleRate: sr, direction: b, contacts: cs }), C = freeDamping(net); if (cs.length) { const Ct = contactDamping(net, cs[0]); for (let i = 0; i < C.length; i++) C[i] += Ct[i]; }
    let z = new Float64Array(st.dim), budget = Math.sqrt(2 * stateEnergy(net, z)), integral = 0, work = 0, dissipation = 0, peakE = 0, worstBudget = 0;
    for (let i = 0; i < 5 * sr; i++) {
      const f = i < 2 * sr ? A * Math.sin(2 * Math.PI * f0 * i / sr) : 0;
      let vb = 0, vCv = 0; for (let k = net.n; k < 2 * net.n; k++) { vb += z[k] * b[k]; for (let j = net.n; j < 2 * net.n; j++) vCv += z[k] * C[(k - net.n) * net.n + (j - net.n)] * z[j]; }
      work += vb * f * h; dissipation += vCv * h;
      z = st.step(z, f); integral += Math.abs(f) * h;
      const e = stateEnergy(net, z); peakE = Math.max(peakE, e);
      const bound = budget + st.directionNorm * integral; assert.ok(Math.sqrt(2 * e) <= bound + 1e-12, `budget at sample ${i}: ${Math.sqrt(2 * e)} ≤ ${bound}`); if (bound > 0) worstBudget = Math.max(worstBudget, Math.sqrt(2 * e) / bound);
    }
    assert.ok(worstBudget <= 1 + 1e-9, `budget never exceeded (worst ratio ${worstBudget})`);
    const eEnd = stateEnergy(net, z); assert.ok(Math.abs(eEnd - (work - dissipation)) <= 0.05 * Math.max(work, dissipation, 1e-30), `first-order energy balance within 5 % (E_end ${eEnd.toExponential(3)}, work ${work.toExponential(3)}, dissipation ${dissipation.toExponential(3)})`);
    assert.ok(peakE > 0 && eEnd < peakE, 'energy rises under the source and falls after release');
  }
});
