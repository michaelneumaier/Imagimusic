# Proposal 012: the Loom journey, a short listening study (and the listening doorway)

*Fable, 2026-11-01, at Astra's request after Michael asked us to keep going,
get creative, and make something people want to return to. Score, tests and
this contract are Fable's (`src/score/loom-journey.js`); the listening page
is Astra's. Uses the existing static coupling model only; nothing
time-varying, nothing decorative.*

## What it is

A passage of about half a minute for the Tension Loom's two coupled bodies,
shaped **solo → response → intertwining → silence**, in three named
settings that differ only in the physical parameters the model already has.
The first thing a listener hears is a relationship that is real in the
model: one body is struck and the other, never touched, sounds because the
bridge carries energy across. The study is offered as the project's
doorway: no controls at first, a title, four chapters, and a way into the
full stage afterwards.

## Shape (beats at 84 BPM, lead 0.35 s)

| Section | Beats | What happens | Why |
| --- | --- | --- | --- |
| One gesture (solo) | [0, 6) | body 0 struck at 0, 2.5, 4.5; body 1 never struck | the unstruck body sounding is the relationship, noticed before it is "played" |
| An answer, late (response) | [6, 12) | body 1 at 7.5, body 0 at 9, body 1 at 10.5 | the first answer arrives a beat and a half after the section begins: expectation, then arrival |
| Interweaving | [12, 20) | alternation 12/13/14/14.75/15.5/16/16.5/16.75, both at 18, body 0 at 19.5 | answers draw closer; one shared strike; a last lead |
| Let it finish (silence) | [20, …) | nothing struck | the coupled ring decides the length |

Coherent impulses: each role uses one velocity (solo 0.7, answer 0.55, weave
lead 0.6 / reply 0.45, shared 0.7, last 0.5). Duration = last strike + the
setting's ring, bounded to 15–35 s by the validator.

## Three settings and what they actually do (measured by `describeLoomSetting`, not asserted)

| Setting | coupling | detune | loss | normal modes (Hz) | exchange rate (mode split) | modal amplitude ratio (unstruck / struck) | ring | duration |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Close kin | 0.004 | 0 ¢ | 0.45 | 196.00 / 196.78 | 0.78 Hz (period 1.28 s) | 1.00 | 17.8 s | 32.1 s |
| Distant cousins | 0.004 | 40 ¢ | 0.45 | 196.36 / 201.00 | 4.64 Hz (0.22 s) | 0.08 | 17.8 s | 32.1 s |
| Tight weave | 0.012 | 0 ¢ | 0.7 | 196.00 / 198.34 | 2.34 Hz (0.43 s) | 1.00 | 11.4 s | 25.8 s |

Musical meaning of the numbers:
- **Close kin:** identical bodies; the unstruck body's largest modal
  displacement equals the struck one's (ratio 1.00), and the motion passes
  between them at the 0.78 Hz mode split; the slowest conversation and the
  longest ring. The unstruck body in the solo is unmistakable.
- **Distant cousins:** forty cents apart; the unstruck body's largest modal
  displacement is 8% of the struck one's, and what does cross is heard as a
  4.6 Hz beat between two close pitches (below the 8 Hz visible-beat limit,
  so the picture shows it too). The solo's unstruck body is quieter; the
  answer in the response section is therefore more of an event.
- **Tight weave:** three times the coupling and more loss: exchange every
  0.43 s and a ring under twelve seconds, so the interweaving reads as quick
  replies and the silence arrives sooner.

All three are the same linear system struck the same way; the differences
are the model's. The "modal amplitude ratio" is a ratio of modal
displacement amplitudes from the pickup modes of a body-0 strike, not an
energy fraction and not a ratio of peaks over time (Astra's correction);
"exchange rate" is the normal-mode split. The chapter text never calls a
body silent when the coupling excites it ("One gesture", not "one voice
alone") and never claims an energy quantity the model does not report.

## API (landed)

```js
composeLoomJourney({ setting = 'close-kin', tempo = 84, lead = 0.35 }) -> LoomJourney   // version, setting, settings, tempo, lead, sections, strikes
validateLoomJourney(j), canonicalLoomJourney(j)         // strict keys; the promise is validated (solo strikes body 0 only, first body-1 strike ≥ 1 beat into the
                                                         // response, nothing struck in the silence, duration within 15–35 s, model bounds via makeLoom)
loomScoreFrom(j) -> [{ time, body, velocity }]           // createLoomPerformance's input, seconds with lead
journeyDuration(j), journeySectionAt(j, t), describeLoomSetting(settings)
getLoomJourney(id, options?) -> { id, title, description, settings, score, chapters: [{ id, time, title, description }], durationSeconds, measured, journey }
LOOM_JOURNEY_IDS, LOOM_JOURNEYS                          // frozen; getLoomJourney returns a fresh object each call
```

Astra's page derives the duration through `createLoomPerformance(settings,
score)` (the test asserts it equals `durationSeconds`), shows the chapter
whose time is the last ≤ t, and offers no technical controls at first.

## Evidence (tests/loom-journey.test.js, 5 tests)

Determinism and canonical stability; compilation through the real Loom
performance with the model-decided duration inside the bound for every
setting; the solo strikes body 0 only while `loomPerformanceFrame` shows
body 1's envelope above zero unstruck; the first answer at least a beat
into the response; weave alternation with gaps that only shrink; one shared
strike; nothing struck in the silence with at least five seconds of ring;
one velocity per role; the three settings ordered as the table says,
measured from the model; validator rejections for each broken promise; the
doorway API's freshness, immutability and wording rule.

## Product appeal (Astra asked what makes a person stay and return)

- **Stay:** the first fifteen seconds must contain one unmistakable
  surprise that the picture explains: the untouched body sounding. Say it
  in the chapter text before it happens and let the camera rest on the
  bridge. One idea at a time; no controls on the first screen.
- **Return:** three settings that are the same thing changed in one honest
  way, with a sentence each on what changed, invite comparison the way a
  listener compares takes. Add "play again" and "switch setting" and
  nothing else at first. Later, the conversation score and the MIDI desk
  are the second and third doors, each a step deeper.
- **Trust:** every sentence on the page describes something the model does;
  the inspector is one click away for anyone who wants to see why. That is
  the project's difference from a visualizer, and the thing worth returning
  for.
- **Share:** the movie export already works; a listening page that can
  hand you a verified movie of what you just heard is a reason to send it
  to someone.
- **Don't:** no autoplay, no loudness tricks, no spectacle in the first
  minute; a quiet, stable setting makes the small change extraordinary
  (VISION, restraint and contrast).

## Not in scope

No time-varying coupling (that is model work with its own evidence), no
perceptual presentation layer yet, no claim of universal effect.
