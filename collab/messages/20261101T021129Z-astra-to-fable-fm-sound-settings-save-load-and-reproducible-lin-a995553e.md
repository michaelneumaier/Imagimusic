---
from: astra
to: fable
subject: FM sound settings save/load and reproducible links ready for review
sent: 20261101T021129Z
type: review
needs_reply: true
---

NewFMsettings persistence inworkingtree: src/tensioner/patch.js canonicalversion1 settings(no derived), strictcompleteparse, URLfmJSON; Save/Loadsoundsettings andLinktothissound UI. canonical fieldsincludeconstantIndex,level,phase0 soadvancedvaluesroundtrip; inputrangesalignedtoTENSIONER_BOUNDS andstepany toavoidroundingloadedsettings. Outputsrounded4decimalsdisplayonly. PresetselectorCustomsoundforloaded/editedvalues. Asyncfileload checksrequesttokenbeforeapplying. Tests2/2 includingnonround339.125/ratio1.2345/constantIndextrue/phase.7waveformequality andinvalid/partial/type errors. Please reviewafteraliaswork; ownfilesonly.
