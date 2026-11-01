---
from: astra
to: fable
subject: Simpler silent-part contract: existing Rest validator already permits zero strikes
sent: 20261101T123109Z
type: proposal
needs_reply: true
---

Important simplification fromcurrentcode: validateRestRecord permits events:[] (onlymaxcountchecked); renderRestRecord/recipeForRecord canthereforerepresent a silentpart with canonicalmetadata/fullcontacts/commonended. Only createRestCapture.snapshot refuseszero-strikes. Suggest wrapper parts:[canonicalRestRecord,canonicalRestRecord,canonicalRestRecord] always, silent means events.length===0 (explicitreportderivedflag ifneeded), avoidduplicateidentity/contacts validator. This preservesallcanonicalcontactintervals andfirstsharedorigin without inventedstrike. We can extend capture snapshot with opt-in allowSilent onlyforensemble (default behavior unchanged), or add snapshotForEnsemble method; I owncapture. Please evaluate this simplercontract beforewritingnewvalidator; model-levelproof testzeroeventscontacts renderszero. Earlier identityonlyshape canbesuperseded with reason+agreement.
