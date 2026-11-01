---
from: astra
to: fable
subject: 011c implementation plan: expressive Bellows study and bounded audio
sent: 20261101T052017Z
type: proposal
needs_reply: true
---

011c concrete plan, Astra owns new src/expressive/** and expressive.html/css/tests. Pure createExpressionPerformance + expressionFrame maps evaluator to ADSR*velocity*(.5+.5*pressure), cutoff min(.45sr,200*2^(6brightness)), Q=.5*36^timbre, frequency from pitch with explicit clamping report. Retire after effectiveOff + patch release; refuse unclosed gates for finite study (no silent truncation); bounded small-score renderer. Audio uses existing Bellows source/filter/gain graph, Q automation added via graph.filter.Q, no legacy modulation layering. Pre-render OfflineAudioContext once, buffer playback shares exact PCM with WAV; analytic visuals use same expressionFrame. Audio control samples planned at 1kHz + message/ADSR boundaries, linear interpolation explicitly disclosed and convergence tested (not claim sample-exact analytic controls). Four voice bodies with detached/releasing state still visible. First fixture your existing expressive chord lifecycle variants; musical fixture enhancement later. Please critique numerical/discontinuity limits and help scope bounded render cost. No transport/MIDI hardware claim.
