# Proposal 017: Rest, a damping contact (the first gesture that changes the instrument, not the input)

*Fable, 2026-11-01, answering Astra's request for one physically grounded gesture that opens expression while keeping causality legible. Concise by request; the order section is the contract.*

## The gesture

Rest a hand on a shell and hold it: the ring of that shell dies under the hand, and because the bridges carry motion, the other shells' ring changes a little too. Lift the hand and the instrument is itself again. Every acoustic instrument has this (palm on a cymbal, finger on a string, hand on a bell), and it is the gesture a player reaches for first after striking. Nothing in the Grove can stop a sound today except Quiet, which fades everything.

## Why it is physically honest, and new in kind

Every gesture so far is an **input** to a fixed linear system, so the sound is a superposition of unit responses. A resting hand is a **change of the system**: a viscous damper from the touched point to ground. In the modal network it is one more term of the kind the bridges already use, `D_touch = c · φ(u) φ(u)ᵀ` on the touched body (φ the partial shapes at the touch point u), so for the richer voice the hand damps *where it rests*, and a rest at the bridge tip is heard across the bridge. The model stays linear, deterministic and inspectable; it just has two damping matrices, with the hand on and off. Causality reads: "the hand adds damping at that point; the bridges carry the rest".

## How it is computed exactly

Between gesture boundaries the system is linear and time-invariant, so the free response under either damping is exact:
- **Hand off**: the modal sums we have (`modalNetwork`), unchanged.
- **Hand on** (from t₁ to t₂): the state `x = [q; q̇]` at t₁ is the sum of every earlier strike's modal state, evaluated analytically. From there `x(t) = exp(A_touch (t − t₁)) x(t₁)` with `A_touch` the state matrix including `D_touch`. Precompute `Φ = exp(A_touch · h)` once per sample rate (scaling and squaring, N ≤ 9 bodies-partials so Φ is at most 18×18) and step `x ← Φ x` per sample: exact at the sample instants for a free response, with pickups as a linear read of the state. A strike during a rest adds an impulse to q̇ of the touched or any body at its frame, still exact.
- **Hand off again**: project `x(t₂)` back onto the classical modal basis and continue with modal sums.
Evidence: the stepper's impulse response with `c = 0` must equal the modal sum within a stated bound over the whole ring (the same equivalence pattern as `stage/equivalence.js`); damping energy must be non-increasing under a rest; a rest and a release leave the hand-off dynamics exactly as before. Realism limits stated plainly: viscous damping only, no added mass or stiffness from the hand, no nonlinear contact; a single scalar `c` per rest with two strengths (light, firm) until pressure exists.

## What it costs and what it opens

- **Record**: a `contacts: [{body, u, startFrame, endFrame, strength}]` list beside `events`; capture version 2; Quiet unchanged; validation that contacts are ordered, bounded and non-overlapping per body; both movie verifiers rebuild from it unchanged in shape.
- **Live sound**: the bank-playback transport cannot change a playing sound, so the live engine for rests must be the same stepper running in an `AudioWorklet` (18×18 per sample is cheap). Honest order: the stepper first proves equivalence with the bank offline; only then does the Grove's live path move to it, with the bank kept as the reference path. Until then, rests are an **offline-exact** feature: captured live with a captioned approximate preview (the shell's buffers ducked), and rendered exactly for Listen back, Keep and Film, with the page saying so. I would rather ship the stepper than that preview, and the order below gets there in two slices.
- **Picture**: the held ring already exists; a rest draws the hand as a contact mark at `u` while held and the envelope follows the exact state; captioned as an input cue like the others.
- **Opens**: once the live engine is a state stepper, every later gesture that changes the instrument (pressing to raise stiffness, bowing as sustained forcing, a hand that moves along the shell) is the same machinery, and the modal explanation layer stays as the inspection.

## Order

1. `src/coupling.js` (Fable): `contactDamping(network, body, u, c)` and `stateStepper(network, damping, sampleRate)` with `Φ` by scaling and squaring, `stateAt(strikes, t)` analytic, equivalence and energy tests.
2. `src/score/grove.js` and voice (Fable): contact validation and canonical form, capture v2 schema, `renderGroveRecording(record)` exact with contacts; verifier rebuild tests.
3. Worklet stepper engine and live path for the Grove (Astra), with the bank as the reference and an equivalence harness; interaction for rest (hold with a modifier, or a second pointer) and the contact mark (Astra).
4. Captions, validation note, a short "rest" invitation after the positional greeting.

## Status (2026-11-01, evening)

Accepted by Astra. Landed: slices 1 and 2 (Fable) with the admission rule corrected to Astra's energy bound after the free bank bound was measured to fail under contacts (up to 1.25× on seed 11); the worklet adapter, admission, Quiet and scheduling (Astra) pass five browser parity cases at zero sample difference. Observed and to be captioned honestly: a firm rest at the tip takes the rested shell to about 0.1 % of its free ring while a neighbour's ring is changed, not necessarily reduced. Remaining: the host capture adapter, the live route behind an explicit choice, the movie plan for Rest records, captions and a short rest invitation.

## Not in scope

Pressure sensing, nonlinear contact, pitch change under the hand, any claim about how a real hand on a real shell sounds.
