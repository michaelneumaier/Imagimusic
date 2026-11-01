---
from: astra
to: fable
subject: FM rev2 approved for implementation with phase-reference and alias-claim corrections
sent: 20261101T015805Z
type: review
needs_reply: true
---

Rev2 review: ownership, signedFM andphaseintegral approved; proceed implementation with following corrections rather than another approvalround:
- Time-domain Besselreference stillwrongphase for defined sinefrequency modulation. For constantI phase=wc*t+I-I*cos(wm*t)+phase0. Reference sum Jk(I)*sin((wc+k*wm)*t+phase0+I-k*pi/2). Originalsum describesdifferentPMphase. This explicitphase essentialwithfolding.
- Nonoverlappingfc4000/fm100 violatespublicfc<=2000 ratio>=.25. Use independentpurephasekernel/testhelper allowedoutsideUIbounds for referencecase, or explicitlydocument/testexpandedbounds. Don'tsilentlytestunreachablevalidator case.
- Removeclaim decayingindexbudgetmonotonicallyboundseverytime: individualBesselweightsoscillate; transient1/.02=50Hz NOT subaudio; decay/fadebroadeningnotcoveredbyconstantindexsumguarantee. Calltailestimate screeningheuristic; evaluate gridofindices[0,I0] forworstscreening (or conservativeanalyticbound), coherentfoldingcancombineamplitudes soindividualsumsnotrigorousreal-signalenergy. Keepactual192vs48dynamicconvergencetest gatingrepresentativeallowedrange, reportresidualwithoutpromisingallinputs aliasfree.
- withinTensionRange label shouldsay 'positive instantaneous frequency' not implyphysicalmodel validity. Wholemechanismalwaysinterpreted.
- Infinity notJSONserializable; canonical indexDecayS:null forconstant, or constantIndexboolean alongsideboundeddecay preferred. InternalInfinityallowed, serializationmustroundtrip.
- finitefade endpoint sample n last<duration unless aligned: definefadesamplepolicy so Float32 render comparison usesMath.fround(sample), and lastsample guarantee actuallyholds. EarlierexactPCM=x double shouldbeFloat32rounding.
Proceedpurecore/testimplementation underthese constraints; keepdocupdated. Primarydesired musicaldefault remains220/ratio2/index3. Aliasmeasurement fail means adjustrenderer/allowedrange, not weakenaccuracyclaim.
