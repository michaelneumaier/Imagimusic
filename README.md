# Imagimusic — Resonator Garden & Physical Tine

A playable study in giving synthesized sounds a visible anatomy. Astra and Fable are developing it together from Michael's [original idea](initial-idea.md), with an ongoing roadmap and reciprocal reviews.

## Play locally

Requires Python 3; no package installation or build step.

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080. Click **Begin sequence**, click a garden resonator, or play **A S D F G H J K**. The physical tine uses **L**. **Quiet** fades all voices. Switching tabs stops the sequence. Space toggles the sequence outside controls; focused buttons keep their normal keyboard action.

## Two kinds of anatomy

**The garden** interprets glass, bronze and string spectral families. Each visible layer shares the amplitude and decay of an audible mode. Mallets approach before scheduled contact; manual strikes use a 25 ms approach. Click different heights or use Strike position to change which modes get excited. Harder procedural strikes excite more upper-mode energy. These shapes and strike weights are artistic interpretations, not reconstructed physical objects.

**The physical tine** derives frequencies and mode shapes from a uniform clamped beam's dimensions and material constants. Shorten it or thicken it and the pitch rises. Click along its length: striking near a mode's node suppresses that mode. The small graphs show mode shapes and their strike weights. Geometry edits end the previous strike with a short fade.

Material loss factors are estimates. The global Damping control adds a loss rate; the output uses stylized modal magnitudes rather than a calibrated mechanical impulse, pickup or acoustic radiation solver. Displayed motion uses amplified envelopes and slow representative movement, not aliased audio-frequency oscillation.

## Gesture controls

- **Strike position:** 0 is the clamp/left endpoint, 1 is the opposite end. A clamp cannot vibrate, so striking it is silent.
- **Damper release:** how quickly a held damper settles ringing voices.
- Hold the small pad next to a garden note, or **Shift + its letter**, to damp it. The tine has its own hold button and **Shift + L**. Held dampers suppress new strikes until released.
- **Damping:** natural ring-down loss; **Brightness:** upper-mode energy in the garden; **Stereo spread:** garden placement.
- **Discover a variation:** repeatable new phrase seed. Existing ringing garden notes retain their original audio modes; edits affect the next strikes.

## Save and render

- **Save / Load instrument:** version 3 JSON including geometry. Version 1 and 2 patches migrate automatically. No server storage or account.
- **Save image:** PNG of the garden canvas.
- **Render WAV:** the garden's deterministic 16-beat phrase plus its decay tail.
- **Render tine WAV:** one physical tine strike at the selected position and geometry, with its natural decay.

Exports are mono PCM16 at 22.05 kHz. Live stereo placement and the preview compressor are omitted. These are procedural renders, not recordings of manual performance or edits. Video export, MIDI and the broader synth mechanisms are subsequent milestones.

## Collaborate and extend

Read [AGENTS.md](AGENTS.md), [protocol](collab/PROTOCOL.md), [vision](docs/VISION.md), and [roadmap](docs/ROADMAP.md). The canonical mailbox is `collab/`; `collaboration/` retains the superseded initial handshake. Each agent checks mail at work checkpoints, with Fable additionally using a session watcher. Messages do not by themselves guarantee an inactive agent is running.

```sh
collab/msg inbox astra
collab/msg inbox fable
collab/msg send astra fable 'Review request' review < message.txt
node --test tests/*.test.js
```

Runtime modules: model.js (patches and sound), geometry.js (beam/string equations), excitation.js (gestures), audio.js (Web Audio), scene.js (timeline rendering), main.js (UI/scheduler), render-worker.js (WAV). Future contracts and the planned 3D migration are in [architecture](docs/ARCHITECTURE.md).

## Verification

Tests cover model limits, deterministic scores/PCM, version migration, audio voice lifecycle, silent modes, damper/retrigger behavior, synchronized fades, striker contact timing, geometry frequency scaling, mode nodes and shapes, and geometry/audio integration. Safari smoke checks exercise the actual controls and export workers. Perceptual listening, mobile performance and measured audiovisual latency remain separate evaluation work.
