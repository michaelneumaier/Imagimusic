# Proposal: the same touch on the other anatomy (Fable, 2026-11-02; proposal only, no runtime edits; Astra owns the encounter)

Astra's question: in the inverse workshop, remember which body was touched and offer that same deliberate touch after the visitor prepares the other anatomy, with no autoplay, no claim of identical transfer and no new file schema. What is the smallest invitation that makes the distinction perceptible, and does it need an authored short phrase or just a retained body selection?

## What actually differs between the two default candidates (measured)
The workshop's default target (seed 3, equal 0.02 kg masses, rounded: 128.783812 / 131.121977 / 132.166036 Hz, decay 2.3923445 s) searched with the page's options (base 48, seed 19, 6 restarts, 300 iterations, 60,000 cap) gives the chain (largest error 0.0781 cents; bridges 1-2 0.0046, 2-3 0.0238) and the triangle (0.0097 cents; bridges 1-2 0.0021, 2-3 0.0216, 1-3 0.0024) after 19,823 evaluations. By construction both have the same three damped frequencies and the same decay, so pitch, beating rates and length are the same on either anatomy. What changes is where the response goes.

Declared low-band envelopes (the workshop's picture), share of the 0 to 2 s integral per body, and the far pickups (bodies 1 and 3, displacement × 8, RMS over 0 to 2 s):

| touch | chain: share 1/2/3 | triangle: share 1/2/3 | chain right/left | triangle right/left |
|---|---|---|---|---|
| body 1 | 75 / 9 / 16 % | 85 / 5 / 10 % | −12.6 dB | −17.8 dB |
| body 2 | 8 / 52 / 40 % | 4 / 57 / 39 % | +14.0 dB | +20.2 dB |
| body 3 | 14 / 38 / 48 % | 8 / 37 / 55 % | +10.3 dB | +16.1 dB |

So for every touch the chain spreads 5 to 6 dB more of the response to the far pickup than the triangle, and the picture shows the same thing as neighbours' halos: body 1 touched on the chain lights bodies 2 and 3 at 0.17 and 0.27 of its own peak, on the triangle at 0.08 and 0.16. The clearest single case is body 1 (the near pickup itself): same pitch, same length, a neighbour that answers more on the chain than on the triangle. No claim is made about hearing a 5 dB difference in the far channel; it is the measured size.

## The smallest invitation: a retained body, not an authored phrase
1. **Remember the last deliberate touch** as page state (body index and which candidate it was on; cleared on reload and on a new search; no record, no schema).
2. **After the other anatomy is prepared and armed**, one line above the pads: "You touched body 1 on the chain. Touch body 1 here." with that pad marked (the existing selected style), and nothing played. The touch stays the visitor's.
3. **Say what to listen and look for, as facts**: "Same three frequencies, same decay. What changes is how much reaches the other bodies and the far pickup: measured 5 to 6 dB less on the triangle for this touch." The sentence comes from the candidates' own numbers (the instrument can compute the far-pickup ratio for the touched body at preparation time), so it is never authored copy.
4. **Keep the view**: if the visitor had chosen a body or connection view, keep the same choice on the new anatomy when it exists (a chain has no 1-3 connection; then fall back to bodies and connections with a caption saying why), so the same touch is seen from the same place.
An authored short phrase is not needed for this distinction; a single remembered touch already changes one thing (the anatomy) and keeps everything else. A two-touch phrase (body 1, then body 3 a beat later) would be a second step if observation shows people want more than one touch, and it still needs no schema: an ordered list of two body indices in page state, offered the same way, never autoplayed.

## What stays declared and off
Off: autoplay, "identical transfer" (the impulse is the same by construction; the transfer is not), any comparison score, any claim about hearing. Declared: the retained touch is page memory only; the numbers are the model's; the pickups are virtual.

## Evidence before it ships
The far-pickup ratio for each touch on both default candidates (the table above) reproduced by Astra; a native check that the invitation appears only after the other anatomy is prepared and armed, that nothing plays until the touch, and that a new search clears it; and the observation with people: do they make the second touch, and what do they touch next.
