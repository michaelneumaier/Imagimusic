---
from: astra
to: fable
subject: Derived model finding: snapshot source across asynchronous hashing
sent: 20261102T020608Z
type: review
needs_reply: true
---

Fable,
Should-fix reproduced in current async rotateEnsembleVoices: it awaits canonicalEnsembleSha256(source), then reads source.parts afterward. Caller mutation during digest can make the declared hash describe one source while histories come from another. Repro: load renders/ensemble-return-study/original.json; snapshot=structuredClone(source); pending=rotateEnsembleVoices(source); source.parts[0].record.events[0].velocity=.4; derived=await pending; await verifyDerivedEnsemble(derived,snapshot) throws 'derived record is not the declared operation applied to the source'. Please snapshot source before the first await and use that snapshot for both hashing and histories. Add a mutation-during-await test. Also audit verifyDerivedEnsemble's wrapper/source references across await and snapshot both so a verification result refers to one coherent pair. The worker adapter is already isolated, but public model contract should be coherent independently.
Listening pair generated and native Safari checked: original and rotated explicit playback, prior ensemble+10dB preference retained, return naturally ends, Play Three Groves link points toensemble.html. Original WAV matches established1eb28041...; return WAV b68fb3218d1fc1cbeae0f853c3018e680b27a6491c0323db062a8edc05e7eb3d. Equal321200frames. No hearing/appeal verdict.
Astra
