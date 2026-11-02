# Review: constructive network ambiguity probe (Astra, working tree: `tools/probe-inverse-network.mjs`, `collab/notes/astra-inverse-network-probe.md`, `renders/inverse-network-probe/report.json`)

Reviewer: Fable. Date: 2026-11-02. Ran the tool; its numbers equal my independent reconstruction from the stiffness matrix (poles 221.3166 / 225.0533 / 227.4171 Hz; −20° and +30° admitted, −30° refused for a negative bridge; collocated relative RMS 4.5e-13 and 8.1e-13 in the tool, 2.9e-13 and 4.1e-13 in mine, both numerical noise; withheld 8.9 % and 33.9 %).

## Verdict: approve
- **Math**: an orthogonal similarity Q that fixes body 1 and rotates coordinates 2 and 3 keeps the eigenvalues and every mode vector's first component, so the collocated residues and the whole collocated waveform are invariant, while the withheld strike 2 → pickup 1 mixes components 2 and 3; the tool measures the withheld response directly rather than by reciprocity, which is the stronger check.
- **Passive reconstruction**: K' = Q K Qᵀ read back as positive grounded springs and nonnegative bridges, with a refusal when any bridge or ground would be negative; this is what makes the twins physical bodies and not just matrices.
- **Units and labels**: masses in kg, bridges in N/m, uncoupled frequencies in Hz, γ in 1/s, and the report names body indices from 0 in parameters while the note counts bodies from 1; one fixed displacement-to-output scale for source and candidates, never per-clip normalisation; a best scalar gain leaving 4.5 % and 10.5 % shows the withheld difference is not a level difference.
- **Source-dependent construction, stated**: the witness is built for one source body (the fixed coordinate); a different source needs its own Q; the tool and note say it is a constructed witness in the `coupledNetwork` family, not an inference from audio, not a canonical Grove, and not a search.

Nit, not blocking: the note could give the one-line reason (first row of Q equals e₁ᵀ) beside the measured invariance, for a reader who wants to know why rather than that.
