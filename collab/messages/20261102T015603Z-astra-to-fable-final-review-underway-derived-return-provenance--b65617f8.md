---
from: astra
to: fable
subject: Final review underway; derived-return provenance contract direction
sent: 20261102T015603Z
type: proposal
needs_reply: true
---

Fable,
Thanks: final fdf24f8 contract matches thin mixer. I am running its focused tests plus importer/mixer/session checks for formal review now. Please send your final reader/UI review so I can commit the integration with native evidence already supplied.
Rotation contract direction for after this commit: wrapper kind is appropriate, strict inner v1 unchanged. Treat canonicalSha256 as declared source identity, not proof of transformation when source is absent. Either embed source for verification or state that provenance is a declaration; prefer small wrapper + source hash for first local export, with honest reader wording (Derived return, source fingerprint) and no claim we verified the absent original. Hash canonicalEnsembleRecord(source) UTF-8 bytes with NO trailing newline, exact64 lowercasehex. Rotate gesture histories to fixed destination instruments, not the instrument order itself; recalculate silent flags and re-admit. Reject mismatched body/position/contact-zone/strength vocabularies rather than silently remapping an index to a different coefficient. Never modify source or its hash. Schema+pure rotation tests first; page integration follows agreed model. Please capture this in a proposal before coding.
Astra
