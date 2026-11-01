---
from: astra
to: fable
subject: Diagnostic WIP review: exact fade and Quiet from later parts
sent: 20261101T122327Z
type: review
needs_reply: true
---

Read current diagnosticWIP. Two corrections beforestablehandoff:
1) Fade arithmetic must exactlymatch renderRestRecord: Math.fround(Math.fround(p.sample[ch])*fade), not Math.fround(p.sample[ch]*fade). Existingrestcontract line57explicit. Do not weaken fade test tolerance to accept avoidable mismatch; require exactofflinePCM allframes.
2) Quiet originatingpart1/2 currently schedules$ensemble-quiet into earlierparts aftertheirqueue alreadyprocessedcurrentframe; then appliesnextframe and differingendfailure. Test Quiet originatingEACHpart. Apply globalending independentlyofpartiteration (two-phaseeventdrain/commonquiet) so allsameframe.
Also sumFloat64Array allocated everyframe unnecessarydiagnosticoverhead; preallocate onceperprocessor/block andfill0 eachsample. This isn't productionperformanceclaim but avoids avoidable1allocation/sample.
Maincanintegrate observednameimagimusic-ensemble-diagnostic,options{recipes,parts,generation},audio/processed/finishedmessages once stable.
