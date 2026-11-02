// "A memory, then an answer": an authored continuation listening pair, rendered offline through the production ensemble processor and host
// under mocked Web Audio plumbing, then kept through the verified seeding path. Proposal: collab/notes/fable-continuation-study.md.
// Case 1: the authored demonstration. Case 2: the demonstration replayed as a remembered opening on a fresh mount of the same instruments,
// then an authored answer on the G Grove after the barrier's handoff, ended by Quiet. Nothing here is a personal performance, a device
// recording, or an adaptive response; the mocked clock applies every remembered edge on its requested frame (a live run can differ).
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { composeGrove } from '../src/score/grove.js';
import { retuneGroveCluster } from '../src/score/grove-tuning.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe } from '../src/score/grove-rest.js';
import { composeEnsemblePhrase, ensembleRecords } from '../src/score/grove-ensemble.js';
import { ensembleRecordFromParts, canonicalEnsembleRecord, renderEnsembleRecord } from '../src/score/grove-ensemble-record.js';
import { continuationPlan } from '../src/score/grove-ensemble-continuation.js';
import { seedEnsembleRecord, verifySeededEnsemble, canonicalSeededEnsemble } from '../src/score/grove-ensemble-seeded.js';
import { createEnsembleHost } from '../src/grove/ensemble-host.js';
import { stereoWav } from '../src/loom/model.js';
import { openPhrasePlayer } from './open-phrase-player.mjs';

const out = process.argv[2] ?? 'renders/ensemble-continuation-study', sampleRate = 48000, sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const groves = [48, 51, 55].map(note => retuneGroveCluster(composeGrove({ seed: 3 }), note)), recipes = groves.map(grove => createGroveRestRecipe(grove, DEFAULT_VOICE_CONFIG, { sampleRate }));

// Production processor under mocked worklet globals (as tests/grove-ensemble-continuation-live.test.js).
const processors = {};
globalThis.sampleRate = sampleRate; globalThis.currentFrame = 0;
globalThis.AudioWorkletProcessor = class { constructor() { this.messages = []; this.port = { postMessage: m => this.messages.push(m) }; } };
globalThis.registerProcessor = (name, value) => { processors[name] = value; };
await import('../src/grove/ensemble-worklet.js');
function fixture(decisions) {
  let processor, node, nextFrame = 0; const audio = [[], []];
  const context = { sampleRate, currentTime: 0, state: 'running', destination: {}, audioWorklet: { addModule: async () => {} }, async resume() {}, async close() { this.state = 'closed'; } };
  const host = createEnsembleHost({ createContext: () => context, prepareRecipes: async () => ({ recipes }), createListeningStage: () => ({ input: {}, output: { connect() {} }, dispose() {}, setDb() {} }), createNode: (_, options) => {
    processor = new processors['imagimusic-grove-ensemble']({ processorOptions: options.processorOptions });
    node = { port: { postMessage: data => processor.port.onmessage({ data }), close() {} }, connect() {}, disconnect() {} }; return node;
  }, onDecision: decision => decisions.push(decision) });
  function block() { globalThis.currentFrame = nextFrame; const output = [new Float32Array(128), new Float32Array(128)]; processor.process([], [output]); output.forEach((c, ch) => audio[ch].push(...c)); nextFrame += 128; context.currentTime = nextFrame / sampleRate; for (const message of processor.messages.splice(0)) node.port.onmessage?.({ data: message }); }
  function until(condition, limit = 20000) { for (let i = 0; i < limit && !condition(); i++) block(); assert.ok(condition(), 'expected state within bounded render'); }
  return { host, block, until, audio, frame: () => nextFrame };
}

// Case 1: the authored demonstration, the source.
const source = ensembleRecordFromParts(ensembleRecords(recipes, composeEnsemblePhrase(recipes, { together: false, velocity: 0.5 }))), sourceText = canonicalEnsembleRecord(source);
const plan = continuationPlan(source, { sampleRate });

