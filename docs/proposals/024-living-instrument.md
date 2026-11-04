# Imagimusic flagship experience plan

*Proposal 024 · Astra for Michael · 2026-11-03 · Working title: The Living Instrument*

**Make a gesture. Discover the body it wakes. Let your phrase become a world you can play, change, and keep.**

Build one beautifully composed experience around that promise. The visitor begins close to a single instrument. Their own short phrase becomes the thread through a growing ensemble, a journey inside its sound, and a return to the original body. Changes to the instrument have audible consequences; the finished encounter can become a film and a playable keepsake.

The ambition is to make composing, instrument design, and exploring a musical place feel like parts of the same act. The immediate job is a convincing first encounter. The longer research horizon is a system that invents playable structures for a musical intention, then composes and stages performances around their possibilities.

## What the work has taught us

At this proposal’s initial checkpoint, the project had accumulated 41 catalog entries and a substantial set of reusable mechanisms; its regression checkpoint passed 784 tests. The current implementation checkpoint is recorded below. Those checks establish important mechanical and software behavior; they do not establish that the overall experience is beautiful, immediately understandable, or worth returning to.

| What exists | What it makes possible | What still needs integration |
| --- | --- | --- |
| Geometry-derived tine with modal mass, accepted live impulses, signed state and interval statistics | One gesture can produce both a sound and a traceable spatial response | A compelling sound and a finished three-dimensional body, presented together |
| Grove, Loom and Rest coupling, damping and passage records | Play can reveal relationships and let silence have a physical cause | A unified encounter; coupling between the current spatial tine models is new work |
| Preserved gestures, alternate-body auditions and derived returns | A phrase can keep its identity while its instrument changes | A transformation that reads as one musical journey |
| Procedural performers, camera direction and verified movie prototypes | A performance can be staged and kept as a film | Art direction, expressive choreography and a new flagship export adapter |
| Synth mechanisms, expressive scores and inverse studies | Richer voices and multiple possible interpretations of a sound | Clear family boundaries; arbitrary sound-to-geometry remains research |

The most valuable discoveries are continuity and consequence. A small change matters when a listener remembers what came before. A return matters when it restores something they made. An explanation can deepen the mystery when it reveals that an unexpected movement belongs to the sound.

Our next major investment should bring these discoveries together. Existing studies remain the laboratory and reference library; the flagship gets its own focused entrance.

## The first encounter

The following is a proposed three-to-five-minute experience, with a shorter watch-only route. Times describe a storyboard, not a countdown imposed on the player.

**An object waits.** A carefully lit resonant structure occupies a quiet space. Its form suggests where to touch. One invitation says “Touch to begin.” Sound begins only through a deliberate action. A nearby “Hear it first” option plays a short authored greeting for someone who prefers to listen.

**A touch has a life.** The gesture makes an immediate sound. The point of excitation is clear; a restrained reading of vibration reveals where the body responds. A second touch joins the first ring. The camera holds long enough for the visitor to notice that the instrument continues between gestures. No score, instructions panel or parameter grid competes with this moment.

**A phrase becomes recognizable.** The visitor can keep a few touches as a phrase, without quantization by default. The exact original remains available. A lightweight invitation offers “Let it answer.” The system proposes a clearly distinct response using the phrase’s actual timing and the instrument’s available voices. It leaves space for the visitor to answer again. Authored fallback music supports people who do not wish to perform.

**The instrument opens.** Choosing “Unfold” reveals a small family of related bodies. The phrase returns through them with deliberately composed changes of register, articulation and space. A long blade gives one part of the motif a different voice; a shorter body answers. New parts are introduced when they become musically relevant. The visitor can interrupt, return to the original, or keep playing. This is the principal reveal: their small action now has an architecture they recognize and can influence.

**The listener can enter the sound.** “Look closer” offers a calm movement from the whole body toward its vibrating structure and then a clearly identified modal reading. The sound continues on the same timeline. A separate optional presentation can gather a phrase into a spatial memory, so recurrence becomes a place the visitor can explore. Returning restores the grounded body view and familiar orientation.

**The world folds back to the first gesture.** The ensemble settles. The opening body and the visitor’s phrase return with enough silence to hear them differently. The person can play again, keep the playable encounter, or render a short film. The ending is part of the composition, not a results screen.

## The artistic direction

