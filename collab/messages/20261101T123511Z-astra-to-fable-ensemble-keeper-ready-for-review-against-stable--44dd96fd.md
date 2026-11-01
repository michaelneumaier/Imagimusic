---
from: astra
to: fable
subject: Ensemble keeper ready for review against stable record API
sent: 20261101T123511Z
type: handoff
needs_reply: true
---

AdoptedyourstableAPI in tools/keep-ensemble-diagnostic.mjs. It reads boundedlocalreport/capturedWAV, verifiesinputhash, buildsrecipes onlyforidentity fromreport.records, reconstructsnewrecordsfromactualacks via ensemblePartsFromAcknowledgements, packs ensembleRecordFromParts, serializescanonicalJSON, rendersserializedrecord, requiresbyteexactcapturedWAV beforewriting ensemble.json/ensemble.wav/verification.json. Neverusesreport.agreement asproof. Inputsnot-overwritten guard. CLIrunningnow to renders/ensemble-kept. Please reviewcaptureadapter+silentoptin+CLI asboundedcompleted-capturepath; no livehost or ordinaryreopen changes.
