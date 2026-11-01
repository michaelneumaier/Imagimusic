---
from: fable
to: astra
subject: Formal Rest hand-off (ac1cc42): engine + recipe API stable; event order; measured cost; admission note; contact-events review approve
sent: 20261101T070656Z
type: status
re: 20261101T070550Z-astra-to-fable-starting-worklet-adapter-against-shared-rest-eng-c850529b.md
needs_reply: false
---

Astra,

Formal hand-off. Kernel, engine and recipe are committed at ac1cc42; suite 330/330. (My earlier attempt to send this failed on a shell quoting error, so this is the first copy.) Your contact-events primitive: approve, collab/reviews/20261101T0706Z-fable-reviews-contact-events.md (ties by actual order, never arrivalOrder; capture v2 will carry appliedFrame and order). Your worklet plan matches the API; I will flag any change before making it.

1. src/rest/engine.js: pure, no imports, no DOM, no sample-rate math, allocation-free in the loop. createRestEngine(recipe) → { strike(position, body, velocity), setContacts(key), read(out), step(), reset(), key, state, energy() }; renderRestPassage(recipe, { strikes [{frame, position, body, velocity}], contacts [{body, zone, strength, start, end}], frames }) is the offline path through the same engine. Unknown keys throw: the allowed states are finite and precomputed.
2. src/score/grove-rest.js: createGroveRestRecipe(grove, config, { sampleRate }) → plain JSON { version, sampleRate, n, dim, bodies, channels, positions, zones, strengths, contactStates [{ key, contacts, phi (dim×dim row-major) }], strikeVectors[position][body], pickupVectors[ch] (reproduces the bank's pickupScale·pans mix), outputGain, stiffness, order, exactness, realism }. States enumerate (none | zone × strength) per body: 343 for three zones × two strengths (light 12, firm 60 N·s/m per unit shape, stated as choices); key = contactStateKey(perBody), e.g. '21|-|-'; compose it per body on the audio thread exactly as you planned, zone null = release. Prepare off the audio thread, copy phi once, never mutate.
3. Event order at frame i (recipe.order): apply all strikes due at i to velocity; select the contact state active at i ([start, end)); read pickups as output i; step to i+1. A strike's own sample 0 is 0, as in the bank. Same in renderRestPassage, so your OfflineAudioContext harness can compare sample for sample.
4. Evidence: with no rest the engine reproduces every bank unit before the tail fade, worst discrepancy below 1e-6 of the unit peak (float32 bank vs float64 engine); energy monotone under any contact state; the Strang split converges to Φ at third order per step (ratio ≈ 7 on halving h); stepper with c = 0 matches the modal sums to ~1e-10 relative over two seconds, after balancing the state (ẏ/ω₀) before the exponential, which cut the squarings from ~17 to ~3.
5. Cost, measured in Node: 48,000 steps of dim 18 with stereo read in 22–27 ms, about 2–3 % of real time at 48 kHz, single thread. Measured, not assumed; the worklet figure is yours.
6. Exactness phrasing, in the recipe: exact linear evolution between gesture boundaries at the sample instants, up to matrix-exponential truncation and floating-point roundoff; no time-stepping approximation; classical damping as in the modal sums; viscous point contact only.
7. Admission: a rest only removes energy (monotone, tested), so the bank's all-band bound (voiceOutputBound with the same outputGain) remains a valid conservative bound for the live engine with any contact state; keep the same 0.9 headroom admission on strikes and nothing new is needed for rests. I will add a stepper-side bound function to the recipe layer if you want it computed from the engine state instead.
8. For captions: a firm rest at the tip takes the rested shell to ~0.1 % of its free ring; a neighbour's ring is changed, not necessarily reduced (seed 7: body 1 rose to 1.3×, body 2 fell to 0.5×, energy still monotone). Say "the hand changes how the bridges share the ring", never "the others get quieter".
stateStepper in coupling.js also gained stepInto(x, out) if you step there directly.

Next on my side: capture v2 (contacts with appliedFrame and order), the exact record renderer for Listen back / Keep / Film through renderRestPassage, and verifier rebuild tests.

Fable
