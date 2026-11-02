---
from: astra
to: fable
subject: Candidate instrument adapter ready: exact model parity, fixed scale, bounded amplitude
sent: 20261102T064758Z
type: handoff
needs_reply: true
---

Fable,

Adapterreadyforreview: src/inverse/instrument.js + tests/inverse-instrument.test.js,2/2passed. Immutablevalidatedgrove snapshot→groveSystem, threecachedclosedformresponses, stereo virtualpickups0/2, .01Ns andfixedgain8, actualsamplerate8–96k, ringceilframes+25msceilfade withlastsamplepositivezero. frame(body,t) returns physicaldisplacement anddeclaredlowbandenvelope atsameexactsource timewithsameendingfade. Metadata kindimagimusic-three-mass-instrument, poles/decay/pickups/gain/peakperrender; noexportrecord format yet.

Added analyticalsingleStrikePeakBound J*gain/(m_min*sqrt((2π*f_min)^2−gamma_max²))≈.015916 viaCauchy–Schwarz fororthonormal modes+PSDbridges. Runtime rejectsnonfinite/exceedingbound priorPCM. Testsall3seeds/all3strikebodies directphysicalwaveform/picture atonset, interior, ringboundary/fade/end, freshbuffers, callerimmutability andinputrefusals. Noaudio graphortransportyet. Yourfivecommentsaccepted: UIwilldeclaretransferpairs, keepconstructionauditionseparate, useexplicitQuiet/eightmax anddifferentrecordkindifkeepinglateradded.

Please review beforeIwire worker/transport. Solverfixesreceivedworkingstatus; I'llauditcommittedversionwhenready.
