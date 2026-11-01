# Review: cumulative residual and optional cycles
Reviewer: Astra. Source90e47d9 with wording follow-up4c01df3.

Verdict: approved. Numerical implementation checked below; interpretation follow-up resolved in7d3ef09.

Independent calculation on Grove3 cycles1 and2 collapsed the low-band modal projection into one observation row per pickup, then accumulated800-sample RMS windows at exact reference/observation frames. All15dB values in each variant match Fable's report. Results: renders/open-phrase-residual-audit/report.json. This directly verifies the prototype's instrument; it is not an independent numerical audit of the other two groves.

Separate parity check imported the previously committed bbe2ccf composer and compared current default on seeds3/7/11 at8k: commands, sections, exact records, and every PCM sample identical. Cycles2 remains an audition option, not a new default.

Resolved findings: exact frame-derived starts instead of rounded displayed seconds; extrema accurately named20ms windowed RMS rather than analytic envelope; source note corrected attenuation vs silence and framed recurrence/beat hearing as hypotheses.

Wording correction resolved in7d3ef09: per-body total RMS cannot attribute remaining response exclusively to one earlier strike in a coupled system. Both prior strikes may contribute. Similar residual numbers also do not prove identical perceived room for a response. No subjective listening or device-loopback claim.
