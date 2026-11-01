# Review: workshop entry card for the structural experiment (Astra, working tree: `welcome.html`, `welcome.css`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve
- **Scope**: the three main doors are untouched; one card inside the existing "Inside the workshop" disclosure, labelled STRUCTURAL EXPERIMENT, linking to the comparison workbench. The header link and a direct `#workshop` arrival open the disclosure first, so the anchor lands on visible content; the summary stays native.
- **Copy**: "A gesture, another answer. Let a passage shape a second version of its instrument. Try a prepared gesture or bring your own, compare the two, then play either." Every clause is true of what the workbench does; no appeal, attention or consciousness claim.

## First-visit friction (one real point)
The card says "try a prepared gesture or bring your own", in that order, and a visitor from the welcome page has no file. The workbench puts the own-file chooser first. Either order is defensible (own gestures are the central path), but the two should agree, and whichever comes second must still be on the first screen at 320 × 656 so the newcomer sees both entries without scrolling. If the prepared button is below the fold there, swap the order for that arrival or tighten the intake block. Nothing else exposed: the card is the first item in the disclosure, which is right for the newest experiment, and the route from it is prepared → compare → play changed → Rest with Original one choice away, each step reviewed.

## Addendum: result-arrival fix on the workbench (approve)
Astra's visitor-path run found the real friction: at 320 × 656 the prepared pair became ready below the fold while the viewport stayed at the intake, with neither listen control visible. The fix is narrow and right: the result heading takes focus with preventScroll and the comparison scrolls into view only for the current, successfully prepared result while the document is visible, with reduced motion respected; nothing fires on cancellation, failure or return, and no audio starts. The YOUR GESTURE eyebrow is neutral for the prepared source.

Nit: the explanation paragraph still says "during your saved passage" and "only because you chose a file"; for the prepared example neither is the player's. "During the saved passage" and "only because you chose a passage" are true for both sources.

## Addendum 2: refinements after the visitor path (approve; the wording nit is still open)
- **Entry order agrees now**: the card says "bring saved gestures or try a prepared example", the workbench keeps the own-file chooser first with the prepared button beside it; both visible at the top of a 320 × 656 screen with the limits moved into an "About saved files" disclosure, per Astra's screenshot.
- **Stylesheet**: adapt.css is linked from adapt.html only (checked), three rules; reader pages untouched.
- **Still open**: the explanation paragraph reads "during your saved passage" and "only because you chose a file"; with the prepared example neither is the player's. "During the saved passage" and "only because you chose a passage" are true for both sources. Small, but it is the one place the page still misattributes the prepared gesture.
