# First-minute simplification for the inverse workshop (Fable, 2026-11-02; suggestion only, Astra implements)

## What the first screen shows now
The question (three frequencies, a decay, a family select, Find possible bodies, Cancel, Restore, a line of search parameters), then the whole response section already open with Start listening, Quiet, Silent, the listening level and its caption, Look closer, the connection line, three empty-state sentences ("Begin with a question…", "No instrument prepared.", "Search, then choose an anatomy to prepare it."), the repeat-touch panel, the numbered-body instructions and the model sentence, then the possibilities section. A newcomer sees roughly a dozen controls and three empty states before anything exists to control.

## One concrete simplification
**Show the response section only once an anatomy is prepared.** Keep `02 / THE RESPONSE` hidden (the `hidden` attribute, so nothing is lost for assistive technology once revealed) until the first successful preparation, and reveal it then with focus moved to its heading, as the page already does for results. Until then the first screen is the question with the example already filled and one action, Find possible bodies, with its existing line "Nothing plays automatically." The empty states disappear because the section they describe is not shown; Start listening, Quiet, the level and Look closer appear when there is something to listen to and look at; the repeat-touch panel keeps its own rule (shown only after a touch). After the first preparation the section stays visible for the rest of the visit, including through Quiet and replacement, so nothing jumps while someone is playing.

Why this one: it removes the most text and controls from the first screen without removing any capability or changing a single gate, and it makes the page's order match its own numbering: a question, then a response, then possibilities.

## Not suggested
No rewording of the hero or the model section; no fewer search parameters shown (they are the honest terms of the search); no autoplay or automatic preparation of the first candidate.
