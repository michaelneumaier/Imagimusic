// Independent verifier for a Grove movie manifest (proposal 016): rebuilds the model, the frame hashes and the
// soundtrack from the saved capture through the same factories, never trusting the saved hashes; optionally
// inspects the MP4 with ffprobe/ffmpeg and compares the decoded AAC to the source at its best alignment.
//   node tools/verify-grove-movie.mjs <manifest.json> [movie.mp4] [movie.wav]
import {readFileSync, existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {createGroveSession} from '../src/grove/session.js';
import {createGroveVoiceSession} from '../src/grove/voice-session.js';
import {renderGroveBank} from '../src/grove/performance.js';
import {renderVoiceBank} from '../src/grove/voice-performance.js';
import {mixImpulseRecording} from '../src/touch/session.js';
import {createGroveMoviePlan} from '../src/grove/movie-plan.js';
import {stereoWav} from '../src/loom/model.js';

const sha256 = bytes => createHash('sha256').update(Buffer.from(bytes)).digest('hex');
const floatBytes = channel => { const b = Buffer.alloc(channel.length * 4); for (let i = 0; i < channel.length; i++) b.writeFloatLE(channel[i], i * 4); return b; };

/** Rebuild the soundtrack from a capture exactly as the page does: session → bank → mix. */
export function rebuildGrovePcm(capture) {
  const rich = capture.kind === 'imagimusic-grove-voice';
  const session = rich ? createGroveVoiceSession({grove: capture.grove, voice: capture.voice}, capture.sampleRate) : createGroveSession(capture.grove, capture.sampleRate);
  for (const event of capture.events) if (!session.strike(event).accepted) throw new Error('capture event not admitted on rebuild');
  if (capture.ended) session.finish(capture.ended.frame, capture.ended.fadeFrames);
  return mixImpulseRecording(capture, (rich ? renderVoiceBank : renderGroveBank)(session.instrument));
}

/** Pure checks on the manifest (and the WAV bytes when given). Returns { ok, checks: [{name, ok, detail}] }. */
export function verifyGroveMovieManifest(manifest, {wavBytes = null} = {}) {
  const checks = [], check = (name, ok, detail = '') => { checks.push({name, ok, detail}); };
  const plan = createGroveMoviePlan(manifest.capture, manifest.camera);
  const m = plan.manifest;
  check('frame hashes recomputed from the capture equal the manifest', m.modelFrameHashes.length === manifest.modelFrameHashes.length && m.modelFrameHashes.every((h, i) => h === manifest.modelFrameHashes[i]), `${m.modelFrameHashes.length} frames`);
  for (const key of ['frames', 'audioSamples', 'duration', 'videoDuration', 'fps', 'width', 'height', 'sampleRate']) check(`${key} recomputed`, m[key] === manifest[key], `${m[key]} vs ${manifest[key]}`);
  const pcm = rebuildGrovePcm(manifest.capture);
  check('rebuilt soundtrack has the manifest sample count', pcm.channels.every(c => c.length === manifest.audioSamples), `${pcm.channels[0].length} samples`);
  const hashes = pcm.channels.map(c => sha256(floatBytes(c)));
  check('rebuilt source PCM SHA-256 per channel equals the manifest', manifest.audio?.sourcePcm?.format === 'float32-le' && hashes.length === manifest.audio.sourcePcm.sha256.length && hashes.every((h, i) => h === manifest.audio.sourcePcm.sha256[i]), hashes.map(h => h.slice(0, 12)).join(' '));
  const wav = stereoWav(pcm), wavHash = sha256(wav);
  check('rebuilt PCM16 WAV SHA-256 equals the manifest', wavHash === manifest.audio?.wav?.sha256, wavHash.slice(0, 12));
  if (wavBytes) check('WAV file on disk equals the rebuilt WAV', sha256(wavBytes) === wavHash, `${wavBytes.length} bytes`);
  return {ok: checks.every(c => c.ok), checks, pcm};
}

/** Decoded-AAC sanity check against the source at the best lag in [0, maxLag]; a measurement, never identity. */
export function compareDecodedAudio(decoded, source, maxLag = 4096) {
  const n = Math.min(source[0].length, decoded[0].length), left = source[0], dec = decoded[0];
  let best = {lag: 0, score: -Infinity};
  for (let lag = 0; lag <= maxLag; lag++) { let s = 0; for (let i = 0; i + lag < n; i += 4) s += left[i] * dec[i + lag]; if (s > best.score) best = {lag, score: s}; }
  let err = 0, pow = 0, peak = 0;
  for (let ch = 0; ch < 2; ch++) for (let i = 0; i + best.lag < n; i++) { const d = decoded[ch][i + best.lag] - source[ch][i]; err += d * d; pow += source[ch][i] ** 2; peak = Math.max(peak, Math.abs(d)); }
  return {lag: best.lag, snrDb: 10 * Math.log10(pow / Math.max(err, 1e-30)), peakDifference: peak};
}

function probe(mp4) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4], {encoding: 'utf8'});
  if (r.status !== 0) return null; return JSON.parse(r.stdout);
}
function decode(mp4, sampleRate) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', mp4, '-vn', '-f', 'f32le', '-ac', '2', '-ar', String(sampleRate), '-'], {maxBuffer: 1 << 30});
  if (r.status !== 0) return null;
  const inter = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length >> 2), frames = inter.length >> 1;
  const out = [new Float32Array(frames), new Float32Array(frames)];
  for (let i = 0; i < frames; i++) { out[0][i] = inter[2 * i]; out[1][i] = inter[2 * i + 1]; }
  return out;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const [manifestPath, mp4Path, wavArg] = process.argv.slice(2);
  if (!manifestPath) { console.error('usage: node tools/verify-grove-movie.mjs <manifest.json> [movie.mp4] [movie.wav]'); process.exit(2); }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const wavPath = wavArg ?? (manifest.audio?.wav?.file ? join(dirname(manifestPath), manifest.audio.wav.file) : null);
  const wavBytes = wavPath && existsSync(wavPath) ? readFileSync(wavPath) : null;
  const result = verifyGroveMovieManifest(manifest, {wavBytes});
  for (const c of result.checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? `  (${c.detail})` : ''}`);
  if (!wavBytes) console.log('note  no WAV file found beside the manifest; file hash not compared');
  if (mp4Path) {
    const info = probe(mp4Path);
    if (!info) console.log('note  ffprobe unavailable or failed; container not inspected');
    else {
      const v = info.streams.find(s => s.codec_type === 'video'), a = info.streams.find(s => s.codec_type === 'audio');
      console.log(`mp4   video ${v?.codec_name} ${v?.width}x${v?.height} ${v?.r_frame_rate} fps, ${v?.nb_frames ?? '?'} frames, ${v?.duration ?? '?'} s; audio ${a?.codec_name} ${a?.sample_rate} Hz ${a?.channels} ch ${a?.duration ?? '?'} s`);
      console.log(`${v && Number(v.width) === manifest.width && Number(v.height) === manifest.height && v.r_frame_rate === `${manifest.fps}/1` ? 'ok  ' : 'FAIL'} container dimensions and frame rate match the manifest`);
      console.log(`${v && Math.abs(Number(v.duration) - manifest.videoDuration) < 1 / manifest.fps ? 'ok  ' : 'FAIL'} video duration within one frame of ${manifest.videoDuration} s`);
      console.log(`${a && Number(a.sample_rate) === manifest.sampleRate && Number(a.channels) === 2 ? 'ok  ' : 'FAIL'} audio stream is stereo at the capture rate`);
      const decoded = decode(mp4Path, manifest.sampleRate);
      if (decoded) { const cmp = compareDecodedAudio(decoded, result.pcm.channels); console.log(`aac   decoded vs source at best lag ${cmp.lag} samples: SNR ${cmp.snrDb.toFixed(1)} dB, peak difference ${cmp.peakDifference.toExponential(2)} (lossy codec; a measurement, not identity)`); }
    }
  }
  console.log(result.ok ? 'VERIFIED: model, frame hashes and soundtrack rebuild from the capture' : 'NOT VERIFIED');
  process.exit(result.ok ? 0 : 1);
}
