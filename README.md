# Imagimusic — Resonator Garden, Physical Tine & Bellows Choir

A playable study in giving synthesized sounds a visible anatomy. Astra and Fable are developing it together from Michael's [original idea](initial-idea.md), with an ongoing roadmap and reciprocal reviews.

## Play locally

Requires Python 3; no package installation or build step.

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080. Click **Begin sequence**, click a garden resonator, or play **A S D F G H J K**. The physical tine uses **L**. **Quiet** fades all voices. Switching tabs stops the sequence. Space toggles the sequence outside controls; focused buttons keep their normal keyboard action.

## The shared 3D stage

Open [The Conservatory](http://127.0.0.1:8080/stage.html) for an ensemble passage on one 3D floor. Drag to orbit, choose a close view, or scrub the silent timeline. Use **Play this instrument in 3D** in the laboratory to transfer its current patch and seed into the stage. The transfer stays in this browser session; the direct stage link uses the default patch. Its plain score snapshots feed both live scheduling and the shared state bus. Stateless scene bindings permit reproducible seeking. Three.js 0.187.0 is vendored locally with license and verified package integrity; no installation or CDN is needed. WebGL2 is required for this preview; the 2D laboratory remains available.

## Tension Loom study

Open [Tension Loom](http://127.0.0.1:8080/loom.html). Strike either body or use **Play conversation** for eight alternating strikes with overlapping vibrations. Coupling changes both normal modes; zero coupling leaves the unstruck body silent. Detuning changes the exchange. Each stereo channel picks up one body's displacement, with a shared pickup scale for the scored passage. **Save stereo WAV** saves the full selected strike or conversation. **Silent study** scrubs the selected response without sound; Quiet returns the bodies to rest. Its seven declared scene bindings drive the same reusable bodies at every timestamp.

The model is two coupled masses and springs, not an acoustic radiation solver. The picture shows displacement envelopes, switching to a labeled mean level above an 8 Hz mode split. A strike has a maximum 20-second tail with a quarter-second end fade. Changes to controls settle playback and take effect on the next performance. The scored renderer and arbitrary-time frame preserve interference between strikes; stage integration and movie export for this family remain future work.

## Three kinds of anatomy

**The garden** interprets glass, bronze and string spectral families. Each visible layer shares the amplitude and decay of an audible mode. Mallets approach before scheduled contact; manual strikes use a 25 ms approach. Click different heights or use Strike position to change which modes get excited. Harder procedural strikes excite more upper-mode energy. These shapes and strike weights are artistic interpretations, not reconstructed physical objects.

**The physical tine** derives frequencies and mode shapes from a uniform clamped beam's dimensions and material constants. Shorten it or thicken it and the pitch rises. Click along its length: striking near a mode's node suppresses that mode. The small graphs show mode shapes and their strike weights. Geometry edits end the previous strike with a short fade.

Material loss factors are estimates. The global Damping control adds a loss rate; the output uses stylized modal magnitudes rather than a calibrated mechanical impulse, pickup or acoustic radiation solver. Displayed motion uses amplified envelopes and slow representative movement, not aliased audio-frequency oscillation.

**The Bellows Choir** gives a subtractive synthesizer six independent chambers. Hold **Z X C V B N M**, or use **Breathing phrase**. Each bellows follows its voice's ADSR envelope, each iris follows filter cutoff on a logarithmic scale, and each pendulum follows that voice's modulation clock. Saw and reed use sawtooth and square oscillators; air uses seeded noise. Pitch modulation changes noise playback rate, not a noise fundamental. The bodies are interpreted mechanisms, not acoustic filter simulations. Controls affect the next breath. **Settle** stops the choir; **Quiet** stops all families.

Live and offline choir audio use the same source/filter/gain graph. A rolling control scheduler keeps its windows contiguous, but a long browser stall can still interrupt live modulation. If Safari is silent after connecting headphones, reload the page and click play to create a fresh audio session. This does not change device or volume settings.

## Gesture controls

- **Strike position:** 0 is the clamp/left endpoint, 1 is the opposite end. A clamp cannot vibrate, so striking it is silent.
- **Damper release:** how quickly a held damper settles ringing voices.
- Hold the small pad next to a garden note, or **Shift + its letter**, to damp it. The tine has its own hold button and **Shift + L**. Held dampers suppress new strikes until released.
- **Damping:** natural ring-down loss; **Brightness:** upper-mode energy in the garden; **Stereo spread:** garden placement.
- **Discover a variation:** repeatable new phrase seed. Existing ringing garden notes retain their original audio modes; edits affect the next strikes.

## Save and render

- **Save / Load instrument:** version 4 JSON including geometry and Bellows controls. Versions 1–3 migrate automatically. No server storage or account.
- **Save image:** PNG of the garden canvas.
- **Render WAV:** the garden's deterministic 16-beat phrase plus its decay tail.
- **Render tine WAV:** one physical tine strike at the selected position and geometry, with its natural decay.

- **Render choir WAV:** the seeded Bellows phrase, including release tails, rendered at 48 kHz with the live graph and compressor.

Laboratory WAV exports are mono PCM16; the Loom study exports stereo PCM16. Garden and tine render at 22.05 kHz and omit live stereo placement and the preview compressor. These are procedural renders, not recordings of manual performance or edits. The Conservatory also exports an MP4 with a separate trace manifest, using its shared score, state bus and procedural camera. Repeated default and air-choir renders are bit-identical on Safari 26.6.2 at 48 kHz for seed 731. This is a verified setup, not a cross-browser or codec-byte guarantee; see decision 004 and the export validation notes.

Recheck a saved stage manifest against the current model and camera code:

```sh
node tools/verify-stage-manifest.mjs path/to/imagimusic-render-731.json
```

This regenerates every state hash and checks timing metadata; it does not decode or certify the MP4 pixels.

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

Open `/tests/browser-audio.html` for real Web Audio offline checks: full versus rolling automation, seeded noise reproducibility, quiet release tails and finite maximum-resonance output. These checks render silently. Michael confirmed audible Safari playback through AirPods after restarting the page's audio session.

## Procedural movie preview

The Conservatory's **Render MP4** samples the scene at fixed 30 fps timestamps and synthesizes the soundtrack offline. It exports a 1280×720 H.264/AAC movie plus a JSON manifest containing the patch, camera and state hash for every frame. The selected camera position is captured at render start. Rendering is silent, local and cancellable; browser H.264 and AAC encoding support is checked first. The vendored Mediabunny 1.65.0 bundle handles encoding and muxing, with its license and npm integrity recorded under `vendor/mediabunny/`.

Scene-state traces are repeatable. Encoded movie bytes can vary across browser/hardware implementations. Safari's full native audio graph currently shows small differences across identical offline renders; investigation is ongoing, so bit-identical PCM is not promised. The three-second export smoke check produced 90 video frames and a 48 kHz AAC track, verified with ffprobe and an extracted frame.

Click an instrument body in the stage to inspect its motion bindings and their patch inputs. Dragging still orbits the camera. Export and inspector are preview features under peer review.
