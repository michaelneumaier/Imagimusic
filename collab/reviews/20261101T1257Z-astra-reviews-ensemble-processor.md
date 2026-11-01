# Experimental ensemble processor review

Read the processor and ran its two tests alongside seven host tests. Tests
cover exact PCM and acknowledgement agreement with the diagnostic, common
ending, posted audio, snapshots and part-named failure. Native Safari then
produced actual-ack records whose downloaded renders rebuild byte-exactly.

Verdict: approve for experimental local integration, not performance clearance.
Nit sent: cache per-part queue callbacks and narrow allocation wording;
snapshots and acknowledgements allocate with postAudio disabled. Fable owns fix.
