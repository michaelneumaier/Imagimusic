import { BellowsAudio, BELLOWS_KEYS, BELLOWS_NOTES, bellowsScore, renderBellows } from './bellows-audio.js';
import { drawBellows } from './bellows-scene.js';
import { frequency, encodeWav } from './model.js';

export function mountBellows({ audio, getPatch, setBellows, notice, download }) {
  const $ = id => document.getElementById(id), canvas = $('bellows-scene'), ctx = canvas.getContext('2d');
  let engine = null, voices = [], width = 1000, height = 360, playing = false, next = 0, step = 0;
  const held = new Map(), pending = new Set();
  const controls = [
    { key: 'source', label: 'Source', choices: ['saw','reed','air'] },
    { key: 'cutoffHz', label: 'Chamber cutoff', min: Math.log2(20), max: Math.log2(20000), step: .01, log: true, unit: ' Hz' },
    { key: 'resonance', label: 'Resonance', min: 0, max: 1, step: .01 },
    { key: 'envAmount', label: 'Envelope sweep', min: -4, max: 4, step: .1, unit: ' oct' },
    { key: 'adsr.a', label: 'Attack', min: .001, max: 4, step: .001, unit: ' s' },
    { key: 'adsr.d', label: 'Decay', min: .001, max: 4, step: .001, unit: ' s' },
    { key: 'adsr.s', label: 'Sustain', min: 0, max: 1, step: .01 },
    { key: 'adsr.r', label: 'Release', min: .01, max: 8, step: .01, unit: ' s' },
    { key: 'lfo.rateHz', label: 'Pendulum rate', min: .05, max: 20, step: .05, unit: ' Hz' },
    { key: 'lfo.depthOct', label: 'Modulation depth', min: 0, max: 2, step: .01, unit: ' oct' },
    { key: 'lfo.target', label: 'Pendulum moves', choices: ['cutoff','pitch','amp'] },
    { key: 'lfo.wave', label: 'Pendulum motion', choices: ['sine','tri','square'] },
  ];
  for (const spec of controls) {
    const label = document.createElement('label'); label.textContent = spec.label;
    const output = document.createElement('output'); label.append(output);
    const input = document.createElement(spec.choices ? 'select' : 'input');
    if (spec.choices) for (const value of spec.choices) { const option = document.createElement('option'); option.value = value; option.textContent = value; input.append(option); }
    else { input.type = 'range'; input.min = spec.min; input.max = spec.max; input.step = spec.step; }
    input.setAttribute('aria-label', spec.label); label.append(input); $('bellows-controls').append(label);
    spec.input = input; spec.output = output;
    input.oninput = () => {
      const block = structuredClone(getPatch().bellows), parts = spec.key.split('.');
      const value = spec.choices ? input.value : spec.log ? Math.max(20, Math.min(20000, 2 ** Number(input.value))) : Number(input.value);
      if (parts.length === 2) block[parts[0]][parts[1]] = value; else block[spec.key] = value;
      setBellows(block);
    };
  }
  async function enable() { await audio.enable(); if (!engine) engine = new BellowsAudio(audio.context, audio.master); return engine; }
  async function begin(token, midi) {
    if (pending.has(token) || held.has(token)) return;
    pending.add(token);
    try {
      await enable(); if (!pending.has(token)) return;
      const voice = engine.noteOn(frequency(midi), getPatch()); held.set(token, voice); voices.push(voice);
      $('bellows-status').textContent = 'Air → source → chamber → horn';
    } catch (error) { notice('Could not start breath: ' + error.message); }
    finally { pending.delete(token); }
  }
  function end(token) { pending.delete(token); const voice = held.get(token); if (voice) { engine.noteOff(voice); held.delete(token); } }
  function stop() {
    playing = false; pending.clear(); held.clear(); engine?.stop();
    $('bellows-play').textContent = '▶ Breathing phrase'; $('bellows-status').textContent = 'Ready for a breath';
  }
  for (let i = 0; i < BELLOWS_KEYS.length; i++) {
    const key = BELLOWS_KEYS[i], button = document.createElement('button');
    button.textContent = key.toUpperCase(); button.setAttribute('aria-label', 'Hold breath ' + key.toUpperCase());
    button.onpointerdown = event => { event.preventDefault(); button.setPointerCapture(event.pointerId); begin('pad:' + key, BELLOWS_NOTES[i]); };
    button.onpointerup = button.onpointercancel = () => end('pad:' + key);
    button.onkeydown = event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); begin('pad:' + key, BELLOWS_NOTES[i]); } };
    button.onkeyup = button.onblur = () => end('pad:' + key);
    $('bellows-notes').append(button);
  }
  window.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    const index = BELLOWS_KEYS.indexOf(event.key.toLowerCase());
    if (index >= 0) { event.preventDefault(); begin('key:' + BELLOWS_KEYS[index], BELLOWS_NOTES[index]); }
  });
  window.addEventListener('keyup', event => { const key = event.key.toLowerCase(); if (BELLOWS_KEYS.includes(key)) end('key:' + key); });
  window.addEventListener('blur', () => { for (const key of [...held.keys(), ...pending]) end(key); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  $('bellows-play').onclick = async () => {
    if (playing) { stop(); return; }
    try { await enable(); playing = true; step = 0; next = audio.time + .08; $('bellows-play').textContent = 'Ⅱ Settle choir'; $('bellows-status').textContent = 'Breathing · seed ' + getPatch().seed; }
    catch (error) { notice(error.message); }
  };
  $('bellows-stop').onclick = stop;
  $('bellows-wav').onclick = async () => {
    const button = $('bellows-wav'); button.disabled = true; button.textContent = 'Rendering…';
    try {
      const captured = structuredClone(getPatch()), samples = await renderBellows(captured);
      download(new Blob([encodeWav(samples, 48000)], { type: 'audio/wav' }), `imagimusic-bellows-${captured.seed}.wav`);
      notice('Bellows WAV ready · 48 kHz · same source, filter and gain graph as the live choir.');
    } catch (error) { notice('Bellows render failed: ' + error.message); }
    finally { button.disabled = false; button.textContent = 'Render choir WAV'; }
  };
  setInterval(() => {
    engine?.tick();
    if (!playing || audio.context?.state !== 'running') return;
    const patch = getPatch(), score = bellowsScore(patch);
    if (next < audio.time) next = audio.time + .05;
    while (next < audio.time + .15) {
      const event = score[step++ % score.length], duration = event.noteOff - event.noteOn;
      const voice = engine.noteOn(event.noteHz, patch, event.velocity, next, next + duration, (patch.seed + event.id * 997) >>> 0);
      voices.push(voice); next += 60 / patch.tempo;
    }
  }, 25);
  function resize() {
    const rect = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
    width = rect.width; height = rect.height; canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  new ResizeObserver(resize).observe(canvas); resize();
  return {
    stop,
    syncUI() {
      const block = getPatch().bellows;
      for (const spec of controls) {
        const value = spec.key.split('.').reduce((obj, key) => obj[key], block);
        spec.input.value = spec.log ? Math.log2(value) : value;
        spec.output.textContent = spec.choices ? '' : (spec.log ? Math.round(value) : Number(value.toFixed(2))) + (spec.unit ?? '');
      }
    },
    draw() {
      const time = audio.time; voices = voices.filter(voice => voice.end > time);
      drawBellows(ctx, width, height, { time, voices, patch: getPatch(), sampleRate: audio.context?.sampleRate ?? 48000 });
    },
  };
}
