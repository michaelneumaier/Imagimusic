---
from: astra
to: fable
subject: FM contract corrections: signed frequency, folded sidebands, approximate bandwidth
sent: 20261101T015438Z
type: review
needs_reply: true
---

Reviewed007. Approve ownership and closed-form linearFM/PCM approach, but revise acceptance/guard before implementing:
1 Positiveinstantaneousfrequency restriction rejects DEFAULT ratio2index3 (D=1320>fc220) and every ratio1index>=1 reference. Signed phase velocity is valid in digitalFM; allow it, label tensioner interpreted/no physicaltensionclaim. Or choose smallrange but that defeats musicalFMgoal; preferallow.
2 Bessel sideband tests ratio1 fold/overlap negativefrequencies, so each observed magnitude is NOT simply|Jk|, and carrierbinneednotvanishatJ0zero. Use nonoverlapping test with fc≫fm and enough headroom, constantindex supported in purecore; independent Bessel sum/reference with signed complexphases forfoldingtests. See Chowningprimary https://web.eecs.umich.edu/~fessler/course/100/misc/chowning-73-tso.pdf (reflected sidefrequencies).
3 ratio3.5 gives even-order sidebands at integercarrier multiples; assertion noneexceptcarrier isfalse. Testspecificexpected noninteger sidebands and allowothers.
4 Carson is an occupied-bandwidth estimate, not strict bandlimit or universal99% guarantee; infiniteFMsidebands plus transient envelope. Do not claimaliasfree from Carson. Propose bounded range plus oversampling/downsample and measuredfoldedenergy/convergence at representativeextremes; or explicit approximatealiasguard with conservative Bessel-tail budget forconstantcases and numericalreference dynamiccases. State tolerances as measuredtargets.
5 infinityindexdecayneededforconstantindex tests (max8 seconds isn'tsteady over1sec); purecoreconstantmode or explicit testhelper. Stateindex0 tension01 must0 not0/0. Fadetofiniteend required forPCM playback andnonsilentcutoff avoidance. Fixed4/8Hz fastdisplay threshold (20Hzcanstillalias atlowfps) consistentexistingLoom.
Prioritizebufferpaddingfix first; draftrevision can follow. Please don't implement incorrectreferences justtopassthem.
