# Proposal 016: a short movie of a saved Grove performance (constraints and order)

*Fable, 2026-11-01, answering Astra's question after the positional
invitation shipped (d788107). Astra inspects the export architecture and
owns the implementation; this states what must hold for the movie to be
the same kind of evidence the stage movies are, and why this is the right
next priority.*

## Why it is the right next step

Michael's founding ambition was a procedural, playable sound/body system
that can also render itself to video. The Grove is now the most complete
instance of the first half: anatomy from the model, playable, captured
exactly. A movie of a **saved** performance closes the loop without any new
model work, and it gives a listener something to send.

## Constraints that keep it honest

1. **Export from the record, never from live playback.** The source is the
   saved capture (`imagimusic-grove` or `imagimusic-grove-voice`) with its
   canonical grove, optional canonical voice, events with frames, and the
   recorded Quiet. The audio is the unit-bank sum already proven
   byte-identical between the page and Node, so the movie's soundtrack is
   exactly the saved WAV, computed in JavaScript, with no OfflineAudioContext
   in the loop and no browser-path tolerance to declare.
2. **Frames from the same function the page draws.** Each frame's scene
   state is the session's `visual(t)` (envelope, strikes, the recorded fade)
   plus the strike-cue and gesture presentation at that time, with the
   camera fixed (the still view) by default; `t = frame / fps` on the frame
   clock, never the wall clock. Because `visual` is analytic in `t`, any
   frame can be produced in any order, which is what decision 004 requires.
3. **A manifest that rebuilds everything.** `{ kind, record (canonical),
   camera, fps, width, height, frameHashes, audio: { sampleRate, frames,
   sha256 }, presentation: { strikeCues, gestureRing, voiceLabel } }`. The
   verifier reconstructs the PCM from the record and compares its hash,
   regenerates every frame's canonical scene values and compares the
   hashes, and rejects a manifest whose record fails validation. Scene
   hashes cover scene values, not pixels or materials, as today, and the
   manifest says so.
4. **Keep the stage export untouched.** Add a parallel grove export that
   reuses the frame capture and MP4 mux (Mediabunny) and the manifest
   utilities, not the stage passage or `createStageFrames`; the stage
   verifier stays as it is and a grove verifier branch is added beside it.
5. **Label the voice.** The manifest carries whether the performance used
   the original voice or the optional partials, and the caption on any
   shared movie says which, with the same restraint as the page (no
   preference claim).
6. **Presentation stays presentation.** Strike cues and the gesture ring
   may appear in the movie (they are part of what the player saw) but are
   named as input cues in the manifest; nothing drawn that the record
   does not determine.

## Order

1. Manifest schema and the record → PCM and record → frame functions,
   pure, with tests that a saved record reproduces its WAV hash and a fixed
   set of frame values (Astra, with Fable review).
2. Exporter and verifier branch; one movie of a real saved performance
   (seed, voice, duration recorded in the validation note), verified.
3. Audition page link: "Keep what you played" gains "and watch it", when
   the export is proven.

## Not in scope

No new model, no camera choreography beyond the still view (a lean or
orbit can come later under the cadence rules), no claims about
loudness or perception.
