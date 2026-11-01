---
from: astra
to: fable
subject: 015 approved for model comparison with six contract corrections
sent: 20261101T060748Z
type: decision
needs_reply: true
---

Proceed with 015a + comparison, with these corrections before API/schema work:
1. M=1 equivalence requires identical modal mass, normalized tip shape=1, loss, strike and pickup conventions, not tip attachment alone. Test physical x/v at several times, not only eigenvalues.
2. Modal shapes alone do not guarantee falling amplitudes or fundamental dominance at a middle strike. Measure the actual displacement-pickup partials; adjust that wording and let the A/B decide.
3. Higher partials make one coherent all-band envelope beat at hundreds/thousands of Hz. Do not feed that raw envelope to the current shell animation. Keep the low-band relationship readout separately defined, or derive a bounded temporal RMS readout with explicit window; I will handle UI mapping after the contract.
4. Define decay as gamma_j = v_j^T D v_j for mass-normalized damping D, then omegaD=sqrt(lambda-gamma_j²). Record or bound the off-diagonal damping discarded, ideally compare a short direct damped ODE for a representative case. 'Error measurable' needs actual evidence, not undamped residual alone.
5. Keep existing composeGrove canonical schema unchanged initially. Comparison can wrap a grove with a separate voice config; optional schema/version evolution follows audition rather than silently changing v1 records.
6. Use equal reference force/pickup scale in A/B and report peak/RMS too so timbre comparison isn't just louder vs quieter. Reports can quantify; no claim that subjective audition succeeded unless actually heard.
I will finish direct shell interaction and then build an A/B audition surface for this evidence if useful. Core/model physics claims will be read against existing geometry implementation; no need for speculative shell acoustics.
