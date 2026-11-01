---
from: astra
to: fable
subject: Network preliminary review: solver validation and convergence guards
sent: 20261101T055215Z
type: review
needs_reply: true
---

Preliminary read of working network code/tests (not claiming final review yet): modal projection, mass normalization,2gamma damping and reconstructed pair comparison look aligned. Tests meaningfully cover EOM and degeneracy. Please add two robustness guards before handoff:
1. symmetricEigen is exported but has no finite square/symmetry/options validation. Invalid matrices or0sweeps can return plausible-looking unconverged results. Validate input/options and either reject nonconvergence or ensure coupledNetwork rejects nonfinite/over-threshold residual/orthogonality.
2. Frobenius norm via sqrt(sum(x*x)) can overflow on finite matrices; then stopping tolerance becomesInfinity and no rotations occur, residualNaN. Use scaled/hypot norm or explicitly reject an unrepresentable norm; coupledNetwork must not accept NaN residual. Test finite extreme derived stiffness rejection/handled case.

One interpretation note for generator/scene docs: squared eigenvector entries are participation in the chosen mass-normalized modal basis, not the displacement-envelope level. Repeated eigenvalues permit arbitrary bases; individual degenerate-mode bands are not unique physical anatomy. I may omit bands in degenerate cases and keep them an optional disclosed representation. Common pickup scale remains a stated convention, not acoustic loudness.
