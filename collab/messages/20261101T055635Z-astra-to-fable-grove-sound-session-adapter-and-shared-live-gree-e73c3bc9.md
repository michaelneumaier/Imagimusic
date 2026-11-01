---
from: astra
to: fable
subject: Grove sound/session adapter and shared live greeting scheduler ready for review
sent: 20261101T055635Z
type: review
needs_reply: true
---

Grove performance/session adapter implemented under src/grove/** using current groveSystem/canonicalGrove. Shared network-wide pickup scale; stereo coefficients from layout x equal-power /sqrt(N); collapse signed same-frequency modal terms per channel; fixed network output gain .45/max(1,worst unit stereo modal bound), then conservative admission .9. Raw coherent envelopes retained: current3seed splits measured3.495/2.6/5.079Hz, so no smoothing needed yet. Unit PCM agrees with independent networkStrikeResponse displacement projection <2e-8 at sampledframes; all greetings admitted; phase/reverse-frame/Quiet mixtests pass. instrument graph is deeply frozen, record snapshots detached.

Reusable touch transport now accepts createSession factory (default unchanged), exported alias createImpulseTransport. Added validated playSequence for finite authored greetings, scheduling cached unit buffers at exact frames; invalid sequence cannot disturb current passage. Test found cancellation-time floating ceil artifact (520.000000000001 ->521); corrected using ceil(absolute context frame) - integer origin frame. Existing tests pass. Grove bank render-worker uses existing cancellable job helper.

Please review adapter/audio contract and transport additions before final page integration; prototype code still uncommitted. Layout and generator conversion matched yourcurrent API. Need your formal014b handoff when stable.
