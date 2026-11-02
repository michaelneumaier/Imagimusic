# Proposal: one shared listening gesture for the inverse workshop (Fable, 2026-11-02; score ownership; Astra implements)

Astra's brief: one optional short gesture, the same body sequence, impulse and timing on any fitted or kept anatomy, ending in silence, chosen explicitly after Start listening; no autoplay, no ranking, the shared listening level, Quiet cancels; small and musically intentional; the visitor's own touch stays central; "Hear a gesture" leading to trying one's own answer.

## Constraints that shape it (measured)
- A strike's slot lives for the instrument's ring time, 19.16 s on the default candidates (8 / loss, capped at 20 s), so the eight-strike cap counts every touch of the last nineteen seconds; and preparation of another anatomy is locked while anything rings. A gesture of three touches therefore leaves five slots for the visitor's answer and holds the switching lock for about twenty seconds after its last touch unless Quiet is chosen.
- The default target's low modes are 128.78 / 131.12 / 132.17 Hz: beat rates 2.34, 1.04 and 3.38 Hz (periods 0.43, 0.96 and 0.30 s); decay 2.39 s to 37 %.
- Pickups are bodies 1 and 3. Body 2 is heard only through its bridges: a touch on 2 is relationship and nothing else.

## Four candidates measured on both default anatomies (pickups × 8, summed over active strikes; R−L is the right-minus-left level per half second)
| gesture | concurrent | peak L / R (chain) | R−L first 0.5 s, chain vs triangle |
|---|---|---|---|
| A: 1, 3, 2 at 0.5 s | 3 | −46.3 / −44.8 dBFS | −13 vs −18 dB |
| B: 1, 3, 1, 3, 2 at 0.4 s | 5 | −41.2 / −42.4 | −5 vs −7 |
| C: 1 then 3 one beat later (0.43 s) | 2 | −46.3 / −45.2 | −6 vs −7 |
| D: 2 alone, then 1 and 3 together at 0.5 s | 3 | −47.1 / −47.9 | +14 vs +20 |

All peaks are around a tenth of the respective coherent bound; nothing approaches full scale even at ×4. After the first half second every gesture converges to a few dB of difference between the channels on both anatomies.

## The proposal: "One touch, then two" (gesture D; first named "the middle, then both ends", renamed after Astra's visual review because body 1 sits front and centre in the drawn scene and the triangle has no middle; bodies are named by number)
Three touches in two moments: body 2 alone at 0, then bodies 1 and 3 together at 0.5 s, then nothing. Why this one:
- The first moment is pure relationship: the middle body is not a pickup, so what is heard is only what its bridges carry to the ends, and that is where the two anatomies differ most (right minus left +14 dB on the chain, +20 dB on the triangle: the triangle's stronger 2–3 bridge sends the middle's ring further to the right). The second moment strikes both pickups at once and the whole instrument speaks; the ring then shows how the three settle together, with the beats at the rates above.
- It is a musical shape, not a demonstration: a question from the middle, an answer from the edges, then the long settling. The half second between the moments is an authored pacing choice, not a beat match (correction after Astra's review: the 2.34 Hz beat has a 0.427 s period and the 1.04 Hz beat is slower still); the channel differences above are model evidence, not a listening preference.
- It is small: three touches, 0.5 s of playing, five slots left for the visitor, well inside the bound.
- It is the same on any anatomy by construction: bodies, impulse and timing fixed; only the anatomy changes.

## Frozen export
`src/score/grove-inverse-gesture.js` exports `INVERSE_SHARED_GESTURE` (kind imagimusic-inverse-gesture v1, id one-touch-then-two, title "One touch, then two", events body 1 at 0, bodies 0 and 2 at 0.5 s in 0-based indices, span 0.5 s, the rationale and the invitation line) and `validateInverseGesture` (1..8 events, bodies 0..2, offsets within 0..8 s, first at 0, non-decreasing, span consistent), so the page and the offline harness share the exact authored events.

## How it should run (for Astra)
- Schedule the three strikes on the audio clock from one explicit choice ("Hear a gesture" after Start listening), using the transport's scheduling path with offsets of 0 and 0.5 s so timing is identical across anatomies; a scheduled strike that the eight-strike cap refuses is reported like a touch, not silently dropped.
- The gesture respects every existing gate (armed, running, not busy) and the shared level; Quiet cancels it and clears the ring; a candidate switch is locked while it rings, as for any touch.
- The invitation says what it is and nothing more: "Hear a gesture: body 2, then bodies 1 and 3 together. About twenty seconds to settle, or choose Quiet." (visible wording is Astra's) Afterward the existing line invites the visitor's own touch, and the repeat-touch memory remembers the gesture's last body (body 3, or whichever the page records) only if a single body is natural; otherwise the gesture leaves the memory alone.
- No ranking, no "best sounding", no new record kind; the gesture is not kept in the anatomy file.

## Evidence before it ships
The three strikes rendered offline on both default candidates and compared against this note's numbers; a native run with the gesture ending in silence, Quiet cancelling it mid-ring, and a refused ninth strike reported; and the observation with people: do they answer the gesture with a touch of their own.

## Shipped, and one next improvement (2026-11-02, after 40f52ff)
The gesture shipped as proposed (Astra 40f52ff; score 310d361), with the transport's transaction and reservation rules and the Safari-exact harness as evidence.

**Next, proposed: "Hear it here too."** (Astra's wording correction taken: the line must not say "you heard", since a started gesture can be quieted or muted at once and observed playback is not a listening claim; the page remembers the last successfully started gesture and says "Try the same gesture on this triangle, too.") The workshop's question is one sound, several bodies; the gesture answers it fully only when the same phrase is heard on both anatomies in turn. So: when the gesture has been heard on one anatomy, and the visitor prepares the other and arms it, the page offers one line, "You heard the gesture on the chain. Hear it here.", with the same Hear a gesture control (same gates, from quiet only, never automatic). Page memory only: which anatomy the gesture was heard on, tied to the current results like the touch memory, cleared by a new search, untouched by the visitor's own touches and never recorded in a kept file. No new sound, schema or control; it is the touch invitation's rule applied to the phrase, and it closes the loop the same-touch invitation opened: the visitor's touch on both, the authored phrase on both, then their own answer. Evidence: the invitation appears only across anatomies and only when armed; a native run hearing the phrase on the chain, preparing the triangle, hearing it there, then answering with a touch.
