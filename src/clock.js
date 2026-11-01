// One clock interface, two implementations (decision 001 §4, proposal 004 §3).
//   WallClock  : live. `time` reads a source you supply (e.g. () => audioContext.currentTime).
//   FrameClock : render. Fixed frames per second; `time` is exactly start + frame / fps.
// Nothing else in the picture may read a clock of its own. No wall-clock dt leaks into render mode.

export class WallClock {
  constructor(source) {
    if (typeof source !== 'function') throw new Error('WallClock needs a source function returning seconds.');
    this.kind = 'wall'; this.source = source; this.last = source();
  }
  get time() { return this.source(); }
  /** Seconds since the previous tick; clamped to >= 0 so a non-monotonic source can't run springs backwards. */
  tick() { const now = this.source(); const dt = Math.max(0, now - this.last); this.last = now; return dt; }
}

export class FrameClock {
  constructor({ fps = 60, start = 0 } = {}) {
    if (!Number.isFinite(fps) || fps <= 0) throw new Error('fps must be a positive finite number.');
    if (!Number.isFinite(start) || start < 0) throw new Error('start must be a finite non-negative number.');
    this.kind = 'frame'; this.fps = fps; this.start = start; this.frame = 0;
  }
  get dt() { return 1 / this.fps; }
  get time() { return this.start + this.frame / this.fps; }
  /** Advance one frame; returns the fixed dt. */
  tick() { this.frame += 1; return this.dt; }
  /** Jump to the frame nearest to t (exact sampling at arbitrary times is what the stage needs for seeks). */
  seek(t) {
    if (!Number.isFinite(t) || t < this.start) throw new Error('seek time must be finite and >= start.');
    this.frame = Math.round((t - this.start) * this.fps); return this.time;
  }
  reset() { this.frame = 0; }
  /** Enumerate frame times in [start, end) without mutating the clock. */
  times(end) {
    if (!Number.isFinite(end) || end < this.start) throw new Error('end must be finite and >= start.');
    const n = Math.ceil((end - this.start) * this.fps - 1e-9);
    return Array.from({ length: Math.max(0, n) }, (_, k) => this.start + k / this.fps);
  }
}
