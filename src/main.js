import { DEFAULT_PATCH, makeScore, validatePatch, tineModes, TINE_INDEX } from './model.js';
import { InstrumentAudio } from './audio.js';
import { drawGarden, drawTine, NOTE_NAMES } from './scene.js';
import { APPROACH_SECONDS, LIVE_APPROACH_SECONDS, clamp01 } from './excitation.js';
const $ = id => document.getElementById(id);
let patch = { ...DEFAULT_PATCH }, playing = false, step = 0, nextTime = 0, score = makeScore(patch), voices = [];
const audio = new InstrumentAudio(), canvas = $('scene'), ctx = canvas.getContext('2d');
let width = 1000, height = 430, targets = [];
const tineCanvas = $('tine-scene'), tineCtx = tineCanvas.getContext('2d');
let tineWidth = 1000, tineHeight = 290, tineTarget = null, tinePreview = tineModes(patch);
const names = NOTE_NAMES;
const descriptions = { glass: 'Clear, scattered overtones. A little light held in a bell.', bronze: 'Close, restless partials. Warm metal with a lingering shadow.', string: 'Harmonic threads. A soft architecture of tension and release.' };
function notice(text) { $('notice').textContent = text; }
function syncUI() {
  for (const key of ['damping','brightness','spread','tempo','strikePosition','release']) {
    $(key).value = patch[key];
    $(key + '-value').textContent = key === 'tempo' ? patch[key] + ' BPM' : key === 'release' ? Math.round(patch[key] * 1000) + ' ms' : Math.round(patch[key] * 100) + '%';
  }
  document.querySelectorAll('[data-material]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.material === patch.material)));
  $('material-description').textContent = descriptions[patch.material];
  document.querySelector('.scene-caption span').textContent = `01 / THE ${patch.material === 'string' ? 'HARMONIC' : patch.material.toUpperCase()} ORCHARD`;
  score = makeScore(patch);
  for (const key of ['lengthM', 'thicknessM']) {
    $(key).value = patch.geometry[key]; $(key + '-value').textContent = (patch.geometry[key] * 1000).toFixed(key === 'lengthM' ? 0 : 1) + ' mm';
  }
  $('physical-material').value = patch.geometry.material;
  tinePreview = tineModes(patch);
  $('tine-reading').textContent = `Fundamental ${tinePreview[0]?.frequency.toFixed(1) ?? '—'} Hz · ${patch.geometry.material} · strike ${Math.round(patch.strikePosition * 100)}% from clamp · 0 = clamp, 1 = free tip`;

}
function strike(index, velocity = 0.8, when = audio.time + LIVE_APPROACH_SECONDS, position = patch.strikePosition, approach = LIVE_APPROACH_SECONDS) {
  const voice = audio.strike(index, patch, velocity, when, position);
  if (voice) { voice.approach = approach; voices.push(voice); }
  return voice;
}
async function touch(index, position = patch.strikePosition) {
  try {
    await audio.enable();
    const voice = strike(index, .8, undefined, position);
    $('status').textContent = voice ? 'Listening · seed ' + patch.seed : 'No excitation at this point';
    if (!voice) notice(audio.dampers.has(index) ? 'This voice is held by its damper.' : 'This is a fixed endpoint or node. Strike farther along the body to excite it.');
  }
  catch (error) { notice('Audio could not start: ' + error.message); }
}
function stop() {
  playing = false; audio.stop(); $('play').textContent = '▶ Begin sequence'; $('status').textContent = 'Quiet · ready to play';
}
$('play').onclick = async () => {
  if (playing) { stop(); return; }
  try {
    await audio.enable(); playing = true; step = 0; nextTime = audio.time + APPROACH_SECONDS;
    $('play').textContent = 'Ⅱ Pause sequence'; $('status').textContent = 'Growing · seed ' + patch.seed;
  } catch (error) { notice(error.message); }
};
$('stop').onclick = stop;
setInterval(() => {
  if (!playing || audio.context.state !== 'running') return;
  if (nextTime < audio.time - 0.15) nextTime = audio.time + APPROACH_SECONDS;
  while (nextTime < audio.time + APPROACH_SECONDS + .05) {
    const event = score[step++ % score.length];
    strike(event.index, event.velocity, nextTime, patch.strikePosition, APPROACH_SECONDS); nextTime += 60 / patch.tempo / 2;
  }
}, 25);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
for (const key of ['damping','brightness','spread','tempo','strikePosition','release']) $(key).oninput = event => { patch[key] = Number(event.target.value); syncUI(); };
document.querySelectorAll('[data-material]').forEach(button => button.onclick = () => { patch.material = button.dataset.material; syncUI(); });
$('mutate').onclick = () => { patch.seed = (Math.imul(patch.seed,1664525) + 1013904223) >>> 0; syncUI(); notice('New phrase · seed ' + patch.seed); };
names.forEach((name, index) => { const button = document.createElement('button'); button.textContent = name; button.dataset.note = index; button.setAttribute('aria-label', 'Play ' + name); button.onclick = () => touch(index); $('notes').append(button);
  const damper = document.createElement('button'); damper.textContent = '▰'; damper.className = 'damper'; damper.setAttribute('aria-label', 'Hold to damp ' + name);
  damper.onpointerdown = event => { event.preventDefault(); damper.setPointerCapture(event.pointerId); audio.damp(index, true, patch.release); };
  damper.onpointerup = damper.onpointercancel = () => audio.damp(index, false);
  damper.onkeydown = event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); audio.damp(index, true, patch.release); } };
  damper.onkeyup = damper.onblur = () => audio.damp(index, false);
  $('notes').append(damper);
});
window.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
  const index = 'asdfghjkl'.indexOf(event.key.toLowerCase());
  if (index >= 0) { event.preventDefault(); if (event.shiftKey) audio.damp(index, true, patch.release); else touch(index); }
  if (event.code === 'Space' && document.activeElement.tagName !== 'BUTTON') { event.preventDefault(); $('play').click(); }
});
window.addEventListener('keyup', event => { const index = 'asdfghjkl'.indexOf(event.key.toLowerCase()); if (index >= 0) audio.damp(index, false); if (event.key === 'Shift') for (const held of [...audio.dampers]) audio.damp(held, false); });
window.addEventListener('blur', () => { for (const held of [...audio.dampers]) audio.damp(held, false); });
canvas.addEventListener('pointerdown', event => {
  const rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
  let best = -1, distance = Infinity;
  targets.forEach((point, index) => { const value = Math.hypot((x - point.x), (y - point.y) * 0.45); if (value < distance) { distance = value; best = index; } });
  if (best >= 0 && distance < width / 8) { const point = targets[best]; const position = Math.max(.04, Math.min(.96, (point.base - y) / point.length)); touch(best, position); }
});
for (const key of ['lengthM', 'thicknessM']) $(key).oninput = event => {
  audio.damp(TINE_INDEX, true, .02); audio.damp(TINE_INDEX, false);
  voices = voices.filter(voice => voice.index !== TINE_INDEX);
  patch.geometry = { ...patch.geometry, [key]: Number(event.target.value) }; syncUI();
};
$('physical-material').onchange = event => {
  audio.damp(TINE_INDEX, true, .02); audio.damp(TINE_INDEX, false);
  voices = voices.filter(voice => voice.index !== TINE_INDEX);
  patch.geometry = { ...patch.geometry, material: event.target.value }; syncUI();
};
$('tine-play').onclick = () => touch(TINE_INDEX);
$('tine-damp').onpointerdown = event => { event.preventDefault(); $('tine-damp').setPointerCapture(event.pointerId); audio.damp(TINE_INDEX, true, patch.release); };
$('tine-damp').onpointerup = $('tine-damp').onpointercancel = () => audio.damp(TINE_INDEX, false);
$('tine-damp').onkeydown = event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); audio.damp(TINE_INDEX, true, patch.release); } };
$('tine-damp').onkeyup = $('tine-damp').onblur = () => audio.damp(TINE_INDEX, false);
tineCanvas.onpointerdown = event => {
  if (!tineTarget) return;
  const rect = tineCanvas.getBoundingClientRect();
  patch.strikePosition = clamp01((event.clientX - rect.left - tineTarget.left) / tineTarget.length); syncUI(); touch(TINE_INDEX);
};
function download(blob, filename) { const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); }
$('save').onclick = () => { download(new Blob([JSON.stringify(patch, null, 2)], { type: 'application/json' }), `imagimusic-${patch.seed}.json`); notice('Saved instrument settings and procedural seed.'); };
$('load').onclick = () => $('file').click();
$('file').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  try { if (file.size > 20000) throw new Error('Instrument file is too large.'); const next = validatePatch(JSON.parse(await file.text())); stop(); patch = next; syncUI(); notice('Instrument restored.'); }
  catch (error) { notice('Could not load: ' + error.message); }
  event.target.value = '';
};
$('snapshot').onclick = () => { draw(); canvas.toBlob(blob => { if (blob) download(blob, 'imagimusic-garden.png'); }); };
function renderWav(source) {
  const button = $(source === 'tine' ? 'tine-wav' : 'wav'); const originalLabel = button.textContent; button.disabled = true; button.textContent = 'Rendering…';
  notice(source === 'tine' ? 'Rendering one physical tine strike with its full decay…' : 'Rendering a 16-beat phrase with its full decay tail…');
  const captured = { ...patch };
  const worker = new Worker(new URL('./render-worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = event => { download(new Blob([event.data], { type: 'audio/wav' }), `imagimusic-${source}-${captured.seed}.wav`); notice('WAV ready · mono, 22.05 kHz. Stereo placement and live compression are preview effects.'); finish(); };
  worker.onerror = () => { notice('Rendering failed. Please try again.'); finish(); };
  function finish() { worker.terminate(); button.disabled = false; button.textContent = originalLabel; }
  worker.postMessage({ patch: captured, source });
}
$('wav').onclick = () => renderWav('garden');
$('tine-wav').onclick = () => renderWav('tine');
function resize() { const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height; const dpr = Math.min(devicePixelRatio,2); canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
new ResizeObserver(resize).observe(canvas);
function resizeTine() {
  const rect = tineCanvas.getBoundingClientRect(); tineWidth = rect.width; tineHeight = rect.height;
  const dpr = Math.min(devicePixelRatio, 2); tineCanvas.width = Math.round(tineWidth * dpr); tineCanvas.height = Math.round(tineHeight * dpr); tineCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
new ResizeObserver(resizeTine).observe(tineCanvas);
function draw() {
  const time = audio.time;
  voices = voices.filter(voice => voice.end > time);
  const result = drawGarden(ctx, width, height, { time, voices, patch, dampers: audio.dampers });
  targets = result.targets;
  tineTarget = drawTine(tineCtx, tineWidth, tineHeight, { time, voices, patch, damped: audio.dampers.has(TINE_INDEX), modes: tinePreview });
  document.querySelectorAll('[data-note]').forEach(button => button.classList.toggle('active', result.energies[Number(button.dataset.note)] > .12));
}
function frame(){draw();requestAnimationFrame(frame);}syncUI();resize();resizeTine();frame();
