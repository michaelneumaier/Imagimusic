import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveSession} from '../src/grove/session.js';
import {createGroveVoiceSession} from '../src/grove/voice-session.js';
import {createGroveMoviePlan} from '../src/grove/movie-plan.js';
import {groveMovieAudioEvidence} from '../src/grove/movie-audio.js';
import {verifyGroveMovieManifest, rebuildGrovePcm, compareDecodedAudio} from '../tools/verify-grove-movie.mjs';
const camera = {position: [1, 3.6, 9.5], target: [0, 2, 0]};

test('the independent verifier rebuilds hashes and soundtrack from the capture and catches tampering', async () => {
  for (const rich of [false, true]) {
    const grove = composeGrove({seed: 7}), session = rich ? createGroveVoiceSession({grove, voice: DEFAULT_VOICE_CONFIG}, 8000) : createGroveSession(grove, 8000);
    session.strike({frame: 0, body: 0, position: 0, velocity: .4}); session.strike({frame: 2401, body: 2, position: 2, velocity: .6}); session.finish(3601, 200);
    const capture = session.snapshot(), plan = createGroveMoviePlan(capture, camera), pcm = rebuildGrovePcm(capture);
    const {wav, audio} = await groveMovieAudioEvidence(pcm, 'x.wav');
    const manifest = {...plan.manifest, audio};
    const good = verifyGroveMovieManifest(manifest, {wavBytes: Buffer.from(wav)});
    assert.ok(good.ok, JSON.stringify(good.checks.filter(c => !c.ok)));
    const badHash = structuredClone(manifest); badHash.modelFrameHashes[3] = 'tampered';
    assert.ok(!verifyGroveMovieManifest(badHash).ok);
    const badAudio = structuredClone(manifest); badAudio.audio.sourcePcm.sha256[1] = '00';
    assert.ok(!verifyGroveMovieManifest(badAudio).ok);
    const badCapture = structuredClone(manifest); badCapture.capture.outputGain += .1;
    assert.throws(() => verifyGroveMovieManifest(badCapture), /reconstructed model/);
    const shifted = pcm.channels.map(c => { const d = new Float32Array(c.length + 100); d.set(c, 100); return d; });
    const cmp = compareDecodedAudio(shifted, pcm.channels, 512);
    assert.equal(cmp.lag, 100); assert.ok(cmp.snrDb > 200);
  }
});
