#!/usr/bin/env node
// Listening-level measurement (Fable, 2026-11-01): peak and RMS in dBFS of the canonical outputs as rendered (no gain stage), from kept WAVs
// and from fresh Node renders of the authored Rest passages on every curated grove. Measurements only; the listening policy is a separate
// decision (collab/notes/fable-listening-level.md). Usage: node tools/measure-listening-level.mjs [outDir=renders/listening-level]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { composeGrove, GROVE_SEEDS } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe, restInvitationRecord, composeRestInvitation, composeIndividualityPhrase, renderRestRecord } from '../src/score/grove-rest.js';
const outDir = process.argv[2] ?? 'renders/listening-level'; mkdirSync(outDir, { recursive: true });
const db = x => +(20 * Math.log10(Math.max(x, 1e-9))).toFixed(1);
const statsOf = channels => { let peak = 0, sum = 0, n = 0; for (const ch of channels) for (let i = 0; i < ch.length; i++) { const a = Math.abs(ch[i]); if (a > peak) peak = a; sum += ch[i] * ch[i]; n++; } return { peakDbfs: db(peak), rmsDbfs: db(Math.sqrt(sum / n)), peak: +peak.toFixed(5) }; };
const wavStats = file => { const b = readFileSync(file); const n = (b.length - 44) / 2; const a = new Int16Array(b.buffer.slice(b.byteOffset + 44, b.byteOffset + 44 + n * 2)); const f = new Float32Array(n); for (let i = 0; i < n; i++) f[i] = a[i] / 32768; return statsOf([f]); };
const rows = [];
for (const file of ['renders/open-phrase-study/opening.wav', 'renders/open-phrase-recurrence/two-cycles-answer.wav', 'renders/harmonic-groves/shared-center-part-1.wav', 'renders/harmonic-groves/three-centers.wav', 'renders/ensemble-live-middle/ensemble.wav', 'renders/ensemble-browser-check/captured.wav']) if (existsSync(file)) rows.push({ source: file, kind: 'kept WAV (canonical, no gain stage)', ...wavStats(file) });
for (const seed of GROVE_SEEDS) { const r = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: 16000 }); for (const [name, record] of [['Rest invitation', restInvitationRecord(r, composeRestInvitation(r))], ['individuality phrase', composeIndividualityPhrase(r).record]]) rows.push({ source: `grove ${seed}: ${name}`, kind: 'Node render at the canonical outputGain ' + r.outputGain, ...statsOf(renderRestRecord(record, r).channels) }); }
const report = { date: new Date().toISOString(), measure: 'peak and RMS of the canonical output in dBFS; stereo channels pooled; no gain, no weighting, no loudness model', reference: 'ordinary recorded music peaks near 0 dBFS and averages about -15 to -20 dBFS RMS', rows };
writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2));
const md = ['# Listening level of the canonical outputs (no gain stage)', '', report.measure + '. ' + report.reference + '.', '', '| source | kind | peak dBFS | RMS dBFS |', '|---|---|---|---|', ...rows.map(r => `| ${r.source} | ${r.kind} | ${r.peakDbfs} | ${r.rmsDbfs} |`)].join('\n');
writeFileSync(`${outDir}/report.md`, md + '\n'); console.log(md);
