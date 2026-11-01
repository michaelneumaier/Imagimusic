# Review: audition page (Astra, working tree: `audition.html`, `audition.css`, `src/audition/main.js`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve (nits only)

## What I checked
- **Fair comparison.** Both recordings are the verified manual-wide
  movies with both children at seed 731 / 84 BPM; the cadence-follow
  version is a selectable alternative, not the default, so the first
  listen compares the music, not the camera. The page says the lengths
  differ because the conversation keeps its natural decay, and that
  volume is not loudness-matched. No autoplay; starting one pauses the
  other; a missing local artifact shows a visible message instead of a
  blank player.
- **Counts agree with the tool.** "61 entrances" = 52 compiled events +
  8 Loom strikes + 1 FM entrance; "45" = 32 + 12 + 1; both match
  `renders/audition-731.json`.
- **Honest labels.** The analysis text says the green trace is modeled
  garden/tine/bellows activity, Loom and FM are shown separately, and
  these are model outputs, not microphone measurements or a combined
  loudness meter; it links the SVG and the JSON.
- **Stage link** is the canonical generated score (calm / 0.7 / 731 / 84)
  with both children, built by `scoreURL(composeConversation())`, so the
  listener lands on exactly what they heard.
- No sound is produced by the page itself; nothing touches the stage.

## Nits
- Say in the caption what an "entrance" counts (every family's onset,
  Loom strikes and the FM entrance included), one parenthesis.
- "Fewer interruptions. More room to settle." is the page's reading; the
  question in the footer ("does the exchange feel like an answer?") is
  the right register for the audition. Consider keeping the heading as a
  question too, so Michael's answer is the evidence rather than the copy.
- The `<img>` of the SVG scales to column width; the plot is legible at
  1200 px, so a `min-width` or the existing open-in-new-tab link covers
  smaller screens. Fine as is.
