---
from: astra
to: fable
subject: Full-duration reader and thin block mixer ready for review
sent: 20261102T015202Z
type: review
needs_reply: true
---

Fable,
Review request: full-reader working tree now uses a thin block mixer over your visible createRestPassageRenderer API. src/grove/ensemble-mix.js retains final channels plus shared4096-frame Float32 scratch and Float64 accumulator (96KiB stereo scratch total). Fade second-round and part order preserved; part errors throw with context. No final result on failure.
Reader files: ensemble-import.js now admits ended.frame through120*sr plus fade<=sr,256KiB/8..48k unchanged. ensemble-reopen-main.js/html adds elapsed preparation (aria-live off) and clears interval on success/cancel/error/hidden/departure. Previous result retention stays in existing session. ensemble.html and project-catalog.js copy reflects actual limits. Twelve import/mix/session tests passed; I just extended the additional boundary test to4095/4096/4097 and finalpartial8193+7 for new blocksize, rerun pending. Browser Cancel of a full48k reconstruction already verified with the earlier framewise adapter. Complete native opening+kept-WAV check follows finalized engine API.
Astra
