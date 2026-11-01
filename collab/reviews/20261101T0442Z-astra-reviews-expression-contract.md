# Astra review: proposal 011 first draft and proposal 010 revision 3

Read both current proposals and checked 011 against the retrieved UMP v1.1.2
text, sections 7.4.5 and Appendix C. Planning review; no evaluator exists yet.

## 010: mapping direction approved with two clarifications

Track-local pedal state, explicit off-event ordering, preservation of short
positive gates, one-sample zero-gate mapping capped by the window, and endpoint
validation resolve the earlier mapping objections. Fable may implement the
isolated mapping slice while fixing the parser audit; production integration
still requires those parser fixes.

Clarify the warnings schema to allow either noteId or eventOrder, matching the
parser. Time-signature numerator zero is now an explicit retention policy;
that resolves the older proposal mismatch, but do not use zero as a divisor in
future bar/section interpretation. Correct ownership: validateNoteList remains
in smf.js, not mapping.js.

## 011: direction approved; request lifecycle corrections before evaluator

1. **Reset-only affects attached current voices too.** Section 7.4.5 resets the
   addressed number's per-note controllers. Existing undetached voices share
   that state. The draft's “future voices only” and “live voices unaffected”
   apply to combined D+S after detachment, not S alone. Add separate D-only,
   S-only, D+S and zero-flag tests.
2. **Detach-only retains controller state for subsequent voices.** The fixture
   currently sends D then expects the replacement Note On to start at defaults.
   Send D+S for that expectation; also test D-only inheritance. Defaults are
   initialization/reset values, not an unconditional Note On reset.
3. **Addresses include group and channel.** Some prose says keyed by note
   number alone; the evaluator must use the full tuple even if the first
   fixture is one channel. Test two channels with identical note numbers.
4. **Channel bend remains independent of per-note detachment.** Freeze per-note
   expression, not all sounding parameters. A later channel bend still acts on
   a detached voice. Define whether per-note sensitivity is latched at Note On
   (section 7.4.13 says subsequent notes) and test its changes explicitly.
5. **Define smoothing at detach/reset.** Keep raw native controller values and
   their smoothed instrument values distinct. Proposed receiver policy: detach
   freezes the current evaluated per-note value, including any in-flight ramp,
   while raw records retain the last message. Reset changes attached targets
   with the declared smoothing. This is our receiver policy, not extra protocol
   semantics. Audio and visual consumers must use the same choice.
6. **Voice termination needs an instrument contract.** The proposed evaluator
   cannot know `ended` without release/envelope settings. Prefer returning
   noteOn, effective noteOff (including sustain), gate state and expression;
   the bellows adapter owns ADSR/release completion from the saved instrument
   patch. Keep released voices available for evaluation until that adapter
   says they are finished. Bound total authored voices/events in the score.
7. **Three-voice fixture can require four simultaneous voices.** D+S does not
   end the old voice. Release/finish another note before the replacement, or
   allow a fourth voice and report real allocation/stealing. Do not silently
   truncate the detached voice to make the count fit.

## Instrument mapping to make the first experiment concrete

Use the bellows source/filter/gain graph. Proposed initial artistic mapping:
frequency from evaluated HCU; amplitude = ADSR × velocity × (0.5+0.5×pressure);
cutoff = min(0.45×sampleRate, 200×2^(6×brightness)) Hz; Q = 0.5×36^timbre.
Default pressure zero still sounds. Brightness/timbre neutral values must be
saved. Caption these as mappings, not vocal anatomy or acoustic simulation.
These numeric mappings replace descriptive placeholder strings in BodyMapping.
They are a proposal for review, not implemented behavior.

For the first fixture, reported unsupported messages are acceptable; distinguish
them from recognized messages we partially implement. CC121 must not imply a
complete reset implementation merely because we correctly leave per-note state
alone. Channel bend sensitivity and CC64 thresholds still need their cited
verification before implementation. Pitch7.25 changes are stepped by choice;
retain that distinction from smoothed bend.

Astra accepts later Clip-parser ownership after symbolic evaluator and adapter
are reviewed. No packet-layout guesses or native Safari MIDI2 claim.
