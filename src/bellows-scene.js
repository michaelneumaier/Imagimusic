import { bellowsState } from './bellows-audio.js';
import { voiceDynamics } from './dynamics.js';

/** Independent visible chambers preserve per-voice filter/envelope causality. */
export function drawBellows(ctx, width, height, { time, voices, patch, sampleRate = 48000 }) {
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#19252a'); bg.addColorStop(1, '#10191d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  const cell = width / 6, radius = Math.min(34, cell * .2);
  const states = [];
  ctx.strokeStyle = '#45534c'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(width * .04, height * .75); ctx.lineTo(width * .96, height * .75); ctx.stroke();
  for (let slot = 0; slot < 6; slot++) {
    const x = cell * (slot + .5), y = height * (.34 + Math.sin(slot * .8) * .04);
    const voice = voices.filter(v => v.slot === slot && v.noteOn <= time && v.end > time).at(-1);
    const state = voice ? bellowsState(voice, time, sampleRate) : voiceDynamics(time, { noteHz: 220, velocity: .8, noteOn: 0, noteOff: 0 }, patch, sampleRate);
    states.push(state);
    const level = Math.max(0, Math.min(1, state.amp.level));
    const aperture = Math.max(0, Math.min(1, state.filter.aperture01));
    const fill = Math.max(0, Math.min(1, state.bellows.fill01));
    const source = voice?.patch.bellows.source ?? patch.bellows.source;
    const target = voice?.patch.bellows.lfo.target ?? patch.bellows.lfo.target;
    // One air route from pressure source to filter and horn.
    ctx.strokeStyle = '#5c7062'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, height * .75); ctx.lineTo(x, y + radius + 24); ctx.stroke();
    const bellowsTop = y + radius + 15, bellowsHeight = 28 + fill * 35;
    const half = radius * .65;
    ctx.fillStyle = `rgba(180,151,112,${.15 + level * .3})`; ctx.strokeStyle = '#ae9472'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - half, bellowsTop);
    for (let i = 0; i <= 8; i++) ctx.lineTo(x + half + (i % 2 ? 5 : -3), bellowsTop + i / 8 * bellowsHeight);
    for (let i = 8; i >= 0; i--) ctx.lineTo(x - half - (i % 2 ? 5 : -3), bellowsTop + i / 8 * bellowsHeight);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let i = 1; i < 8; i++) {
      const lineY = bellowsTop + i / 8 * bellowsHeight;
      ctx.beginPath(); ctx.moveTo(x - half, lineY); ctx.lineTo(x + half, lineY); ctx.stroke();
    }
    // A pressure stem connects the bellows to the iris chamber.
    ctx.fillStyle = '#71816a'; ctx.fillRect(x - 5, y + radius - 2, 10, 19);
    const halo = ctx.createRadialGradient(x, y, 0, x, y, radius * 2.4);
    halo.addColorStop(0, `rgba(191,221,156,${level * .35})`); halo.addColorStop(1, 'rgba(191,221,156,0)');
    ctx.fillStyle = halo; ctx.fillRect(x - radius * 2.4, y - radius * 2.4, radius * 4.8, radius * 4.8);
    ctx.fillStyle = '#34443e'; ctx.strokeStyle = '#83967a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Iris opening encodes log cutoff rather than pretending a linear Hz scale is perceptual.
    const hole = radius * (.12 + aperture * .66);
    ctx.fillStyle = '#0b1619'; ctx.beginPath(); ctx.arc(x, y, hole, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(216,231,185,${.25 + state.filter.resonance * .65})`; ctx.lineWidth = .6 + state.filter.resonance * 2;
    for (let blade = 0; blade < 8; blade++) {
      const angle = blade * Math.PI / 4 + aperture * .5;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(angle) * radius * .93, y + Math.sin(angle) * radius * .93);
      ctx.lineTo(x + Math.cos(angle + .6) * hole, y + Math.sin(angle + .6) * hole); ctx.stroke();
    }
    // The outlet horn broadens visibly with energy, with no claim of acoustic radiation modelling.
    ctx.fillStyle = `rgba(192,169,121,${.22 + level * .45})`; ctx.strokeStyle = '#a18f70'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + radius, y - 5); ctx.lineTo(x + radius + cell * .14, y - 16 - level * 5);
    ctx.lineTo(x + radius + cell * .14, y + 16 + level * 5); ctx.lineTo(x + radius, y + 5); ctx.closePath(); ctx.fill(); ctx.stroke();
    // Source anatomy is distinct; airflow speed is illustrative, intensity follows the envelope.
    const sourceX = x - radius - cell * .13;
    ctx.strokeStyle = '#799888'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sourceX, y); ctx.lineTo(x - radius, y); ctx.stroke();
    if (source === 'saw') {
      ctx.beginPath();
      for (let tooth = 0; tooth < 24; tooth++) {
        const angle = tooth * Math.PI / 12, r = tooth % 2 ? 6 : 9;
        const px = sourceX + Math.cos(angle) * r, py = y + Math.sin(angle) * r;
        if (!tooth) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    } else if (source === 'reed') {
      ctx.beginPath(); ctx.moveTo(sourceX - 8, y + 6); ctx.lineTo(sourceX + 7, y - level * 6); ctx.moveTo(sourceX - 8, y - 6); ctx.lineTo(sourceX + 7, y + level * 6); ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(179,213,202,${.25 + level * .7})`;
      for (let speck = 0; speck < 9; speck++) {
        const drift = ((time * 1.7 + speck * .137) % 1) * 18;
        ctx.beginPath(); ctx.arc(sourceX - 9 + drift, y + Math.sin(speck * 2.4) * 7, 1, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Each voice has its own clocked pendulum: polyphony does not share a fictional common iris.
    const anchorX = x - radius * .95, anchorY = y - radius * 1.25;
    const fastLfo = (voice?.patch.bellows.lfo.rateHz ?? patch.bellows.lfo.rateHz) > 8;
    const angle = fastLfo ? 0 : state.lfo.value * .65;
    const bobX = anchorX + Math.sin(angle) * radius * 1.2, bobY = anchorY + Math.cos(angle) * radius * 1.2;
    ctx.strokeStyle = '#6f9387'; ctx.lineWidth = 1;
    if (fastLfo) {
      // Above readable swing rates show the range, not an aliased moving bob.
      ctx.beginPath(); ctx.arc(anchorX, anchorY, radius * 1.2, Math.PI / 2 - .65, Math.PI / 2 + .65); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(anchorX, anchorY); ctx.lineTo(bobX, bobY); ctx.stroke();
      ctx.fillStyle = '#a7c6af'; ctx.beginPath(); ctx.arc(bobX, bobY, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#6f938755'; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(bobX, bobY); ctx.lineTo(target === 'pitch' ? sourceX : x, target === 'amp' ? bellowsTop + bellowsHeight * .5 : y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = level > .01 ? '#d7e7bd' : '#82988a'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
    const sourceLabel = source === 'air' && voice ? `${(state.source.frequencyHz / voice.noteHz).toFixed(2)}× air` : `${Math.round(state.source.frequencyHz)} Hz`;
    ctx.fillText(voice ? `${sourceLabel} · ${state.env.stage}` : `${source.toUpperCase()} / ${slot + 1}`, x, height * .83);
    ctx.fillStyle = '#adc3a2'; ctx.fillText(`${Math.round(state.filter.cutoffHz)} Hz aperture`, x, height * .9);
  }
  return states;
}