Begin with a tangible object: fine metal blades, dark ceramic supports, a few warm joints, and air around it. Use a coherent material vocabulary with contact shadows, deliberate silhouettes and a readable scale. Material appearance is artistic unless that material is part of the sound model. A beautiful glass-like surface must not quietly imply simulated glass acoustics.

Give the environment a memorable spatial idea: a small suspended instrument whose supporting architecture gradually reveals room for an ensemble. Avoid a field of identical objects. Each introduced voice should have a recognizable form, location and musical role. A camera should often remain still; movement earns its place by revealing a relationship or changing the listener’s perspective.

The sonic identity deserves equal authorship. Curate a small range that is compelling in dry playback, with quiet details and controlled contrasts. Optional space processing can provide intimacy or scale, labeled as an audio effect rather than inferred room acoustics. Preserve dry reconstruction for inspection. Evaluate tiny speakers and headphones separately; loudness alone must not make a comparison seem better.

Michael’s spirituality and psychedelia direction can live in the structure of the experience: attention, participation, recurrence, a shift of scale, and return. The person moves from making a sound to recognizing themselves in an unfolding pattern. That is an artistic invitation, with room for playful, unsettling, intimate or contemplative readings. It does not require sacred symbols or a prescribed emotional outcome.

Keep perceptual presentation named and reversible. A stable view remains available throughout. Explanatory detail belongs in “Look closer,” while the main encounter uses direct language and clear actions. Keyboard access, reduced motion, visual focus and an always-available quiet control are part of the composition from the beginning.

## The technical idea that can grow beyond this encounter

The long-term core is a **playable anatomy**: a structural model that determines sound, exposes meaningful places to act, and supplies the state needed to depict its behavior. A musical phrase is a separate object that can inhabit several anatomies. A director reads the resulting performance and chooses how to reveal it.

```text
Body design + accepted gestures → mechanical performance → sound
                                           ↓
                              spatial and modal observations
                                           ↓
                            body, performers and camera

Saved phrase → another admitted anatomy → a distinct, returnable performance
```

Keep four identities explicit: the body, the visitor’s original phrase, a proposed arrangement, and the presentation. A new arrangement must not overwrite the visitor’s phrase. A visual treatment must not alter source sound. A structural change must rebuild the sound-producing model, not merely stretch the picture.

For the first geometry-based scene, a family of independent tines can share a composition without pretending they physically exchange energy. A later compliant-bridge model could connect their modal coordinates, using the coupling work as a reference. Only then should the picture show mechanical transfer through those bridges. This is a substantial modeling milestone, not an aesthetic wiring task.

Structural transformations initially occur at clear phrase boundaries. A ringing old body remains visible and sounding until it ends; a new body begins its own admitted state. Seamless deformation while a body rings needs a separate treatment of state transfer and work supplied by the deformation. Crossfading sound while displaying one continuously changing physical body would obscure that distinction.

At display rate, high-frequency vibration needs an explicit spatial observation: energy, sampled displacement statistics, or a dedicated slowed inspection. Audio presentation time, source frames, display time and export time require a tested mapping. Live gestures receive immediate acknowledgment; anticipatory performer motion belongs to known future score events and cannot precede an unpredictable human touch truthfully.

The first flagship remains local and uses the established browser stack. Reuse validated model math, records, deterministic rendering and performer planning behind small adapters. Do not assume current page-specific record formats or movie verifiers already support the new experience. Add a flagship recipe only after the first encounter establishes which choices actually need preserving.

## Build toward a memorable proof

| Milestone | Concrete result | What decides the next step |
| --- | --- | --- |
| 1. Compose the reveal | A 60–90 second audio sketch, six scene boards, and one finished still of the opening body | The phrase remains recognizable through the transformation; sound and silhouette are worth developing before adding controls |
| 2. Finish one playable minute | One polished three-dimensional body, direct touch, visible consequence, quiet, and exact replay in a single scene | A newcomer can start, stop, play and recognize their replay without an explanation; investigate unwanted timbre, latency and visual ambiguity before expanding |
| 3. Let the phrase unfold | Three deliberately chosen bodies, one proposed answer, one ensemble reveal, and an immediate route back | The visitor recognizes their contribution and can distinguish playing, arranging and changing the body; surprise survives repeated visits |
| 4. Make one world returnable | A saved recipe, reliable reopening, optional close view and short film export | Reopening preserves the encounter; video and audio use the declared performance timeline; cancellation and failure preserve the original |
| 5. Extend the physical vocabulary | A tested coupled spatial body or a carefully scoped second family | The added mechanism produces a musically useful relationship that the visitor can hear and affect; it earns its complexity |

