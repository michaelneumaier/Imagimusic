// Audition evidence for proposal 008: the legacy seeded passage vs the conversation at the same seed and tempo.
// Pure Node: compiles both passages, counts onsets per bar, samples the stage frames at 30 fps and writes a JSON
// report and an SVG plot under renders/. Every series is labeled by what it includes:
//   modeledIntensity  = out.modeledIntensity (garden + tine + bellows only; a MODELED number, not a measurement)
//   loomEnvelope      = max over the two Loom bodies of the Loom frame envelope (Loom only)
//   fmAmplitude       = the FM tensioner frame amplitude (FM only)
// No combined "visible intensity" is computed or claimed. Usage:
//   node tools/audition-report.mjs [--seed 731] [--tempo 84] [--density 0.7] [--character calm] [--out renders/audition-731]
import {writeFileSync} from 'node:fs';
import {DEFAULT_PATCH} from '../src/model.js';
import {DEFAULT_TENSIONER} from '../src/fm.js';
import {createPerformance} from '../src/stage/performance.js';
import {attachComposition, DEFAULT_COMPOSITION} from '../src/stage/composition.js';
import {createScorePerformance} from '../src/stage/score-performance.js';
import {createStageFrames} from '../src/stage/frame.js';
import {loomPerformanceFrame} from '../src/loom/performance.js';
import {tensionerPerformanceFrame} from '../src/tensioner/performance.js';
import {composeConversation, eventsPerBar, canonicalScore, lastOnsetSeconds, sectionAt} from '../src/score/conversation.js';

const arg = (name, fallback) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : fallback; };
const seed = Number(arg('seed', 731)), tempo = Number(arg('tempo', 84)), density = Number(arg('density', 0.7)), character = arg('character', 'calm');
const out = arg('out', `renders/audition-${seed}`), fps = 30, camera = {mode: 'manual', position: [9, 6.5, 12], target: [0, 1, 0]};
const composition = {...structuredClone(DEFAULT_COMPOSITION), version: 2, loom: {...DEFAULT_COMPOSITION.loom, enabled: true}, fm: {enabled: true, settings: {...DEFAULT_TENSIONER}}};
const patch = {...structuredClone(DEFAULT_PATCH), seed, tempo};

const legacy = attachComposition(createPerformance(patch, 48000), composition);
const score = composeConversation({seed, tempo, density, character});
const conversation = createScorePerformance(patch, score, composition, 48000);

/** Onsets per bar for any passage (bar = 60/tempo·4 s from the 0.35 s lead), all families counted once at onset. */
function onsetsPerBar(passage) {
  const bar = 4 * 60 / passage.patch.tempo, onsets = [...passage.events.map(e => e.voice.noteOn), ...(passage.loom?.events ?? []).map(e => e.time), ...(passage.fm ? [passage.fm.time] : [])];
  const counts = []; for (const t of onsets) { const i = Math.max(0, Math.floor((t - 0.35) / bar + 1e-9)); counts[i] = (counts[i] ?? 0) + 1; }
  return Array.from(counts, c => c ?? 0);
}
function sampleSeries(passage) {
  const frames = createStageFrames(passage), n = Math.ceil(passage.duration * fps) + 1, series = [];
  for (let i = 0; i < n; i++) {
    const t = i / fps, f = frames.sample(t, camera);
    const loom = passage.loom ? Math.max(...loomPerformanceFrame(passage.loom, t).envelope) : null;
    const fm = passage.fm ? tensionerPerformanceFrame(passage.fm, t).amplitude : null;
    series.push({t, modeledIntensity: f.out.modeledIntensity, loomEnvelope: loom, fmAmplitude: fm, section: f.global.score?.id ?? null});
  }
  return series;
}
const report = {
  generated: new Date().toISOString(), seed, tempo, density, character, fps,
  labels: {modeledIntensity: 'out.modeledIntensity: garden + tine + bellows only, modeled (sum of voice levels, soft-clipped), not measured', loomEnvelope: 'max Loom body envelope from loomPerformanceFrame (Loom only)', fmAmplitude: 'FM tensioner frame amplitude (FM only)'},
  legacy: {duration: legacy.duration, events: legacy.events.length, loomStrikes: legacy.loom?.events.length ?? 0, fmEntrance: legacy.fm?.time ?? null, onsetsPerBar: onsetsPerBar(legacy), series: sampleSeries(legacy)},
  conversation: {duration: conversation.duration, events: conversation.events.length, loomStrikes: conversation.loom?.events.length ?? 0, fmEntrance: conversation.fm?.time ?? null, lastOnset: lastOnsetSeconds(score), hold: score.hold, onsetsPerBar: onsetsPerBar(conversation), eventsPerBarFromScore: eventsPerBar(score), sections: score.sections, score: JSON.parse(canonicalScore(score)), series: sampleSeries(conversation)},
};
// Settling check (reported, labeled): no onset after lastOnset; modeledIntensity at lastOnset+hold vs its peak.
const peakOf = (s, k) => Math.max(...s.map(p => p[k] ?? 0));
report.conversation.settling = {modeledIntensityPeak: peakOf(report.conversation.series, 'modeledIntensity'), modeledIntensityAtHoldEnd: report.conversation.series.find(p => p.t >= report.conversation.lastOnset + score.hold)?.modeledIntensity ?? null, loomEnvelopePeak: peakOf(report.conversation.series, 'loomEnvelope'), loomEnvelopeAtHoldEnd: report.conversation.series.find(p => p.t >= report.conversation.lastOnset + score.hold)?.loomEnvelope ?? null};

