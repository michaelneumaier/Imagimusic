// Write the expression fixtures as MIDI Clip files (M2-116-U v1.0) from the independent encoder, with a report of hashes and the
// decoded round trip through the reader, parser and receiver adapter. Evidence that both sides agree with the specification's layouts;
// not interoperability evidence, which needs a Clip written by another application.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { composeExpressiveStudy, composeExpressiveChord, canonicalExpressionScore } from '../src/midi2/expression.js';
import { encodeExpressionClip, CLIP_ENCODE_DEFAULTS } from '../src/midi2/clip-encode.js';
import { parseMIDIClip } from '../src/midi2/clip.js';
import { importClipScore } from '../src/midi2/clip-score.js';

const out = process.argv[2] ?? 'renders/expression-clips', sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
await fs.mkdir(out, { recursive: true });
const report = { version: 1, encoder: { ...CLIP_ENCODE_DEFAULTS, layout: 'SMF2CLIP header; DCS 0, DCTPQ, DCS 0, Set Tempo; DCS 0, Start of Clip, DCS 0, Set Tempo; events with delta clockstamps (shared when simultaneous, NOOP restarts over the 20-bit field); DCS 0, End of Clip' }, files: [] };
for (const [name, score] of [['expressive-study', composeExpressiveStudy()], ['expressive-chord-detachReset', composeExpressiveChord()]]) {
  const sourceText = canonicalExpressionScore(score), { bytes, lastTick, events } = encodeExpressionClip(score);
  const file = name + '.midi2'; await fs.writeFile(path.join(out, file), bytes);
  const parsed = parseMIDIClip(bytes), imported = importClipScore(bytes, { name });
  // The receiver's score keeps the source's timeline (configuration included); with a zero-length configuration it must equal the source's events exactly.
  const strip = s => s.events.map(({ order, time, ...e }) => ({ time: +time.toFixed(9), ...e }));
  assert.deepEqual(strip(imported.score), strip(JSON.parse(sourceText)), name + ': decoded events equal the source events');
  assert.equal(parsed.origin.tick, 0); assert.equal(parsed.report.unsupported.length, 0);
  report.files.push({ file, bytes: bytes.length, sha256: sha(bytes), sourceCanonicalSha256: sha(sourceText), events, lastTick, decoded: { events: imported.score.events.length, originSeconds: imported.origin.seconds, endSeconds: imported.end.seconds, assumedTempo: parsed.report.assumedTempo } });
}
report.limitation = 'Round trip through our own reader, parser and adapter; it shows the encoder and the readers agree with M2-104-UM Table 30 and M2-116-U sections 5 to 7 as we read them, not that another application would read or write these files.';
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Clips → ' + out + ': ' + report.files.map(f => `${f.file} ${f.bytes} B ${f.sha256.slice(0, 12)} (${f.events} events)`).join(' | '));