Work on sound and appearance together in the first milestone. Compare a small number of deliberately different artistic treatments around the same phrase, then commit to one. A polished minute is the first release target; the larger journey grows from that successful scene. Keep experimental alternatives in the laboratory rather than placing all of them in the flagship menu.

For the first slice, limit the vocabulary to one model family, a few curated body designs, touch dynamics, one response, and one way to transform the phrase. Do not depend on arbitrary recording inference, microphone input, accounts, social features, many skins or an unlimited procedural universe. These can be future extensions after the core experience earns attention.

## What polish must mean in practice

The opening must communicate where to act. Every gesture needs consistent visual acknowledgment and audible behavior; the existing system’s accepted sample timing does not prove hardware latency. The scene must remain legible on a small screen, and a still camera must remain a complete experience.

The first sound should be intentionally designed, with useful dynamics and a satisfying decay. The reveal should be musically composed, not generated by multiplying objects. Empty, sparse and repeated input need graceful outcomes. A listener who chooses not to play should still encounter a complete piece.

Every return must be dependable. Keep the original through failed comparisons, cancelled renders and scene changes. Clearly distinguish a playable recipe, a sound recording and a film. Asset loading, unavailable audio devices, background tabs and reduced performance need finished behavior rather than raw errors.

Use a small formative evaluation before broadening the experience. Observe whether several newcomers can enter, make a phrase, transform it and return unaided. Ask what they thought was happening, which moment they would show someone else, and whether they want another turn. Record their language and disagreements. These sessions guide revisions; they cannot certify universal appeal. Numerical tests continue to protect the mechanics underneath.

## Research with the greatest potential

Three research directions could make this more than a well-presented instrument. **Design through listening:** preserve a phrase while searching for bodies that satisfy a specified change in pitch, decay or brightness. Begin with the bounded geometry family; present alternatives rather than a uniquely recovered object. **Composition through structure:** generate musical responses from the actual resonances, couplings and playable regions of an anatomy. **Performance as a spatial object:** keep the gesture, instrument and staging together so a musical moment can be revisited, reinterpreted and played into again.

These directions reinforce each other. A person changes a body, hears a new possibility, receives a musically appropriate response, and keeps the result as an inhabitable performance. The flagship gives that larger research program a concrete experience to serve.

## Current checkpoint and next creative milestone

The synthesis now has a working [local encounter](../../living.html): touch an 80 mm tine, replay the exact accepted phrase, hear it through 95 and 65 mm bodies, unfold it into three visible voices, return to the original, and keep a versioned address that reopens quietly. Camera movement and the magnified envelope are optional. The [project home](../../project.html) holds 43 catalog entries. The current full regression checkpoint passes 799 tests, including the recipe and film-source additions.

The [72-second sketch and six scene boards](../../renders/flagship-sketch/index.html) remain an authored artistic reference, with [score and storyboard](025-first-encounter-storyboard.md). The interactive scene uses the visitor’s own phrase. Its present answer is a fixed, staggered arrangement of three independent bodies. The visible response is a magnified modal displacement bound on a static body; it is not resolved high-frequency bending, acoustic radiation, or energy flowing between the instruments.

A reproducible film source package is now available through `node tools/prepare-living-movie.mjs`: the recipe, original-level stereo WAV, and a 1280×720, 30 fps frame-state manifest. `node tools/verify-living-movie-source.mjs` reconstructs its state and audio evidence. A separate [browser encoder fixture](../../tests/living-movie-browser.html) now produces a verified 15.1-second H.264/AAC film, with active-render cancellation and manual preview. Visitor-facing export controls now offer film, soundtrack, recipe and manifest downloads; a recipe file can reopen the encounter quietly. Float32 fingerprints identify a particular render; tiny cross-engine differences have been measured. The camera is canonical; manual orbit and visit listening gain are excluded. Implementation evidence lives in [the flagship notes](../../collab/notes/astra-living-instrument.md).

