# Imagimusic — Resonator Garden

A first playable study in giving synthesized sounds a visible anatomy. Built collaboratively by Astra and Fable from Michael's [original idea](initial-idea.md).

## Play locally

Requires Python 3. No package installation or build step.

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080. Click **Begin sequence**, click a resonator or note button, or play **A S D F G H J K**. Space starts/stops when focus is outside controls; a focused button retains its normal Space action. **Quiet** silences all notes. Switching away from the tab stops playback.

Choose glass, bronze, or string overtone relationships. Damping shortens decay, brightness adds upper-mode energy, and spread places notes across the stereo field. Edits apply to new strikes; ringing notes keep the model that excited them. Discover a variation changes the reproducible phrase seed.

- **Save instrument / Load instrument:** versioned JSON patch and seed. No account or server storage.
- **Save image:** PNG of the canvas.
- **Render WAV:** deterministic 16-beat phrase plus decay tail, rendered in a worker. Mono PCM16 at 22.05 kHz; live stereo placement and compressor are not included. This exports the saved procedural phrase, not a recording of manual performance or live edits.

## What this study proves

`src/model.js` defines each resonance's frequency, amplitude, and decay. The audio engine and renderer share these modes and strike timestamps. Each of five visible layers represents one mode's decaying energy. Procedural notes use a seeded score. Visual sway is intentionally slowed and amplified for legibility.

This is **interpreted modal anatomy**, not a solved physical object. Shape does not yet determine frequency, the material names describe tuned spectral families rather than measured substances, and a visible energy-source/striker mechanism is still to come. There is no imported-audio fitting, MIDI input, full 3D scene, or video export yet.

The current runtime uses native JavaScript modules, Canvas 2D, Web Audio, and a worker. Future architecture proposals are distinguished from implemented behavior in [architecture](docs/ARCHITECTURE.md).

## Collaborate and extend

Start with [AGENTS.md](AGENTS.md), [protocol](collab/PROTOCOL.md), [vision](docs/VISION.md), and [roadmap](docs/ROADMAP.md). The canonical cross-agent inbox is `collab/`; `collaboration/` records the superseded initial handshake. Messages are files, so agents in different apps can exchange evidence and review without Michael relaying it. Agents poll at checkpoints; the mailbox does not wake inactive sessions.

```sh
collab/msg inbox astra
collab/msg inbox fable
collab/msg send astra fable 'Review request' review < message.txt
node --test tests/*.test.js
```

## Verification

Seven tests cover the audio graph and model: shared voice-retirement fades, one panner per voice, four-millisecond attack detail, tuning/Nyquist limits, damping/brightness relationships, seeded score determinism, malformed imports, deterministic non-silent bounded PCM with a quiet tail, and WAV headers. Safari smoke checks exercised page rendering, procedural start/stop, material change, seed variation, manual note triggering, and worker WAV completion, JSON save/load round trip, and PNG export. Actual download files were verified. Keyboard notes after clicking playback were rechecked after the peer-review fixes. These checks do not substitute for listening evaluation, mobile performance profiling, or measured audiovisual latency.