// Case 2: remembered, then answered. The answer uses exactly the Three Groves page's control vocabulary on the G Grove (part 2): the page's
// strike (body 0, position 1, velocity 0.5) and its hold (body 0, last zone, the strength named firm) and release; variety comes from timing only.
// The offsets are nominal targets; the host adds its own scheduling lead, so the report records the frames the processor actually applied.
const decisions = [];
const { host, block, until, audio, frame } = fixture(decisions);
await host.enable(groves);
const scheduled = host.scheduleContinuation(plan.steps.map(({ part, frame, command }) => ({ part, frame, command })), { handoffFrame: plan.handoffFrame });
assert.ok(scheduled.queued, 'the remembered opening must schedule on a fresh mount');
until(() => host.continuation.state === 'completed');
const boundary = host.continuation.boundaryFrame, at = seconds => boundary + Math.round(seconds * sampleRate);
const recipe = host.recipes[2], strike = { kind: 'strike', body: 0, position: 1, velocity: 0.5 }, hold = { kind: 'contact', body: 0, zone: recipe.zones.length - 1, strength: recipe.strengths.findIndex(s => s.name === 'firm') }, release = { kind: 'contact', body: 0, zone: null };
assert.ok(hold.strength >= 0, 'the recipe names a firm strength');
const answer = [[0.6, 'strike', strike], [1.7, 'strike', strike], [2.6, 'hold', hold], [4.4, 'release', release], [5.0, 'strike', strike]];
const sent = [];
for (const [seconds, name, command] of answer) { until(() => frame() >= at(seconds) - 2048); const result = host.send(2, command); assert.ok(result.queued, `answer gesture refused: ${result.reason}`); sent.push({ name, nominalSecondsAfterHandoff: seconds, id: result.id ?? null, command }); }
until(() => frame() >= at(9.5)); host.quiet(); until(() => host.state === 'ended');
const ensemble = host.recording(), continuation = host.continuation;
// The answer's actual decisions, from the host's acknowledgement stream: every answer gesture must have been accepted by the processor.
const answerDecisions = decisions.filter(d => d.part === 2 && typeof d.id === 'string' && d.id.startsWith('gesture-')).sort((a, b) => a.appliedFrame - b.appliedFrame);
assert.equal(answerDecisions.length, answer.length + 0, 'one decision per answer gesture'); assert.ok(answerDecisions.every(d => d.accepted === true), 'every answer gesture accepted');
const origin0 = continuation.originFrame, answerReport = answerDecisions.map((d, i) => ({ gesture: answer[i][1], command: answer[i][2], nominalSecondsAfterHandoff: answer[i][0], requestedFrame: d.requestedFrame - origin0, appliedFrame: d.appliedFrame - origin0, secondsAfterHandoff: +((d.appliedFrame - continuation.boundaryFrame) / sampleRate).toFixed(4), accepted: d.accepted }));
const continued = await seedEnsembleRecord({ source, continuation, ensemble }), verification = await verifySeededEnsemble(continued, source);
assert.equal(verification.verified, true, 'the kept continuation must verify against the retained source: ' + verification.mismatches.join('; '));
host.dispose();

