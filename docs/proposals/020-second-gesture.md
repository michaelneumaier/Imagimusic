# Proposal 020: The second gesture

*Fable, 2026-11-01, answering Astra's question: where does the instrument invite a second meaningful gesture after its first ring? Two answers, one measured and ready to audition, one a bounded experiment on a new axis. Neither adds a panel, a random visual or a claim about consciousness.*

## A. Within today's vocabulary: the neighbour strike, timed against the beat (measured)

Every curated grove tunes its two lowest coupled modes a few hertz apart, so one strike beats slowly (periods 0.41 s on seed 3, 2.46 s on seed 7, 0.44 s on seed 11). A second strike on the bridged neighbour adds to or subtracts from that beat depending on when it lands. Measured with `measureSecondStrike` (struck shell's low-band motion at its pickup, 1 s after the neighbour strike, relative to the single strike; relative amplitude, not loudness):

| seed | beat period | consequence of timing across one beat | whole stereo swing |
|---|---|---|---|
| 3 | 0.41 s | −1.4 … +1.4 dB | +2.4 … +5.1 dB |
| 7 | 2.46 s | 0.0 … +3.6 dB | 0.0 … +9.5 dB |
| 11 | 0.44 s | −1.5 … +6.4 dB | −2.9 … +5.6 dB |

So the instrument already answers a *when*, not only a *where*: on seeds 7 and 11 the same two gestures differ by 4–8 dB in what remains, by timing alone. This is a genuinely different encounter from the hand (which changes the system): it is the player's rhythm meeting the instrument's own slow rhythm.

**The encounter, authored in one line, no panel:** after the ring step of the guide, "Let this ring. Strike its neighbour on a swell, then on a dip, and keep what remains." The swell and dip are visible already: width and glow follow the low-band envelope, which is the beat.

**Honest evaluation:** (1) `composeSecondStrikeRecord(recipe, delay)` at the measured best and worst delays per grove gives six two-strike records; Astra's listening-study tool renders them at natural level; (2) Michael listens blind to the pairs and says whether a difference is audible and whether it is musical; (3) only if yes does the guide gain the line, and the model text gains one sentence ("a second strike can add to or cancel part of the beat, depending on when it lands"); (4) the measured table goes in the validation note as what the pairs contain, not as what is heard.

## B. A new axis: sustained excitation with an explicit force law (bounded experiment, not production)

Everything in the instrument decays; nothing can be held in sound. Sustain is the second gesture the instrument does not yet have, and it is on the right axis: the person supplies energy continuously, then leaves the bodies to answer. The honest way in is an explicit force at a point, applied to the same exact linear model:

- **Kernel.** With forcing the step is x ← Φ x + Γ u, where Γ = ∫₀ʰ e^{Sτ} dτ · B is the zero-order-hold input matrix for a unit force on one body at position u (computed once per sample rate beside Φ, by the same exponential), and u is the force sample. The linear evolution stays exact; only the input is new.
- **Force law, stated.** A bow: the player's pointer speed along the shell is the bow velocity v_b; the force is friction against the shell's velocity at the touched point, f = F_N · μ(v_b − v_point) with a smooth friction curve μ(v) = sign(v)·(μ_d + (μ_s − μ_d)·e^{−|v|/v₀}), the textbook stick-slip form, with F_N, μ_s, μ_d, v₀ as stated constants, no claim of hand or hair realism. It is nonlinear only in the input term; the state step is unchanged.
- **Admission.** The energy ceiling is state-based (|out| ≤ G·√(2E)·f holds whatever the input), so the rule becomes: the bow lifts (f = 0) whenever the next step would carry E past the ceiling's energy; stated as "the instrument will not take more", never a limiter on the output.
- **Record.** Continuous input is a sample stream, not events; a bowed passage is kept as the force samples at the audio rate (or the pointer path at a stated rate with a stated interpolation), so rebuild stays exact and the verifiers unchanged in kind.
- **Bounded experiment, offline only:** implement Γ and the friction law in the pure layer; render a bowed stroke on one body of each grove (2 s of bow at three speeds); measure whether a sustained tone appears (the low-band envelope's steadiness), its pitch relative to the partials, the energy input per second, and that the ceiling is never crossed; produce audition files with Astra's tool. No page, no worklet, no production change until the sound is heard and judged.

## Order
1. A now: audition pairs from the measured delays (Astra's tool), listening by Michael.
2. B as a pure-layer experiment with measurements and files; design note by Astra tying it to the gesture vocabulary; decide after listening.

## Not in scope
No new panel, no animated target, no automatic sound, no claims about what the listener feels.
