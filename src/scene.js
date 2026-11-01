import { MATERIALS } from './model.js';
export const NOTE_NAMES = ['C3','E♭3','G3','B♭3','C4','E♭4','G4','B♭4'];

/** Draw a frame exclusively from the supplied timeline state. */
export function drawGarden(ctx, width, height, { frame, patch }) {
  const time=frame.t,voices=frame.voices.filter(v=>v.family==='garden'),dampers=new Set(frame.global.dampers?.garden??[]);
  ctx.clearRect(0, 0, width, height);
  const background = ctx.createRadialGradient(width * .5, height * .55, 0, width * .5, height * .55, width * .6);
  background.addColorStop(0, '#203b3a'); background.addColorStop(1, '#101c20');
  ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#42605835'; ctx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    ctx.beginPath(); ctx.moveTo(width * .5 + (i - 7) * 20, height * .45);
    ctx.lineTo((i - 3) * width / 7, height); ctx.stroke();
  }
  for (let i = 0; i < 9; i++) {
    const y = height * .5 + (i / 8) ** 2 * height * .5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  const targets = [], energies = [];
  for (let index = 0; index < 8; index++) {
    const x = width * (.09 + index * .117);
    const base = height * .78 + Math.sin(index * .8) * 12;
    const length = height * (.49 - index * .027), top = base - length;
    targets.push({ x, y: top + length * .45, top, base, length });
    const active = voices.filter(voice => voice.slot === index && voice.age >= 0);
    const energy = Math.min(1.6, active.reduce((sum, voice) => sum +
      voice.modes.reduce((total, mode) => total + mode.energy, 0) * 3, 0));
    energies.push(energy);
    const color = MATERIALS[patch.material].color.join(',');
    ctx.fillStyle = '#00000040'; ctx.beginPath(); ctx.ellipse(x + 15, base + 7, width * .034, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#69877a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x, top - 20); ctx.stroke();
    const radius = width * .023;
    const glow = ctx.createRadialGradient(x, top + length * .4, 0, x, top + length * .4, length * .8);
    glow.addColorStop(0, `rgba(${color},${.025 + energy * .12})`); glow.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = glow; ctx.fillRect(x - length, top - length * .4, length * 2, length * 2);
    for (let layer = 4; layer >= 0; layer--) {
      const y = top + layer * length * .155;
      const modalEnergy = active.reduce((sum, voice) => {
        const mode = voice.modes[layer];
        return sum + (mode?.energy ?? 0);
      }, 0);
      // Stylized energy-envelope sway, not sampled audio-frequency deflection.
      const sway = Math.sin(time * 5 + index + layer) * modalEnergy * 35;
      const r = radius * (.65 + layer * .14) + modalEnergy * 20;
      ctx.fillStyle = `rgba(${color},${.14 + Math.min(.65, modalEnergy * .8)})`;
      ctx.strokeStyle = `rgba(${color},${.45 + Math.min(.55, modalEnergy * 2)})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + sway, y - 15);
      ctx.bezierCurveTo(x + r + sway, y - 5, x + r + sway, y + 18, x + sway, y + 25);
      ctx.bezierCurveTo(x - r + sway, y + 18, x - r + sway, y - 5, x + sway, y - 15);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + sway, y + 7, r * .68, 4, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // Each planned gesture has a visible approach, contact and recovery.
    for (const voice of voices.filter(voice => voice.slot === index)) {
      const pose = voice.exciter;
      if (!pose.visible) continue;
      const strikeY = base - voice.exciter.pos01 * length;
      const tipX = x - radius - (1 - pose.reach) * width * .026;
      ctx.strokeStyle = '#a1ad88'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - radius - width * .035, base + 3);
      ctx.lineTo(tipX, strikeY); ctx.stroke();
      ctx.fillStyle = pose.contact > .5 ? '#f1ffd5' : '#c9ad83';
      ctx.beginPath(); ctx.ellipse(tipX, strikeY, 6 + voice.velocity * 2, 4, -.4, 0, Math.PI * 2); ctx.fill();
      if (pose.contact > 0) {
        ctx.strokeStyle = `rgba(235,255,206,${pose.contact})`;
        ctx.beginPath(); ctx.arc(x, strikeY, (1 - pose.contact) * 18 + 3, 0, Math.PI * 2); ctx.stroke();
      }
    }
    const damping = dampers.has(index);
    ctx.fillStyle = damping ? '#d5e4b5' : '#52635b';
    ctx.fillRect(x + radius + (damping ? -3 : 10), base - length * .33, 8, 20);
    ctx.strokeStyle = '#617369'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + radius + 14, base - length * .33 + 10); ctx.lineTo(x + radius + 14, base + 3); ctx.stroke();
    ctx.fillStyle = damping ? '#dfefbd' : '#9eb8a9'; ctx.font = '10px Arial'; ctx.textAlign = 'center';
    ctx.fillText(damping ? 'DAMPED' : NOTE_NAMES[index], x, base + 31);
  }
  return { targets, energies };
}

export function drawTine(ctx, width, height, { frame, patch, modes }) {
  const time=frame.t,voices=frame.voices.filter(v=>v.family==='tine'),damped=(frame.global.dampers?.tine??[]).includes(8);
  ctx.fillStyle = '#101c20'; ctx.fillRect(0, 0, width, height);
  const left = width * .12, full = width * .73;
  const length = full * patch.geometry.lengthM / .11;
  const baseY = height * .37;
  const thickness = 3 + patch.geometry.thicknessM * 3500;
  const active = voices.filter(voice => voice.slot === 8 && voice.age >= 0);
  ctx.fillStyle = '#34483d'; ctx.fillRect(left - 24, baseY - 36, 24, 72);
  ctx.strokeStyle = '#718377'; ctx.lineWidth = 1;
  for (let y = baseY - 30; y < baseY + 36; y += 9) {
    ctx.beginPath(); ctx.moveTo(left - 24, y); ctx.lineTo(left - 4, y - 8); ctx.stroke();
  }
  ctx.strokeStyle = damped ? '#b9c996' : '#c0cfbd'; ctx.lineWidth = thickness; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const u = i / 100;
    const motion = active.reduce((sum, voice) => sum + voice.modes.reduce((energy, mode, n) =>
      energy + (modes[n]?.shape?.(u) ?? 0) * Math.sin(time * (4 + n * .7)) * mode.energy * 45, 0), 0);
    if (i === 0) ctx.moveTo(left, baseY); else ctx.lineTo(left + u * length, baseY + motion);
  }
  ctx.stroke(); ctx.lineCap = 'butt';
  const strikeX = left + patch.strikePosition * length;
  ctx.strokeStyle = '#d5e9a966'; ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(strikeX, baseY - 35); ctx.lineTo(strikeX, baseY + 24); ctx.stroke(); ctx.setLineDash([]);
  for (const voice of voices.filter(v => v.slot === 8)) {
    const pose = voice.exciter; if (!pose.visible) continue;
    const x = left + voice.exciter.pos01 * length, y = baseY - thickness / 2 - 5 - (1 - pose.reach) * 40;
    ctx.strokeStyle = '#ac9873'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 18, y - 32); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = '#e9ddb3'; ctx.beginPath(); ctx.ellipse(x, y, 9, 5, .3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = damped ? '#c7d7a6' : '#506454'; ctx.fillRect(left + length * .65, baseY + (damped ? 4 : 24), 22, 9);
  ctx.font = '10px Arial'; ctx.textAlign = 'left'; ctx.fillStyle = '#9aaf9d';
  ctx.fillText('CLAMP', left - 24, baseY + 52);
  ctx.fillText('FREE TIP', left + length - 25, baseY + 52);
  ctx.fillText('MODE SHAPES / STRIKE WEIGHTS', left, height * .74);
  modes.forEach((mode, index) => {
    const cell = full / 5, origin = left + index * cell, y = height * .86;
    ctx.strokeStyle = `rgba(186,218,155,${.2 + Math.min(.8, mode.amplitude * 5)})`; ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = origin + i / 40 * cell * .72;
      const value = y - mode.shape(i / 40) * 13;
      if (!i) ctx.moveTo(x, value); else ctx.lineTo(x, value);
    }
    ctx.stroke(); ctx.fillStyle = '#a9bda1'; ctx.fillText(`${Math.round(mode.frequency)} Hz`, origin, y + 24);
  });
  return { left, length, baseY };
}
