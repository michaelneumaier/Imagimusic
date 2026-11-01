# Bellows Choir: control equations

*Fable, 2026-11-01. Implemented in `src/dynamics.js`; the audio adapter and
scene (Astra) read these values, never recompute them.*

All quantities are functions of engine time `t`. A voice is
`{ noteHz, velocity ∈ [0,1], noteOn, noteOff | null }`.

## Envelope (piecewise linear ADSR)

```
age = t − noteOn
held(age):  0 ≤ age < a          level = age / a                     stage attack
            a ≤ age < a + d      level = 1 − (1 − s)(age − a) / d    stage decay
            age ≥ a + d          level = s                           stage sustain
t < noteOn                       level = 0                           stage off
t ≥ noteOff                      level = held(noteOff − noteOn) · (1 − (t − noteOff) / r)   stage release, 0 and off after r
```

Release always starts from the level at `noteOff`, so an early release never
jumps. The bellows picture is `fill01 = 1 − level` (squeezed on attack).

## LFO

```
phase01 = frac((t − noteOn) · rateHz + phase0)     inside voiceDynamics: phase restarts at each note onset
          (lfoValue on its own accepts any t; the onset-relative clock is applied by voiceDynamics)
sine:    sin(2π · phase01)
tri:     4p (p < ¼), 2 − 4p (¼ ≤ p < ¾), 4p − 4 (p ≥ ¾)      so it peaks at ¼ like the sine
square:  +1 (p < ½), −1 otherwise                               exact step in the model
oct     = depthOct · value
```

## Filter and pitch

```
cutoff     = cutoffHz · 2^(envAmount · env.level) · 2^(oct, if target = cutoff) · (noteHz / C4)^keyTrack
frequency  = noteHz · 2^(oct, if target = pitch)
both clamped to [1, 0.45 · sampleRate]
aperture01 = clamp(log2(cutoff / 20) / log2(1000), 0, 1)     20 Hz → 0, 20 kHz → 1
Q (adapter) = 0.5 · 36^resonance                             0.5 … 18
```

## Amplitude

```
tremolo = 1 − min(1, depthOct) · (1 − value) / 2,  if target = amp, else 1     swings between 1 − depth and 1
amp     = env.level · velocity · tremolo
```

## Scheduling for Web Audio

`scheduleVoice` samples `gain`, `cutoffHz`, `frequencyHz` on a 200 Hz grid
**anchored to `noteOn`** (`t_k = noteOn + k / controlRate`, so rolling live
windows and the offline render hit the same lattice) from `fromTime` to
`toTime`, adds the exact envelope corners
(`noteOn`, `+a`, `+a+d`, `noteOff`, `+r`) that fall in the window, and emits
`{ t, param, value, ramp: 'linear' }`. The first sample is the live value at
`fromTime`, so a held note can be scheduled in rolling windows. Between samples
the adapter ramps linearly; for a square LFO the step is exact at sample times
and approximated by the ramp in between (declared, not hidden).

## Reference notes

- The ADSR, filter-envelope-in-octaves, and key-tracking conventions follow
  classic subtractive synths (Moog / ARP style), see Russ, *Sound Synthesis
  and Sampling*, ch. 2–3, and Pirkle, *Designing Software Synthesizer
  Plug-Ins in C++*, envelope and modulation chapters.
- Octave-scaled modulation (`2^x`) keeps sweeps perceptually uniform; the
  aperture uses the same log scale so the iris reads like the ear hears.
- This is an **interpreted** mechanism: the chamber does not filter air. The
  synth's control state drives the picture; the caption says so.
