import test from 'node:test';
import assert from 'node:assert/strict';
import { WallClock, FrameClock } from '../src/clock.js';

test('FrameClock time is exactly start + frame / fps, with seek, reset, and enumerated times', () => {
  const clock = new FrameClock({ fps: 60, start: 2 });
  assert.equal(clock.time, 2); assert.equal(clock.dt, 1 / 60);
  for (let i = 0; i < 90; i++) clock.tick();
  assert.equal(clock.frame, 90); assert.equal(clock.time, 2 + 90 / 60);
  assert.equal(clock.seek(3.0001), 3); assert.equal(clock.frame, 60);
  clock.reset(); assert.equal(clock.frame, 0); assert.equal(clock.time, 2);
  assert.deepEqual(new FrameClock({ fps: 4, start: 1 }).times(2), [1, 1.25, 1.5, 1.75]);
  assert.deepEqual(new FrameClock({ fps: 4 }).times(0), []);
  assert.throws(() => new FrameClock({ fps: 0 })); assert.throws(() => new FrameClock({ start: -1 }));
  assert.throws(() => clock.seek(1)); assert.throws(() => clock.times(1));
});

test('two FrameClocks over the same span produce identical time sequences (determinism)', () => {
  const a = new FrameClock(), b = new FrameClock(), ta = [], tb = [];
  for (let i = 0; i < 600; i++) { ta.push(a.time); a.tick(); tb.push(b.time); b.tick(); }
  assert.deepEqual(ta, tb);
});

test('WallClock reads its source and never yields a negative dt', () => {
  let now = 10; const clock = new WallClock(() => now);
  assert.equal(clock.kind, 'wall'); assert.equal(clock.time, 10);
  now = 10.5; assert.equal(clock.tick(), 0.5);
  now = 10.2; assert.equal(clock.tick(), 0);
  now = 10.3; assert.ok(Math.abs(clock.tick() - 0.1) < 1e-12);
  assert.throws(() => new WallClock(5));
});
