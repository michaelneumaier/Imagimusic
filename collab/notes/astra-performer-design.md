# Performer direction: the Keepers

The stage needs identifiable players, not a decorative conductor. Each instrument has a small mechanical keeper whose visible endpoint is the exciter already producing its sound. Their character comes from preparation, contact and recovery. This is interpreted choreography, not a claim that actuator forces are simulated.

## First rig

A grounded brass shoulder, two slender articulated links and a padded mallet. The shoulder belongs to a separate performer root, located relative to the instrument anchor. Its hand is the existing striker endpoint: replacing a floating mallet must not move the contact timestamp or change strike position. The keeper rests with its arm folded when silent; anticipation extends the arm before the note. The elbow is a deterministic geometric solution from shoulder and hand, with a fixed bend direction. No history-dependent inverse-kinematics solver or random idle animation.

Garden and tine keepers use different proportions. The garden's body rises along the post to the strike height; the tine keeper has a low horizontal stance beside the clamp. This avoids pretending one fixed-length arm can reach every editable geometry. Mount movement is labeled as an interpreted motorized carriage. The tine's geometrical mode shapes and frequencies remain unchanged.

The Bellows Choir gets a pump operator later: a crosshead visibly follows the modeled envelope, with an intake/release gesture. Do not imply measured pressure or a physical air simulation. It should expose the current voice's envelope and note-off, including stealing, rather than breathe to an unrelated global metronome.

## Contract with the planner

The pure planner owns event identity, body target, approach/contact/recover phase, visibility, contact position and force/velocity label. Scene code owns only shape and body-relative-to-world transforms. Score and microphone performance sources can eventually use the same gesture interface; voice capture is still planning only.

Keep contacts per event when overlapping gestures demand it. A single mallet silently choosing the latest overlapping note is not a general performer solution. Allocate a bounded pool per instrument or visibly acknowledge limited gesture coverage; never drop audio to make the animation easier. Sustained oscillation does not need a striker to remain on the surface.

## Evidence before closing this slice

- Contact time agrees with audio note-on; approach is visible before onset and recovery follows it.
- Render at t, seek elsewhere, return to t: identical endpoint, joints and phase.
- Editable geometry and contact position preserve a reachable, finite rig; clamped endpoint and branch choices are deterministic.
- Retired/stolen voices keep the same visual release semantics as the audio.
- Overlapping strikes remain represented or explicitly bounded; no unexplained teleportation between bodies.
- Inspector can trace the performer to its event and excitation inputs.
- One browser passage and one exported clip show the same gestures; actor transforms are included in frame hashes.
