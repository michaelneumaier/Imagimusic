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

test('container expectations and the verdict: a mismatched or missing container never counts as full verification', async () => {
  const {evaluateProbe, summarize} = await import('../tools/verify-grove-movie.mjs');
  const manifest = {width: 1280, height: 720, fps: 30, frames: 61, videoDuration: 61 / 30, sampleRate: 48000, duration: 2.025};
  const good = {streams: [{codec_type: 'video', codec_name: 'h264', width: 1280, height: 720, r_frame_rate: '30/1', nb_frames: '61', duration: '2.033333'}, {codec_type: 'audio', codec_name: 'aac', sample_rate: '48000', channels: 2, duration: '2.025333'}]};
  assert.ok(evaluateProbe(good, manifest).every(c => c.ok));
  const bad = structuredClone(good); bad.streams[0].nb_frames = '60'; bad.streams[1].duration = '2.3';
  const failed = evaluateProbe(bad, manifest).filter(c => !c.ok).map(c => c.name);
  assert.deepEqual(failed, ['video frame count equals the manifest', 'audio duration within [source, source + 4096 samples]']);
  const pass = [{name: 'x', ok: true}], fail = [{name: 'x', ok: false}];
  assert.equal(summarize({manifestChecks: pass, containerChecks: pass}).level, 'VERIFIED (manifest, soundtrack and container)');
  assert.equal(summarize({manifestChecks: pass, containerChecks: fail}).ok, false);
  assert.equal(summarize({manifestChecks: fail, containerChecks: pass}).ok, false);
  const partial = summarize({manifestChecks: pass, containerChecks: null, containerStatus: 'unverified: ffprobe unavailable or failed'});
  assert.ok(partial.ok && partial.level.includes('only') && partial.level.includes('ffprobe'));
});
