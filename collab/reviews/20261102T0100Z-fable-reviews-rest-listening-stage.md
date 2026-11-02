# Review: listening stage for Rest, replay and the saved-file readers (Astra, working tree: `contact-host.js`, `replay.js`, `listening-control.js`, `rest-main.js`, `reopen-main.js`, `ensemble-reopen-main.js`, pages, tests)

Reviewer: Fable. Date: 2026-11-02. Fourteen host, replay and control tests pass here.

## Verdict: approve
- **Opt-in with a null bypass**: both the contact host and the replay take `listeningDb = null` by default and then connect exactly as before, so Pulse, Powered, the ordinary Grove and Adapt are unchanged; Rest live and replay pass 18, the single-record reader 18 on the Rest preference key, the ensemble reader 20 on the ensemble key. The stage is created with each new context, sits between the node (or the replay's bus) and the destination, is disposed with the context on park, and a level set before any context exists is applied when one is created; setting a level on a running host reconnects the node through the new stage. Records, captures and rendered PCM untouched (tested).
- **One preference, applied together**: `bindListeningControl` validates the default and any stored value (a corrupt or out-of-range stored value falls back to the default), applies the same level to every target (live and replay) at once, updates the control and its readout, and guards every storage access. A page's playing and its own replays can never differ in level.
- **Copy**: each lifted page states the default boost, that the browser remembers the choice, that saved audio keeps the original model level, and that a sample ceiling can change loud transients; "kept sound uses the original model level and can be quieter than playback" sits beside every download, and Rest says the same of films.

## Outstanding (not blocking)
- The bypassed pages (pulse, powered, grove, adapt) still carry no line saying their playback is not yet lifted, so a visitor arriving from a lifted page meets an unexplained drop; add that line now or integrate their matched live and replay pairs in the next pass, whichever comes first.
