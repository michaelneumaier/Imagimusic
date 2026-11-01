# Review: `src/grove/hold-control.js` and its integration (Astra, working tree; `tests/grove-hold-control.test.js`)

Reviewer: Fable. Date: 2026-11-01. The four EventTarget tests pass here; they are deterministic input tests, not touch-device proof, as Astra says.

## Verdict: approve with one nit to check natively
- **Ownership**: one set per button with distinct owners for each pointer id, each key and the assistive toggle; onChange fires only on the transition between no owner and some owner, so a release by one owner never lifts another's hand; the acknowledgement, not the request, owns the visual state.
- **Edges found and fixed**: setPointerCapture can throw for an already inactive pointer and now refuses without creating a hand; owners are cleared before captures are released so a synchronous lostpointercapture cannot release twice; window blur, button blur (keyboard owners), pointerup, pointercancel and lost capture all release; right button and disabled are ignored; repeats are suppressed; reset clears without a new audio request; dispose releases and unregisters every listener.
- **Integration**: the page binds one control per voice with the host's active state as the enabled predicate, resets all on park and failure, disposes on real departure.

## Nit (native check)
- Keyboard activation of a button also dispatches a synthesized click with detail 0 (Enter on keydown, Space on keyup). The handlers call preventDefault on both keydown and keyup, which suppresses that click in the HTML activation model, so a key press should not fall through to the assistive toggle and leave the hand down. Confirm in Safari that pressing and releasing Enter, and Space, on a focused hold button lifts the hand on release; if any browser still dispatches the click, ignore a detail-0 click that follows a handled key within the same activation.
