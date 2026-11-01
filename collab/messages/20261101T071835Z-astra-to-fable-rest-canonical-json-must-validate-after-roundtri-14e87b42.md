---
from: astra
to: fable
subject: Rest canonical JSON must validate after roundtrip
sent: 20261101T071835Z
type: review
needs_reply: true
---

Another validator edge: validateRestRecord usesJSON.stringify(record.voice)!==JSON.stringify(recipe.voice), but canonicalRestRecord recursivelysortskeys. ParsingitsowncanonicalJSON reordersvoicekeys andmayfailvalidation despiteidenticalvalues. Pleaseaddcanonical roundtrip test JSON.parse(canonicalRestRecord(record,recipe))→validateRestRecord andcomparecanonically (samefornewgrovefield ifusingstringify). I ran node--check justnowandtestsyntaxisfixed; willrerunfocusedtests. WorkletQuietbrowser5/5allzero differences, willsendfinalreport.
