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

// SVG layout: for each passage a series panel (three labeled lines) and an onsets-per-bar panel (bars on a scale
// shared by both passages); time ticks every 5 s on every panel; the legend is stacked, one line per series, so
// nothing overflows the 1200 px width. Normalization disclosures stay with each series.
const W = 1200, padL = 60, padR = 30, SH = 220, BH = 120, gap = 16, legendH = 54, titleH = 30;
const tMax = Math.max(legacy.duration, conversation.duration), barSeconds = 4 * 60 / tempo;
const maxBars = Math.max(report.legacy.onsetsPerBar.length, report.conversation.onsetsPerBar.length), maxCount = Math.max(1, ...report.legacy.onsetsPerBar, ...report.conversation.onsetsPerBar);
const x = t => padL + (t / tMax) * (W - padL - padR);
const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const text = (xx, yy, str, extra = '') => `<text x="${xx}" y="${yy}" ${/font-size/.test(extra) ? '' : 'font-size="12" '}font-family="system-ui" ${extra}>${esc(str)}</text>`;
const ticks = (top, height) => { let o = ''; for (let s = 0; s <= tMax; s += 5) o += `<line x1="${x(s).toFixed(1)}" y1="${top}" x2="${x(s).toFixed(1)}" y2="${top + height}" stroke="#dde" stroke-width="1"/>` + text(x(s).toFixed(1), top + height + 14, s + ' s', 'text-anchor="middle" fill="#667"'); return o; };
const line = (series, key, top, height, max, color) => `<path fill="none" stroke="${color}" stroke-width="1.5" d="${series.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${(top + height - ((p[key] ?? 0) / max) * height).toFixed(1)}`).join(' ')}"/>`;
let y = 0, body = '';
const BAND_FILLS = ['#eef3ff', '#eefbee', '#fff0ee'];
const sectionBands = (top, height) => score.sections.map((s, i) => { const a = 0.35 + s.beats[0] * 60 / tempo, b = 0.35 + s.beats[1] * 60 / tempo; return `<rect x="${x(a).toFixed(1)}" y="${top}" width="${(x(b) - x(a)).toFixed(1)}" height="${height}" fill="${BAND_FILLS[i % BAND_FILLS.length]}"/>` + text(x(a) + 4, top + 14, `${s.id} (${s.cadence}), bars ${s.beats[0] / 4 + 1}–${s.beats[1] / 4}`, 'fill="#667"'); }).join('');
const passagePanel = (name, data, scored) => {
  const maxLoom = Math.max(1e-9, peakOf(data.series, 'loomEnvelope')), maxFm = Math.max(1e-9, peakOf(data.series, 'fmAmplitude'));
  body += text(padL, y + 20, `${name}: ${data.events} compiled events, ${data.loomStrikes} Loom strikes, FM entrance ${data.fmEntrance.toFixed(2)} s, duration ${data.duration.toFixed(1)} s`, 'font-size="15"');
  y += titleH;
  // series panel
  body += scored ? sectionBands(y, SH) : '';
  body += ticks(y, SH) + `<line x1="${padL}" y1="${y + SH}" x2="${W - padR}" y2="${y + SH}" stroke="#889"/>`;
  body += line(data.series, 'modeledIntensity', y, SH, 1, '#2a7') + line(data.series, 'loomEnvelope', y, SH, maxLoom, '#c63') + line(data.series, 'fmAmplitude', y, SH, maxFm, '#36c');
  y += SH + 20;
  body += text(padL, y + 12, 'green: out.modeledIntensity, garden + tine + bellows only, a modeled number (sum of voice levels, soft-clipped), scale 0–1', 'fill="#2a7"');
  body += text(padL, y + 28, `orange: Loom envelope, Loom only, normalized to this passage's own peak ${maxLoom.toExponential(2)}`, 'fill="#c63"');
  body += text(padL, y + 44, `blue: FM tensioner amplitude, FM only, normalized to this passage's own peak ${maxFm.toFixed(3)}`, 'fill="#36c"');
  y += legendH;
  // onsets-per-bar panel, shared scale
  body += text(padL, y + 12, `onsets per bar (all families counted once at onset; shared scale, max ${maxCount})`, 'fill="#334"');
  y += 16;
  body += scored ? sectionBands(y, BH).replace(/<text[^>]*>[^<]*<\/text>/g, '') : '';
  body += ticks(y, BH) + `<line x1="${padL}" y1="${y + BH}" x2="${W - padR}" y2="${y + BH}" stroke="#889"/>`;
  data.onsetsPerBar.forEach((c, i) => { const a = x(0.35 + i * barSeconds), b = x(0.35 + (i + 1) * barSeconds), h = (c / maxCount) * (BH - 14); body += `<rect x="${(a + 1).toFixed(1)}" y="${(y + BH - h).toFixed(1)}" width="${Math.max(1, b - a - 2).toFixed(1)}" height="${h.toFixed(1)}" fill="#557"/>` + text(((a + b) / 2).toFixed(1), (y + BH - h - 3).toFixed(1), c, 'text-anchor="middle" fill="#334"'); });
  y += BH + 24 + gap;
};
passagePanel('Legacy seeded passage', report.legacy, false);
passagePanel('Conversation in three movements', report.conversation, true);
body += text(padL, y + 8, `Audition evidence, seed ${seed}, ${tempo} BPM, ${character} / density ${density}, both children enabled; series sampled at ${fps} fps from the same frames the stage draws.`, 'fill="#667"');
body += text(padL, y + 24, `No combined visible-intensity figure is computed or claimed. Time axis 0–${tMax.toFixed(1)} s on every panel.`, 'fill="#667"');
y += 40;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}"><rect width="100%" height="100%" fill="#fff"/>${body}</svg>`;
writeFileSync(out + '.json', JSON.stringify(report, null, 1));
writeFileSync(out + '.svg', svg);
console.log(`legacy: ${report.legacy.events} events, ${report.legacy.loomStrikes} Loom, FM at ${report.legacy.fmEntrance?.toFixed(3)}, ${report.legacy.duration.toFixed(2)} s, onsets/bar ${report.legacy.onsetsPerBar.join(',')}`);
console.log(`conversation: ${report.conversation.events} events, ${report.conversation.loomStrikes} Loom, FM at ${report.conversation.fmEntrance?.toFixed(3)}, ${report.conversation.duration.toFixed(2)} s, onsets/bar ${report.conversation.onsetsPerBar.join(',')}`);
console.log(`settling: ${JSON.stringify(report.conversation.settling)}`);
console.log(`wrote ${out}.json and ${out}.svg`);