// SVG: two stacked panels (legacy, conversation), three labeled series each, section bands on the conversation.
const W = 1200, H = 260, pad = 50, tMax = Math.max(legacy.duration, conversation.duration);
const x = t => pad + (t / tMax) * (W - 2 * pad), y = (v, top, max) => top + H - pad - (v / max) * (H - 2 * pad);
const path = (series, key, top, max, color) => `<path fill="none" stroke="${color}" stroke-width="1.5" d="${series.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p[key] ?? 0, top, max).toFixed(1)}`).join(' ')}"/>`;
const panel = (name, data, top, bands) => {
  const maxLoom = Math.max(1e-9, peakOf(data.series, 'loomEnvelope')), maxFm = Math.max(1e-9, peakOf(data.series, 'fmAmplitude'));
  return `${bands}<text x="${pad}" y="${top + 24}" font-size="16" font-family="system-ui">${name}: ${data.events} compiled events, ${data.loomStrikes} Loom strikes, duration ${data.duration.toFixed(1)} s · onsets per bar ${data.onsetsPerBar.join(' ')}</text>
<line x1="${pad}" y1="${top + H - pad}" x2="${W - pad}" y2="${top + H - pad}" stroke="#889"/>
${path(data.series, 'modeledIntensity', top, 1, '#2a7')}${path(data.series, 'loomEnvelope', top, maxLoom, '#c63')}${path(data.series, 'fmAmplitude', top, maxFm, '#36c')}
<text x="${pad}" y="${top + H - pad + 18}" font-size="12" font-family="system-ui" fill="#2a7">green: out.modeledIntensity (garden + tine + bellows only, modeled, 0–1)</text>
<text x="${pad + 430}" y="${top + H - pad + 18}" font-size="12" font-family="system-ui" fill="#c63">orange: Loom envelope (Loom only, normalized to its peak ${maxLoom.toExponential(2)})</text>
<text x="${pad + 850}" y="${top + H - pad + 18}" font-size="12" font-family="system-ui" fill="#36c">blue: FM amplitude (FM only, normalized to ${maxFm.toFixed(3)})</text>`;
};
const bands = score.sections.map((s, i) => { const a = 0.35 + s.beats[0] * 60 / tempo, b = 0.35 + s.beats[1] * 60 / tempo; return `<rect x="${x(a).toFixed(1)}" y="${H}" width="${(x(b) - x(a)).toFixed(1)}" height="${H}" fill="${['#eef', '#efe', '#fee'][i]}"/><text x="${(x(a) + 4).toFixed(1)}" y="${H + 40}" font-size="12" font-family="system-ui" fill="#667">${s.id} (${s.cadence}) bars ${s.beats[0] / 4 + 1}–${s.beats[1] / 4}</text>`; }).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${2 * H + 30}" font-family="system-ui"><rect width="100%" height="100%" fill="#fff"/>
<text x="${pad}" y="${2 * H + 20}" font-size="12" fill="#667">Audition evidence, seed ${seed}, ${tempo} BPM, ${character} / density ${density}; sampled at ${fps} fps from the same frames the stage draws; no combined visible-intensity figure is computed. Time axis 0–${tMax.toFixed(1)} s.</text>
${panel('Legacy seeded passage', report.legacy, 0, '')}${panel('Conversation in three movements', report.conversation, H, bands)}</svg>`;
writeFileSync(out + '.json', JSON.stringify(report, null, 1));
writeFileSync(out + '.svg', svg);
console.log(`legacy: ${report.legacy.events} events, ${report.legacy.loomStrikes} Loom, FM at ${report.legacy.fmEntrance?.toFixed(3)}, ${report.legacy.duration.toFixed(2)} s, onsets/bar ${report.legacy.onsetsPerBar.join(',')}`);
console.log(`conversation: ${report.conversation.events} events, ${report.conversation.loomStrikes} Loom, FM at ${report.conversation.fmEntrance?.toFixed(3)}, ${report.conversation.duration.toFixed(2)} s, onsets/bar ${report.conversation.onsetsPerBar.join(',')}`);
console.log(`settling: ${JSON.stringify(report.conversation.settling)}`);
console.log(`wrote ${out}.json and ${out}.svg`);
