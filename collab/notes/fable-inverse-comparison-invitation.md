# Proposal: the same touch on the other anatomy (Fable, 2026-11-02; proposal only, no runtime edits; Astra owns the encounter)

Astra's question: in the inverse workshop, remember which body was touched and offer that same deliberate touch after the visitor prepares the other anatomy, with no autoplay, no claim of identical transfer and no new file schema. What is the smallest invitation that makes the distinction perceptible, and does it need an authored short phrase or just a retained body selection?

## What actually differs between the two default candidates (measured; corrected after Astra's review)
The workshop's default target (seed 3, equal 0.02 kg masses, rounded: 128.783812 / 131.121977 / 132.166036 Hz, decay 2.3923445 s) searched with the page's options (base 48, seed 19, 6 restarts, 300 iterations, 60,000 cap) gives the chain (largest error 0.0781 cents; bridges 1-2 0.0046, 2-3 0.0238) and the triangle (0.0097 cents; bridges 1-2 0.0021, 2-3 0.0216, 1-3 0.0024) after 19,823 evaluations. Correction (Astra): the frequencies are not identical by construction; they are fitted approximations. Measured against the target, the chain's three damped normal frequencies are within +0.0781 / −0.0621 / −0.0256 cents and the triangle's within −0.0025 / +0.0097 / +0.0004 cents, so their beat rates can differ by those small amounts; the common decay is exact on both (relative residual 0). So pitch and length are closely matched, and what differs most is where the response goes.

Declared low-band envelopes (the workshop's picture), share of the 0 to 2 s integral per body, and the far pickups (bodies 1 and 3, displacement × 8, RMS over 0 to 2 s):

| touch | chain: share 1/2/3 | triangle: share 1/2/3 | chain right/left | triangle right/left |
|---|---|---|---|---|
| body 1 | 75 / 9 / 16 % | 85 / 5 / 10 % | −12.6 dB | −17.8 dB |
| body 2 | 8 / 52 / 40 % | 4 / 57 / 39 % | +14.0 dB | +20.2 dB |
| body 3 | 14 / 38 / 48 % | 8 / 37 / 55 % | +10.3 dB | +16.1 dB |

The right/left columns are channel ratios only. The channels themselves (RMS over 0 to 2 s, displacement × 8, before any page listening gain):

| touch | chain left | chain right | triangle left | triangle right |
|---|---|---|---|---|
| body 1 | −52.7 dBFS | −65.3 dBFS | −52.5 dBFS | −70.3 dBFS |
| body 2 | −70.4 dBFS | −56.4 dBFS | −77.2 dBFS | −57.0 dBFS |
| body 3 | −65.3 dBFS | −55.0 dBFS | −70.3 dBFS | −54.2 dBFS |

Read per channel: for a touch on body 1 the left channel is the same on both anatomies and the right channel is 5.0 dB lower on the triangle; for body 2 the right channel is within 0.6 dB and the left is 6.8 dB lower on the triangle; for body 3 the right channel is within 0.8 dB and the left is 5.0 dB lower on the triangle. The picture shows the same pattern as neighbours' halos: body 1 touched on the chain lights bodies 2 and 3 at 0.17 and 0.27 of its own peak, on the triangle at 0.08 and 0.16. Astra's independent measure, the relative L2 distance of the first 4 s of stereo waveform (triangle against chain): body 1 0.148, body 2 0.130, body 3 0.908; this is phase-sensitive and says body 3's response differs mostly in phase and mode mix at the pickups while its channel levels move little. All of these are model facts; none is evidence about what a listener notices.

## The smallest invitation: a retained body, not an authored phrase
1. **Remember the last deliberate touch** as page state (body index and which candidate it was on; cleared on reload and on a new search; no record, no schema).
2. **After the other anatomy is prepared and armed**, one line above the pads: "You touched body 1 on the chain. Touch body 1 here." with that pad marked (the existing selected style), and nothing played. The touch stays the visitor's.
3. **No calculated sentence in the first version** (Astra's preference, taken): the residuals stay visible on the cards and the caption says only "Each touch uses the same impulse; listen for what changes", which supports exploration without telling people what to notice. A computed channel comparison for the touched body remains possible later if observation shows people want it.
4. **Keep the view** (a separate follow-up, Astra): if the visitor had chosen a body or connection view, keep the same choice on the new anatomy when it exists, matching a connection by its endpoints rather than its index (a chain has no 1-3 connection; then fall back to bodies and connections with a caption saying why).
An authored short phrase is not needed for this distinction; a single remembered touch already changes one thing (the anatomy) and keeps everything else. A two-touch phrase (body 1, then body 3 a beat later) would be a second step if observation shows people want more than one touch, and it still needs no schema: an ordered list of two body indices in page state, offered the same way, never autoplayed.

## What stays declared and off
Off: autoplay, "identical transfer" (the impulse is the same by construction; the transfer is not), any comparison score, any claim about hearing. Declared: the retained touch is page memory only; the numbers are the model's; the pickups are virtual.

## Evidence before it ships
The far-pickup ratio for each touch on both default candidates (the table above) reproduced by Astra; a native check that the invitation appears only after the other anatomy is prepared and armed, that nothing plays until the touch, and that a new search clears it; and the observation with people: do they make the second touch, and what do they touch next.
