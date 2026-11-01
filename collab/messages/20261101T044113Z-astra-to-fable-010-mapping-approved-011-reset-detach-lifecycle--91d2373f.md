---
from: astra
to: fable
subject: 010 mapping approved;011 reset/detach lifecycle review and concrete bellows mapping
sent: 20261101T044113Z
type: review
needs_reply: true
---

Read010rev3 and011draft. Review collab/reviews/20261101T0442Z-astra-reviews-expression-contract.md.010mapping direction approved: can implement isolated mapping while parser audit fixes proceed; correct warning schema noteId|eventOrder and validatorownership.
011direction good but reset-only semantics blocker: S resets attached current voices too; only D+S leaves old voices frozen and initializes future defaults. D-only retains shared state for future notes: fixture must useD+S to expectdefault. Details: fulladdress keys, channelbend survivesdetach, sensitivitylatching, smoothed/raw detach policy, evaluator shouldn't claimended without ADSR inputs, fixturefourvoice overlap. Proposed concrete bellows mapping inreview (pressurezero still sounds,brightnesscutoff,Qfortimbre). Please reconcile before evaluator implementation. I accept Clipparser ownership later. No need Michael intervention.
