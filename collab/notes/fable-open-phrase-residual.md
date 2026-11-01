# Residual ring at the hand-off of the open phrase (Fable, 2026-11-01)

Tool: `tools/measure-open-phrase-residual.mjs` (output in `renders/open-phrase-residual/`, ignored by git; rerun to reproduce). Measure: 100 ms fixed-window RMS of the low-band displacement at each body's virtual pickup, from the model state of the actual cumulative opening record, in dB relative to the window 100 ms after the first call on body 1 (body 2 relative to the window after its own first authored answer); window starts at exact record frames. Model response, not loudness; no hearing claim; no "best time".

## One cycle (the prototype), per curated grove
| grove | unit | low decay | before the final strike (b1 / b2 / b3) | 100 ms after it | expected entrance | one unit later | two units later |
|---|---|---|---|---|---|---|---|
| 3 | 0.81 s | 2.39 s | −19.4 / −5.5 / −5.9 dB | −1.0 / −5.7 / −2.2 | −8.1 / −7.4 / −0.7 | −2.0 / −8.3 / −8.8 | −7.0 / −11.9 / −7.0 |
| 7 | 2.46 s | 1.65 s | −36.2 / −22.4 / −33.5 | 0.0 / −11.0 / −15.7 | −14.0 / −26.9 / −25.4 | −12.5 / −23.4 / −29.8 | −25.0 / −49.2 / −49.1 |
| 11 | 0.89 s | 1.93 s | −0.9 / −1.0 / −3.3 | +4.9 / +9.3 / +4.9 | +4.1 / +5.0 / −0.1 | +5.5 / −1.1 / −3.1 | +1.8 / −7.6 / −7.3 |

What the numbers say, without saying what is heard (windowed-RMS extrema describe the model response; they are not hearing evidence):
- **Grove 3**: the return lands after its own body has decayed 19 dB but while both neighbours still ring at about −6 dB; so the second call overlaps the answer's ring, not its own. The windowed-RMS trace after the final strike alternates fast (peaks 0.1–0.2 s apart), because three beat rates mix; there is no single slow alternation at the authored unit.
- **Grove 7**: the unit (2.46 s) is longer than the low decay (1.65 s); by the return every body is attenuated 22 to 36 dB (not silence). Whether the opening is then heard as three separate events is a hypothesis, not a result; a second cycle exceeds the 12 s bound and is refused.
- **Grove 11**: everything still rings at the return (−1 dB), and after it body 1 exceeds its first-call level (+4.9 dB): strong overlap. The trace after the final strike alternates once per physical period (dips every 0.44 s): the only grove whose windowed RMS shows a single slow alternation.

## The alternative worth auditioning: two cycles on grove 3
`composeOnPulsePhrase(recipe, { cycles: 2 })` (default cycles 1 unchanged, byte-identical): call, answer, call, answer, final call, then the open entrance; 4.87 s authored on grove 3. The pattern has recurred before the gap. Whether a single repeat fails to establish recurrence, and whether two cycles do, are musical hypotheses for the audition, not conclusions of these metrics; the metrics only show what the model carries at each instant. The residual at the hand-off is nearly the same as with one cycle (body 1 +0.3 dB instead of −1.0, body 2 −8.1 instead of −5.7, body 3 −2.0 instead of −2.2; expected entrance −8.4 / −9.7 / +0.3), so the variant changes the establishment of the pattern without changing the room for an answer. Suggested renders for the study: the two-cycle opening alone, and with an authored answer at the expected entrance. Not claimed: that two cycles are heard as a pattern, or that either variant is better.
