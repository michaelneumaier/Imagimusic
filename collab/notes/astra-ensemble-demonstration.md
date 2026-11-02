# Optional Three Groves demonstration

Astra · November 2, 2026 · local implementation verified

The existing encounter leaves the first sound to the visitor. A separate
“Show one gesture” action offers a short authored example when wanted. Fable's
proposal uses three arrivals at the page's velocity0.5, a firm hand on C and
its release, then a common Quiet at beat8 / tempo72. It comes from the shared
ensemble score with the later chord omitted, not an independent UI score.

The host's scheduleOpening admits at most32 steps over20 seconds, validates
all commands before posting, requires a final common Quiet, and schedules
against one AudioContext frame origin. Only a fresh unused host can accept it;
even a manual gesture waiting for its first acknowledgement excludes it.
Manual commands cannot mix into the demonstration. Quiet can end it early.
Capture still records applied processor acknowledgements rather than the plan.

The page labels the passage AUTHORED DEMONSTRATION, disables manual playing
throughout, names each stage from acknowledgements, then offers Your turn to
begin an empty passage. Keeping is labelled as demonstration and uses distinct
filenames. The canonical record schema is unchanged; filenames and page labels
identify this authored example, not an embedded provenance field. Starting a
new passage replaces the prior record only after successful host preparation.

Verification so far: ten host tests pass, plus the two existing actual-worklet
tests covering exact diagnostic equivalence and an earlier common Quiet within
an authored future schedule. Native Safari cancelled preparation with Escape.
Full phrase playback and saved-file reconstruction remain to be checked after
the model option is handed off. No output-glitch or device-performance clearance.

## Native verification

Safari completed the demonstration and offered labelled demonstration files.
The downloaded record exactly equals ensembleRecords for the short phrase:
48k, strikes at0/40000/80000, C contact140000–240000, Quiet320000 and1200-frame
fade. The321200-frame WAV is byte-exact to canonical reconstruction; SHA-256
1eb28041b3cf742e4794e5ff1b5d7f610cccad202ea318222d67c06fe26e5270.
Files and report: renders/ensemble-demonstration/.

Your turn then prepared an empty host. D followed by Escape produced only one
G strike, no C/E-flat strikes and no contacts; your-turn.json records that
separation. Both model tests pass. Own score review is in
collab/reviews/20261102T0124Z-astra-reviews-ensemble-demonstration-phrase.md;
it asks Fable to retain minSeconds6 rather than widening admission to5.
Fable's final host/UI review is still pending.

A second native run displayed the acknowledged C hand and then ended on
Escape atframe307073 (before scheduled320000); the hand had already lifted
at240000. early-quiet.json preserves that actual shortened ending. Do not
describe this as a hand-cancellation test. The model duration bound is now
restored to6 in the working tree, resolving the review finding.

Fable committed the score option asbbff935 and approved the host/UI code in
collab/reviews/20261102T0123Z-fable-reviews-ensemble-demonstration.md. The native
record and WAV comparison above satisfy the review's remaining check. One
review wording correction requested: scheduler times are nondecreasing, with
Quiet strictly after the last musical event; simultaneous gestures are allowed.

Final focused run:14 tests passed across host, actual processor and phrase.

## Phone entry and homepage follow-through

Native Safari responsive preview at320×656 showed the three opening actions
stacking into three rows. The mobile action group now uses Begin/Quiet in one
row and the optional example below, at least44px tall. The full scene fits in
the initial view; the action group remains sticky on scroll. Strike and soften
controls remain in their existing three columns. This is desktop Safari layout
preview, not hardware iPhone performance or touch validation.

The homepage now leads with the experimental playable Three Groves encounter,
retains its listening-comparison link, updates the current milestone/history,
and states the outstanding device-output/performance evaluation. Native320px
and1120px preview checked wrapping/layout. The play link opens an idle ensemble
page. Catalog text verified after reloading cached resources from origin.
Fable code/content review approved:
collab/reviews/20261102T0129Z-fable-reviews-phone-entry-and-home.md.
