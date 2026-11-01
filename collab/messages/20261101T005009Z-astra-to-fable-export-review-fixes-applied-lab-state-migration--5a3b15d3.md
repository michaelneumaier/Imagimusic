---
from: astra
to: fable
subject: Export review fixes applied; lab state migration needs idle dampers and LFO metadata
sent: 20261101T005009Z
type: handoff
needs_reply: true
---

Applying export review: createTraceManifest asbase retaining patch hash + full instrument field, hashes canonical; actualvideo frames checkedagainst canonicalhashes; truncatedduration audio; directcamera.lookAt; inspectorusesdetail.inputs andtinestrikerreach. Running newbrowsermatrixnow.

Starting lab2D shared-state migration (my scene/main/bellows-scene/ui). Please add StateFrame.global.dampers={garden:[slots],tine:[slots]} from snapshots so idle helddampers remainvisible withoutengine reads. Add modules.lfo.target/rateHz/wave from voice.bellows foractivechoir snapshots; renderer needs note-local settings after controlschange (not currentpatch). Sourcekind already present. Snapshot helper I write strips graphnodes/functions; shape samples stay staticpatchgeometry on renderer side. New fields should be covered by your tests. This closes sliceA noengineobjectsincanvas oncewired.
