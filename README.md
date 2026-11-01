# Imagimusic — Resonator Garden, Physical Tine & Bellows Choir

A playable study in giving synthesized sounds a visible anatomy. Astra and Fable are developing it together from Michael's [original idea](initial-idea.md), with an ongoing roadmap and reciprocal reviews.

## Play locally

Requires Python 3; no package installation or build step.

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Begin at [Listen, Play, or Rest](http://127.0.0.1:8080/welcome.html): three invitations into the sound/body studies. This lightweight entry prepares no audio or 3D scene until you choose a study, and sound starts with a play gesture. Each study explains its physical model and visual interpretation.

The original laboratory remains at http://127.0.0.1:8080. Click **Begin sequence**, click a garden resonator, or play **A S D F G H J K**. The physical tine uses **L**. **Quiet** fades all voices. Switching tabs stops the sequence. Space toggles the sequence outside controls; focused buttons keep their normal keyboard action.

## The shared 3D stage

Open [The Conservatory](http://127.0.0.1:8080/stage.html) for an ensemble passage on one 3D floor. Drag to orbit, choose a close view, or scrub the silent timeline. Use **Play this instrument in 3D** in the laboratory to transfer its current patch and seed into the stage. The transfer stays in this browser session; the direct stage link uses the default patch. Its plain score snapshots feed both live scheduling and the shared state bus. Stateless scene bindings permit reproducible seeking. Three.js 0.187.0 is vendored locally with license and verified package integrity; no installation or CDN is needed. WebGL2 is required for this preview; the 2D laboratory remains available.

Enable **Include Tension Loom** on the stage to add its coupled pair to the ensemble. Eight alternating strikes follow the shared tempo and seed. In the study, **Play this Loom in the ensemble** carries your frequency, coupling, detuning and loss into a reproducible URL; the stage’s study link carries those settings back for editing. Sound preparation is cancellable, and playback starts every instrument on the same audio clock. The movie manifest saves the separate composition settings; the artifact verifier rebuilds the composed scene from them.

## FM tensioner study

Open [FM tensioner](http://127.0.0.1:8080/tensioner.html). Explore slow vibrato, metallic and bell-like starting points, then change carrier pitch, modulation ratio, index and decay. Play renders the complete tone from the integrated-frequency model; Silent study samples the same envelopes at an exact time. Save WAV exports mono PCM16. **Save sound settings** and **Load sound settings** keep the exact FM parameters in a local JSON file; **Link to this sound** reopens the same settings without auto-playing. **Play this sound in the ensemble** transfers the exact settings to the Conservatory, where **Include FM tensioner** adds one featured tone eight beats into the score. The stage can combine it with the Loom; playback, silent seeking and movie export use the same composition. Fast modulation is a static disc; phase rotation is shown only below 8 Hz. The string halo is an estimated bandwidth display, and the linkage is interpreted, not a physical tension simulation. Click a part or choose an inspected parameter to see its current source value, mapped scene value, formula and sound settings.

Safari's downloaded default metallic WAV was byte-identical to an independent model render: 663,145 samples at 48 kHz, peak 0.189897, final sample zero (renders/fm-tensioner-metallic.wav). Alias screening is a heuristic; equivalently filtered 4×-rate comparisons cover four specified cases (default at 48 and 44.1 kHz, slow modulation, and a near-screening-boundary setting). Passband RMS residuals range from about −154 to −87 dB relative to signal over the tested interval; this does not establish an alias-free guarantee for every sound.

## Tension Loom study

Open [Tension Loom](http://127.0.0.1:8080/loom.html). Strike either body or use **Play conversation** for eight alternating strikes with overlapping vibrations. Coupling changes both normal modes; zero coupling leaves the unstruck body silent. Detuning changes the exchange. Each stereo channel picks up one body's displacement, with a shared pickup scale for the scored passage. **Save stereo WAV** saves the full selected strike or conversation. **Silent study** scrubs the selected response without sound; Quiet returns the bodies to rest. Its seven declared scene bindings drive the same reusable bodies at every timestamp. Click either body, striker or bridge to inspect the value driving it; the parameter menu also exposes each body’s glow.

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

Laboratory WAV exports are mono PCM16; the Loom study exports stereo PCM16. Garden and tine render at 22.05 kHz and omit live stereo placement and the preview compressor. These are procedural renders, not recordings of manual performance or edits. The Conservatory also exports an MP4 with a separate trace manifest, using its shared score, state bus and procedural camera. Repeated default, air-choir and three tested Loom arrangements are bit-identical on Safari 26.6.2 at 48 kHz for seed 731. This is a verified setup, not a cross-browser or codec-byte guarantee; see decision 004 and the export validation notes.

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

Scene-state traces are repeatable. Encoded movie bytes can vary across browser/hardware implementations. Selected Safari offline-render fixtures now produce identical repeated Float32 PCM, including the default ensemble and featured FM with Loom. This is scoped fixture evidence, not a promise across browsers, settings, or live playback; see [export validation](collab/notes/movie-export-validation.md). The three-second export smoke check produced 90 video frames and a 48 kHz AAC track, verified with ffprobe and an extracted frame.

Click an instrument body in the stage to inspect its motion bindings and their patch inputs. Dragging still orbits the camera. Export and inspector are preview features under peer review.

## Three-part conversation

In the Conservatory, choose **Three-part conversation** under Passage. Tempo, Character (Calm, Bright, Restless), and Density regenerate a saved score with opening, exchange, and release sections. Density removes optional events while preserving anchors and their timing. The seed comes from the current score, or from the instrument patch when first switching out of Seeded study; the Seed field lets you reproduce a variation, and New variation advances it. Seed changes shade velocities and the first Loom body; Character changes the musical motif. Loom and FM remain independently selectable. The section/bar readout follows playback and silent seeking.

The link carries the complete score and preserves it through either instrument study. Movie manifests include that score and the effective seed and tempo so verification reconstructs the authored entrances. The legacy Seeded study remains available. Three generated presets passed repeated-audio checks at 44.1 and 48 kHz in Safari, with final 500 ms settling additionally checked at 48 kHz. The 65-second calm conversation movie verifies all 1,960 scene hashes; the silent [scene parity harness](tests/stage-parity.html?conversation=1&loom=1&fmEnabled=1) compares animation-clock frames and attack, ending, and section boundaries against reverse replay on a fresh scene.

The inspector also names active authored events, their section and beat, and anchor/weight status. A verified local movie is available at `renders/conservatory-conversation-731.mp4`, with its canonical score manifest alongside it.

For the conversation, **Follow the score** now opens wide, follows the exchange more closely, and pulls back during the release. Camera motion is analytic and seekable; it changes framing only. The saved movie above is the earlier manual wide-shot baseline.

Open [the listening room](audition.html) to compare the verified seeded study and conversation recordings. Starting one pauses the other; the conversation offers fixed-wide and cadence-follow camera versions. This local page uses the ignored movie artifacts in `renders/`; regenerate the scoped plots with `node tools/audition-report.mjs`. The cadence-follow movie is `renders/conservatory-conversation-follow-731.mp4` with its matching manifest.

Open [the MIDI desk](http://127.0.0.1:8080/midi.html) to inspect a local Standard MIDI File (formats 0/1, PPQ timing, up to 256 KiB), or try its built-in triad. It shows note-bearing track/channel groups, pitches, key gates, parser warnings, ignored-message counts and the original-byte SHA-256. Tables are paginated; file data stays in memory in the browser. Choose an instrument for each track/channel, preview the exact/mapped/timing-only/omitted notes, then select **Use this mapping on stage**. Bellows preserves supported pitches and gates; the other families disclose their fixed-pitch or rhythm-only interpretation. Playback, silent seeking and MP4 export use the imported plan. Each transfer is saved under a separate browser-session key; its URL is not portable to another session. Assigned Loom/FM children are enabled, and absent children stay silent. Return to the desk to change assignments. It does not interpret MIDI 2.0 files.

**Musical orbit** adds a sixteen-beat camera arc, an eight-beat dolly breath, and restrained attention toward nearby entrances. It follows the passage tempo and reproduces its pose when seeking or exporting. The stage now uses a locally generated studio reflection environment, clear-coated resonator shells and a subtle floor roughness texture. These are surface/lighting interpretations; they do not change the sound model. Existing recordings retain their earlier appearance.

## Between two voices

Open [the listening studies](http://127.0.0.1:8080/listen.html) for a quieter first encounter with the Loom: three short passages using the same authored gestures with different coupling, detuning and loss. Listen, pause, seek, or save the complete stereo WAV. The selected study is in the URL; opening it never starts sound. A Still camera option stops camera travel and is the default when the system requests reduced motion. The instrument continues to show its response envelopes. Explore this instrument carries the selected physical settings into the Loom workbench.

The score begins with left-side strikes, delays the first right-side strike, brings the gestures together, and lets the response settle. These are artistic choices, not claims about a listener’s consciousness. The sound uses the existing two-mass spring model; visible shapes, glow and amplified envelopes remain interpretations. Safari’s downloaded Close kin WAV matched an independent 48 kHz render byte for byte (1,538,705 stereo frames); subjective musical appeal remains open to listening.

Open [the expressive bodies study](http://127.0.0.1:8080/expressive.html) for a 23-second composition with independent per-note expression, plus three short note-lifecycle comparisons. Pause and seek to inspect each voice, or save the complete mono WAV. Symbolic MIDI 2.0 scores drive an existing subtractive Bellows graph and an interpretive body; no MIDI device is connected. Scores are compiled once and prepared locally before playback; playback uses the prepared buffer. Audio controls interpolate a 1 kHz schedule while visual inspection evaluates the analytic expression model.

Open [Touch. Listen. Answer.](http://127.0.0.1:8080/touch.html) to play the coupled bodies with held pads or F/J keys. Each gesture joins the ringing system; the output gain remains fixed. Quiet records a short ending fade. Save the stereo WAV or exact gesture JSON locally. Dense input is bounded for headroom, and captures allow 128 gestures over two minutes. Changing connection or choosing New passage replaces the current capture. The saved mix uses the same cached unit impulses as live playing; this touch record is not yet connected to movie export or file import.

Open [The Grove](http://127.0.0.1:8080/grove.html) for three procedurally shaped, connected bodies. Choose one of three seeded groves, hear its authored greeting, then hold and release the visible bodies, the numbered pads, or A/S/D. A pale ring marks a pending gesture; drag empty space to turn the view. The shared mass-and-spring network generates both the displacement pickups and the displayed envelopes. Shell volume follows mass; shell proportions, support and materials are artistic interpretations. Save a local stereo WAV and complete grove/gesture JSON. Captures are bounded as on the touch page; record import is not yet connected. After Quiet, **Make a film** renders the finished passage locally at 720p/30 fps with the current camera angle in landscape framing. Preview the result and separately save the MP4, exact saved WAV, and reconstruction file; cancellation preserves the passage. Browser verification: `tests/grove-audio.html`; evidence and limitations: `collab/notes/grove-validation.md`.

For the local Grove voice comparison, run `node tools/grove-voice-compare.mjs` and open [A voice taking shape](http://127.0.0.1:8080/grove-voices.html). It compares the current voice with a coupled beam-partial proposal using generated WAVs and the accompanying measurement report. Files stay under ignored `renders/`; the page reports missing artifacts when they have not been generated. Only one voice plays at a time. The comparison does not change the playable Grove.

The Grove also offers **With partials · exploration**, or open [the optional playable voice](http://127.0.0.1:8080/grove.html?seed=3&voice=partials). Three strike zones change the excitation of coupled beam-family partials; touch toward a lower bridge for the modeled tip, or choose a position for the pads and keyboard. Original remains the default. Both voices support Quiet, Listen back, local WAV and gesture capture. The richer voice prepares nine stereo responses and uses additional memory; the pictured shells are artistic controls, not simulated shell acoustics. Browser audio checks: `tests/grove-voice-audio.html`; measured evidence and limits: `collab/notes/grove-playable-voice-validation.md`.

Grove movie verification: `node tools/verify-grove-movie.mjs path/to/manifest.json path/to/movie.mp4 path/to/soundtrack.wav`. Source PCM hashes and recorded model-frame hashes are distinct from lossy AAC and rendered pixels. Browser prototype and cancellation harness: `tests/grove-export-smoke.html` (add `?cancelAtFrame=9` for a deterministic mid-render abort). Evidence and limitations: `collab/notes/grove-movie-validation.md`.

[Rest · exploration](http://127.0.0.1:8080/rest.html) adds held damping contacts to the Grove's richer model. Tap shells or A/S/D to strike; choose Rest a hand and hold a shell, hold a Rest pad, or hold J/K/L, then lift. Light/Firm and three zones change contact. Show me a passage introduces the gesture through a 20-second invitation on the same live route. Quiet finishes capture; save local WAV/JSON or begin another. Manual strikes use one gentle strength. The contact is a linear viscous damper without pressure sensing or hand mass; shells remain artistic geometry. Listen back replays the saved sound and a worker-prepared model picture. Make a film renders the recorded Rest passage, including held-contact rings, at 720p/30 fps with separate soundtrack and reconstruction downloads. Use [Return to a passage](http://127.0.0.1:8080/reopen.html) to reopen a saved Rest gesture JSON on a separate local replay page. It reconstructs the saved sound and sampled model picture, starts only when Listen is chosen, and can save the reconstructed WAV. Failed or cancelled file preparation preserves the previous reopened passage. Reader limits: finished version 2 records, 256 KiB, 8–96 kHz, and the live 25 ms Quiet fade. Limits: 128 strikes, 256 contact starts, 120 seconds. Browser host check: tests/grove-contact-live.html; shared-engine checks: tests/grove-contact-audio.html; evidence: collab/notes/grove-validation.md.

After Quiet in Rest, **Carry the gesture** lets you explicitly choose another curated Grove and hear its response to your finished passage. The comparison preserves gesture coordinates, strengths and timing, reports any strikes the target cannot accept, and offers separate sound, gesture and film downloads named with both seeds. The original capture and its controls remain available. Cancel preparation keeps the previous comparison. A new passage or a Grove change clears the comparison. **Follow a gesture** provides optional guidance driven only by accepted strikes and contacts.

On Grove and Rest, film previews and Listen back take turns; Quiet stops either. Save film files before starting another passage or changing Grove (or Voice on Grove): those actions clear the local preview and its download links.

Grove and Rest keep replay, saving and film controls out of the first encounter. After Quiet finishes a nonempty passage, those actions appear below the body pads; Rest also reveals its alternate-Grove comparison. Beginning another passage hides them again.

Offline powered-body evaluation artifacts, when rendered locally: [source and contact](http://127.0.0.1:8080/renders/forced-study/) and [Where you touch](http://127.0.0.1:8080/renders/place-study/). The latter includes a matched-coefficient position pair, original reference contacts, exact source timing and model measurement plots. These are audition studies, not live controls or claims of perceived quality. Reproduction: `collab/notes/astra-place-audition.md`.
