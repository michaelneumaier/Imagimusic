# Proposal: "Whose touch", one small playable experiment on the Three Groves page (Fable, 2026-11-02; proposal only)

## The question
During "Begin with a memory" the picture draws remembered strikes and the person's own strikes identically, so the only sign that the instruments have become theirs is a status line. Astra's direction is to let someone notice a changed relationship to a familiar sound. The smallest honest step is to let the picture say whose touch each ring comes from, and then watch whether people place "my turn" where the engine placed it.

## What is modeled, what is interpreted, what is presented (the vision's three layers)
- **Modeled** (unchanged): no model work. The engine, the plan, the barrier and the kept file stay exactly as they are.
- **Honest interpretation** (the experiment): every strike acknowledgement already carries an id; remembered edges are `continuation-<i>`, personal ones `gesture-<n>`. The host's strike markers gain one boolean, `remembered`, taken from that id, and the scene draws a remembered strike as a hollow mark and a personal strike as a filled one. The caption under the picture says so in one sentence: "Hollow marks: the remembered opening. Filled marks: your touch." This is a fact about causation, not a perception, so it may be on by default; it is reversible with one control, "Show whose touch", and excluded from nothing because it falsifies nothing. The kept seeded file already records this provenance in its ledger, so exports need no change.
- **Perceptual presentation** (named, default off, optional second step, not part of the first experiment): "Afterglow", where the hollow marks of the remembered opening dim over the ten seconds after the handoff while the sound is untouched. It bends the picture and never the timing; its caption says it is a presentation; it is excluded from causal inspection and would be recorded as a presentation flag if a picture were ever exported. I would not build it until the first step has been watched with people.

## The experiment (first minute, with people, no appeal claim)
Two runs of the same remembered opening on the same instruments, marks off then marks on, or the reverse, by a coin. After each run one question, asked the same way: "Where did your turn begin?" with the person pointing at the picture or saying a moment, and one open sentence. We record the answer against the handoff the engine recorded (the kept file's boundary) and whether the person's first strike came before or after it (the ledger says). Nothing is scored as better; the report says where people placed their turn with and without the marks, and quotes the sentences. If they place it at the handoff more often with the marks, the picture is doing honest work; if not, the marks go.

## Size
A boolean on the host's strike markers (`ensemble-host.js`, one line, Astra's file), a marker style in `src/grove/scene.js` (hollow versus filled), a caption and one checkbox on `ensemble.html`, remembered in the browser like the listening level; a test that a continuation's strikes are marked remembered and a personal strike is not; one native screenshot pair at phone width. No new schema, no new worker, no sound change.

## Not claimed
That hollow marks feel like memory, that anyone will notice, or that the handoff is audible. Only that the picture now states a fact it already knew.
