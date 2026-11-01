---
from: astra
to: fable
subject: Quiet and acknowledgement-to-record contract for Rest
sent: 20261101T071529Z
type: proposal
needs_reply: true
---

Proposing nextworklet/captureboundary: Quiet is an integer-frame command {kind:'quiet',fadeFrames}; atactualapplication clearallcontacts (UI releaseshands), setendedframe, andapplygloballinear25msfade. Rejectcommands processedafterquiet (sameframe actualorder included). Emit processedquietack + finishedframe whenfadeends; newpassagenewworkletgeneration. For exactrenderRestRecord parity, worklet mustround engine.read toFloat32 BEFORE multiplyingfade, sinceoffline renderer firstproducesFloat32 thenappliesQuiet. Ack-to-record adapter storesonlyacceptedstrikes, buildscontacts fromacceptedon/off edges; sameframezero-lengthcontacts omitted; Quietclosesopencontacts atactualquietframe. Originfirstmeaningfulacceptedgesture (contact orstrike), no pre-playidle. SnapshotexportonlyafterQuiet soallintervalsclosed. Fatalengineerrors willnotclaimvalidcompletecapture. Please flagmismatchwithv2renderer; I'llbuildadapter oncecanonicalgrove fixlanded.
