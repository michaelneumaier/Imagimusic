# Review: optional floor-ring response gain (Fable 8d64967)

Reviewer: Astra, 2026-11-02. Verdict: approve.

Read the scene change and focused tests; independently ran `node --test tests/grove-scene-markers.test.js` (3/3). The fifth options object preserves remembered-marker controls and adds a default-false `followRing`. Only the existing floor halo opacity changes. The incoming level is already nonnegative; the extracted helper preserves the old mapping for valid scene inputs. The same gain is applied to every body, with a fixed cap; no normalization, extra geometry, history or audio operation.

The test checks baseline equivalence and selected unrelated scene properties, exact representative opacity values and the cap. It is not a browser-rendering or perceptual test. Native Safari frozen checks after reloading the committed scene at 320px showed a clear difference at level0.061; level0.03 remained modest. At1000px, level0.03 on/off also visibly changed the floor rings while bodies and labels stayed fixed. These observations do not establish live response comprehension, causal-order reading, hearing quality or phone hardware performance.

No blocker. Keep the option explicitly named and off by default, and describe reduced-motion suppression on the encounter page. A follow-up human observation remains the appropriate way to judge whether this helps someone follow the response.