// Renders from the kept records; the continued render must equal what the processor produced.
const originalPcm = renderEnsembleRecord(source), continuedPcm = renderEnsembleRecord(ensemble), origin = continuation.originFrame;
for (let ch = 0; ch < 2; ch++) assert.deepEqual(Float32Array.from(audio[ch].slice(origin, origin + continuedPcm.channels[ch].length)), continuedPcm.channels[ch], 'processor output equals the kept record\'s render');
await fs.mkdir(out, { recursive: true });
await fs.writeFile(path.join(out, 'original.json'), sourceText + '\n');
const continuedText = canonicalSeededEnsemble(continued) + '\n'; await fs.writeFile(path.join(out, 'continued.json'), continuedText);
const cases = [];
const seconds = pcm => (pcm.channels[0].length / sampleRate).toFixed(1) + ' s';
for (const [name, label, pcm] of [['original', 'Authored passage · original · ' + seconds(originalPcm), originalPcm], ['continued', 'The same passage, remembered · then an authored answer · ' + seconds(continuedPcm), continuedPcm]]) {
  const wav = Buffer.from(stereoWav(pcm)); await fs.writeFile(path.join(out, name + '.wav'), wav);
  let peak = 0; for (const ch of pcm.channels) for (const v of ch) peak = Math.max(peak, Math.abs(v));
  cases.push({ name, label, file: name + '.wav', wavSha256: sha(wav), frames: pcm.channels[0].length, peak });
}
const ledger = continued.opening.ledger, report = {
  version: 1, sampleRate, origin: 'Authored demonstration remembered as an opening, then an authored answer on the G Grove; rendered offline from kept files through the production processor under a mocked clock. Not a personal performance, a device recording, or an adaptive response.',
  sourceCanonicalSha256: sha(sourceText), continuedFileSha256: sha(continuedText), handoff: continued.opening.handoff, boundaryFrame: continued.opening.boundaryFrame, boundarySeconds: continued.opening.boundaryFrame / sampleRate,
  remembered: { scheduled: ledger.length, accepted: ledger.filter(e => e.accepted === true).length, refused: ledger.filter(e => e.accepted === false).length, notReached: ledger.filter(e => e.accepted === null).length, timingChanged: verification.timingChanged },
  answer: { vocabulary: 'the Three Groves page controls: strike body 0 at position 1 with velocity 0.5; hold body 0 at the last zone with the strength named firm; release', note: 'nominal offsets are targets; the host adds its scheduling lead, so the applied frames below are the authority', gestures: answerReport }, verification: { verified: verification.verified, partial: verification.partial, mismatches: verification.mismatches },
  limitation: 'The remembered opening omits the source\'s terminal Quiet fade (its ending becomes the handoff). The mocked clock applies every remembered edge on its requested frame: a controlled study condition, not live timing clearance; a live run can apply edges late, which the kept file records (one native run applied the first strike 112 frames late). Levels are the model\'s; no claim about hearing or preference.',
  cases,
};
await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
await fs.writeFile(path.join(out, 'index.html'), openPhrasePlayer({
  title: 'A memory, then an answer',
  intro: 'An authored passage returns as a remembered opening on the same three instruments. After the engine hands the instruments over, an authored answer on the G Grove joins what still rings, using only the gestures the Three Groves page offers: its strike and its firm resting hand. The handoff is at ' + report.boundarySeconds.toFixed(2) + ' s of the second example.',
  question: 'Where does the opening end and the answer begin, to your ear? What changes when the answer arrives?',
  disclosure: 'Reduced vibrating-body models with virtual pickups. Both the passage and the answer are authored and rendered offline from kept files; this is not a personal performance, a device recording, or an adaptive response. The remembered opening omits the original passage’s closing Quiet fade, so the second example is longer and its opening runs on into the answer. Under the offline clock every remembered gesture lands on its planned frame, a controlled study condition rather than a live-timing result; a live run can differ. Three independent instruments, fixed one-third mix, no resampling, no normalisation; levels are the model\'s own. Nothing is claimed about how this sounds.',
  cases, playLinkLabel: 'Play Three Groves ↗', playLinkHref: '../../ensemble.html', listeningDb: 20, listeningKey: 'imagimusic-ensemble-listening-db',
}));
console.log(`A memory, then an answer → ${out}: handoff ${report.boundarySeconds.toFixed(3)} s, remembered ${report.remembered.accepted}/${report.remembered.scheduled} accepted (late: ${report.remembered.timingChanged}), continued ${cases[1].frames} frames, verified ${verification.verified}`);
