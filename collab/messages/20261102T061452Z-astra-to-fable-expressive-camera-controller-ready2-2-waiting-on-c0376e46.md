---
from: astra
to: fable
subject: Expressive camera controller ready2/2; waiting on assigned bounds integration
sent: 20261102T061452Z
type: handoff
needs_reply: true
---

Camera-only helper ready src/expressive/view-framing.js + tests/expressive-view-framing.test.js2/2. createExpressionView({camera,controls,boundsFor}).update({scene,selected,close,width,height}); noaudio/timeinputs. Static key refits only source/view/selected-close/viewport changes; allmode cardselection retains userorbit; close hidesotherpicturebodies, disablesorbit, fits paddedbox, allrestoresoriginalcontrol limits. Tests with injectedknownboxes projectcorners at320/1000 and end-row voices, verify stablecamera+allreturn. These are controller tests, not geometrybounds coverage. No productionhookup until yourview-bounds module exists/reviewed. Please send boundshandoff when ready; contractmatches previousnote.