The next creative milestone is **one encounter someone wants to show another person**. Its central moment should be recognizable: “I made that little phrase, and now I can hear its shape in this place.” This is the artistic hypothesis to test. Reliable reconstruction makes the experience returnable; it does not establish its appeal.

### A composed reveal with a clear point of view

Use the same short phrase for three tightly bounded studies. Each study gets one sound treatment, one camera sequence, and one ending. Keep their source gestures identical so the comparison is useful.

| Study | Artistic question | Proposed treatment |
| --- | --- | --- |
| Intimacy | Does one object feel worth listening to before anything expands? | Close material detail, a held camera, dry attack and audible decay; leave space after the phrase |
| Recognition | Does the answer feel related to what the visitor made? | Introduce each alternate body on its first musical entrance, preserve a recognizable timing pattern, let the original anchor the response |
| Scale and return | Can a change of perspective make the familiar feel newly significant? | Reveal the ensemble gradually, hold the widest view through the response, settle back to the exact original with a deliberate silence |

These studies should refine one shared scene, not become three more flagship menus. Compare the authored fixture, a single touch, a crowded phrase, and widely spaced touches. A treatment that only works with the demonstration phrase is insufficient for a playable encounter. Preserve arrangement version1 for existing keepsakes; any changed score needs a new explicit version or a separate experimental renderer.

Spirituality can enter through sustained attention and the return to something personally made. Psychedelia can enter through a coherent shift in scale and the recognition of recurrence across bodies. Let the listener choose their interpretation. The visual direction should make those relationships perceptible before adding decorative complexity.

The first sound comparison is now available: [A little air around a phrase](../../renders/living-space-study/index.html) holds the authored encounter fixed while comparing dry, close and wider artistic reflections. Shared gain and exact settings make the changes inspectable; a listening preference remains to be established. The playable scene still uses its dry source.

The [visual atmosphere workshop](../../living-look.html) now compares warm studio, blue hour and pale morning at identical musical moments, with optional shared playback and PNG capture. Initial still inspection suggests a tradeoff: the pale support is easier to read while darker surroundings give the response veils more separation. This is an art-direction observation, not a visitor preference result. Production keeps the original look.

### Finish and evaluate the first minute

1. Maintain the completed keeping loop while refining the piece: visitor-bound film/source downloads, quiet recipe-file reopening and prior-result retention are implemented. Actual films and cancellation have been checked. A source-state hash does not verify pixels or lossy AAC.
2. Build the three artistic studies and choose a treatment by listening and watching. Evaluate the attack, decay, phrase recognition and ending together. Keep processing separate from the physical source and document any added space effect.
3. Simplify the entrance around Begin, touch, answer and return. The15.1second Hear it first greeting now gives a person who prefers to watch a complete authored arc; refine its musical and visual delivery alongside the visitor route. Keep Quiet reachable and make the still-camera route equally composed.
4. Observe a small group of newcomers using the encounter without coaching. Record where they act, what they think caused the sound, whether they recognize their phrase, which moment they would show someone, and whether they choose another turn. Their responses decide the next revision; do not replace them with test counts or an invented audience verdict.

The readiness gate is a complete, locally reviewable encounter: a newcomer can enter and stop it, their own phrase survives the reveal, the sound and image form a deliberate piece, a saved encounter reopens, and a film can be kept. Hardware latency, small-speaker listening and phone performance still need direct evaluation. Only after that gate should we expand into a second physical family or a coupled spatial body.

The larger ambition remains an instrument that can discover new playable forms with a person: preserve their musical idea, propose bodies with meaningful audible differences, and compose a world from those relationships. The first minute gives that ambition a concrete standard. Existing [VISION](../VISION.md) and [roadmap](../ROADMAP.md) contracts remain in force. Fable’s independent review is pending while they are unavailable.


### Next milestone: one encounter worth showing

The first-screen consolidation now puts the invitation, transport and whole opening body together at the checked390×656 and1100×656 viewports. Begin/Touch/Quiet behavior is preserved. This improves access to the instrument; it does not by itself deliver the promised sense of wonder.

The next reviewable artifact should be one directed encounter with a clear emotional arc: **attention → authorship → expansion → recognition → rest**. Its central question is whether the visitor can hear their own contribution inside the expansion and feel the return as meaningful. This is an artistic hypothesis to test, not an audience result.

Work in this order:

1. **Compose the answer.** Compare the current staggered round with one restrained alternative that leaves more space between entrances. Use actual visitor intervals, retain the untouched original at either end, and keep the alternative in an experimental renderer until it earns a versioned arrangement. Listen to whole phrases before optimizing individual sounds. The existing finite reflections study can inform a presentation choice after the arrangement is convincing.
2. **Direct attention.** Refine one opening silhouette and the first entrance of each body. Combine readable support surfaces with enough separation for the response veil. Evaluate the warm and pale workshop evidence in one consistent treatment; avoid adding a palette menu to the main encounter. Keep static-camera composition complete. A camera move should reveal a musical relationship.
3. **Finish the return.** Give the exact original room to ring, followed by a quiet invitation to play again or keep it. Check that the ending remains satisfying for a single touch and a crowded phrase. Keep technical explanations available below the experience.
4. **Review the whole encounter.** Keep a local film and playable recipe for each case below, alongside brief artistic notes and the known model limits. Then observe newcomers without coaching. Choose the next revision from their behavior and their own descriptions.

| Input case | What the directed encounter must handle |
| --- | --- |
| Authored three-touch greeting | Complete watch-only arc; clearly separate from visitor authorship |
| Single touch | A purposeful answer with enough silence; no pressure to produce more notes |
| Eight closely spaced touches | Distinct entrances and controlled density; original remains recognizable |
| Widely spaced touches | The visitor's timing remains apparent; gaps feel intentional |
| Quiet during expansion | Prompt gentle stop and intact original; another turn remains easy |
| Still camera on a narrow screen | Every active body remains legible; no essential meaning depends on movement |

The deliverable is one recommended artistic treatment, its local film/recipe evidence, and a short record of remaining weaknesses. Existing workshops stay accessible through the project home and model details. This milestone adds no new physical family, arbitrary recording inference, or sharing service. Those remain later opportunities once the first encounter is compelling.

The longer-term leap is **design through musical intention**: a person keeps a phrase and asks for a brighter, softer, stranger or more connected anatomy, then hears and plays the consequences. Our current alternate-body and inverse studies supply pieces of that path. Turning them into a coherent creative instrument still requires bounded design objectives, admitted models and direct listening evaluation. The first encounter should establish trust in that relationship before promising an unlimited world.


The first composition comparison is now locally playable: [A phrase with room to breathe](../../renders/living-answer-study/index.html). Four sources (authored greeting, single, crowded and widely spaced touches) each have the current round and an experimental spaced answer. Only entrance spacing and return time change; bodies, gestures, gains and panning remain fixed. The alternative uses max(800ms, touch-span +350ms), allowing decay overlap while separating gesture groups. Greeting duration changes15.1→17.5s; widely spaced source15.8→20.1s. The added time makes recognition versus momentum an explicit listening question. Exact source/score/file evidence accompanies the page. Production remains arrangement v1; preference is unresolved.


The visual synthesis candidate is now **Porcelain at dusk**, available in the existing workshop. It changes only the warm-studio support color to the pale ceramic used in the morning reference. Native390px opening and held-return inspection, plus two actual1280×720 PNG captures, show the arch separating more clearly from the dark field while the veil remains visible. Astra's art-direction recommendation is to carry this candidate forward, with blade-versus-support emphasis as the next refinement. This is a visual judgment, not audience evidence; production still uses its original presentation. Before adoption, keep live and exported presentation aligned and explicitly describe any presentation-version change.


The dusk candidate now includes broader steel reflections (render roughness0.48, environment multiplier2.4). Opening and held-return captures show improved blade presence alongside the pale support. It is the preferred visual candidate for integration. The next implementation step is a declared appearance identity shared by live viewing and film export, with legacy warm-studio recipes continuing to reopen coherently. This changes presentation only; the spaced musical answer remains a separate experiment.


Appearance integration is now implemented: fresh visits use Porcelain at dusk; strict recipe v2 declares presentation1 or2, while recipe v1 remains byte-shape compatible and selects Warm studio. Successful restore commits source and appearance together; film export selects the same presentation identity. Camera/reveal remain separate choices, and source sound/arrangement version1 are unchanged. Native warm/dusk address reopening and an actual presentation2 film are verified; keep refining the musical reveal within this clearer visual identity. The preserved warm source package still passes its original verifier.
