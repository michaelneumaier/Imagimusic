import { DEFAULT_PATCH, MATERIALS, NOTES, envelope, makeScore, validatePatch } from './model.js';
import { InstrumentAudio, voiceLevel } from './audio.js';
const $ = id => document.getElementById(id);
let patch = { ...DEFAULT_PATCH }, playing = false, step = 0, nextTime = 0, score = makeScore(patch), voices = [];
const audio = new InstrumentAudio(), canvas = $('scene'), ctx = canvas.getContext('2d');
let width = 1000, height = 430, targets = [];
const names = ['C3','E♭3','G3','B♭3','C4','E♭4','G4','B♭4'];
const descriptions = { glass: 'Clear, scattered overtones. A little light held in a bell.', bronze: 'Close, restless partials. Warm metal with a lingering shadow.', string: 'Harmonic threads. A soft architecture of tension and release.' };
function notice(text) { $('notice').textContent = text; }
function syncUI() {
  for (const key of ['damping','brightness','spread','tempo']) {
    $(key).value = patch[key];
    $(key + '-value').textContent = key === 'tempo' ? patch[key] + ' BPM' : Math.round(patch[key] * 100) + '%';
  }
  document.querySelectorAll('[data-material]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.material === patch.material)));
  $('material-description').textContent = descriptions[patch.material];
  document.querySelector('.scene-caption span').textContent = `01 / THE ${patch.material === 'string' ? 'HARMONIC' : patch.material.toUpperCase()} ORCHARD`;
  score = makeScore(patch);
}
function strike(index, velocity = 0.8, when) {
  const voice = audio.strike(index, patch, velocity, when);
  if (voice) voices.push(voice);
}
async function touch(index) {
  try { await audio.enable(); strike(index); $('status').textContent = 'Listening · seed ' + patch.seed; }
  catch (error) { notice('Audio could not start: ' + error.message); }
}
function stop() {
  playing = false; audio.stop(); $('play').textContent = '▶ Begin sequence'; $('status').textContent = 'Quiet · ready to play';
}
$('play').onclick = async () => {
  if (playing) { stop(); return; }
  try {
    await audio.enable(); playing = true; step = 0; nextTime = audio.time + 0.08;
    $('play').textContent = 'Ⅱ Pause sequence'; $('status').textContent = 'Growing · seed ' + patch.seed;
  } catch (error) { notice(error.message); }
};
$('stop').onclick = stop;
setInterval(() => {
  if (!playing || audio.context.state !== 'running') return;
  if (nextTime < audio.time - 0.15) nextTime = audio.time + 0.03;
  while (nextTime < audio.time + 0.12) {
    const event = score[step++ % score.length];
    strike(event.index, event.velocity, nextTime); nextTime += 60 / patch.tempo / 2;
  }
}, 25);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
for (const key of ['damping','brightness','spread','tempo']) $(key).oninput = event => { patch[key] = Number(event.target.value); syncUI(); };
document.querySelectorAll('[data-material]').forEach(button => button.onclick = () => { patch.material = button.dataset.material; syncUI(); });
$('mutate').onclick = () => { patch.seed = (Math.imul(patch.seed,1664525) + 1013904223) >>> 0; syncUI(); notice('New phrase · seed ' + patch.seed); };
names.forEach((name, index) => { const button = document.createElement('button'); button.textContent = name; button.setAttribute('aria-label', 'Play ' + name); button.onclick = () => touch(index); $('notes').append(button); });
window.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
  const index = 'asdfghjk'.indexOf(event.key.toLowerCase());
  if (index >= 0) { event.preventDefault(); touch(index); }
  if (event.code === 'Space' && document.activeElement.tagName !== 'BUTTON') { event.preventDefault(); $('play').click(); }
});
canvas.addEventListener('pointerdown', event => {
  const rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
  let best = -1, distance = Infinity;
  targets.forEach((point, index) => { const value = Math.hypot((x - point.x), (y - point.y) * 0.45); if (value < distance) { distance = value; best = index; } });
  if (best >= 0 && distance < width / 8) touch(best);
});
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
$('wav').onclick = async () => {
  const button = $('wav'); button.disabled = true; button.textContent = 'Rendering…';
  notice('Rendering a 16-beat phrase with its full decay tail…');
  const captured = { ...patch };
  const worker = new Worker(new URL('./render-worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = event => { download(new Blob([event.data], { type: 'audio/wav' }), `imagimusic-${captured.seed}.wav`); notice('WAV ready · mono, 22.05 kHz. Stereo placement and live compression are preview effects.'); finish(); };
  worker.onerror = () => { notice('Rendering failed. Please try again.'); finish(); };
  function finish() { worker.terminate(); button.disabled = false; button.textContent = 'Render WAV'; }
  worker.postMessage(captured);
};
function resize() { const rect = canvas.getBoundingClientRect(); width = rect.width; height = rect.height; const dpr = Math.min(devicePixelRatio,2); canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr); ctx.setTransform(dpr,0,0,dpr,0,0); }
new ResizeObserver(resize).observe(canvas);
function draw() {
  const time = audio.time;
  voices = voices.filter(voice => voice.end > time);
  ctx.clearRect(0,0,width,height);
  const background = ctx.createRadialGradient(width*.5,height*.55,0,width*.5,height*.55,width*.6);
  background.addColorStop(0,'#203b3a'); background.addColorStop(1,'#101c20'); ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
  // A quiet perspective floor makes the invented bodies readable.
  ctx.strokeStyle='#42605835';ctx.lineWidth=1;
  for(let i=0;i<14;i++){ctx.beginPath();ctx.moveTo(width*.5+(i-7)*20,height*.45);ctx.lineTo((i-3)*width/7,height);ctx.stroke();}
  for(let i=0;i<9;i++){const y=height*.5+(i/8)**2*height*.5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();}
  targets=[];
  for(let index=0;index<8;index++){
    const x=width*(.09+index*.117), base=height*.78 + Math.sin(index*.8)*12;
    const length=height*(.49-index*.027), top=base-length;
    targets.push({x,y:top+length*.45});
    const active=voices.filter(voice=>voice.index===index && voice.time<=time);
    const energy=Math.min(1.6,active.reduce((sum,voice)=>sum+envelope(time-voice.time,voice.modes[0].decay)*voice.velocity*voiceLevel(voice,time),0));
    const color=MATERIALS[patch.material].color.join(',');
    ctx.fillStyle='#00000040';ctx.beginPath();ctx.ellipse(x+15,base+7,width*.034,9,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#69877a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,base);ctx.lineTo(x,top-20);ctx.stroke();
    const radius=width*.023;
    const glow=ctx.createRadialGradient(x,top+length*.4,0,x,top+length*.4,length*.8);
    glow.addColorStop(0,`rgba(${color},${.025+energy*.12})`);glow.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=glow;ctx.fillRect(x-length,top-length*.4,length*2,length*2);
    for(let layer=4;layer>=0;layer--){
      const y=top+layer*length*.155;
      const modalEnergy=active.reduce((sum,voice)=>{const mode=voice.modes[layer];return sum+(mode?envelope(time-voice.time,mode.decay)*mode.amplitude*voice.velocity*voiceLevel(voice,time):0);},0);
      // Stylized energy-envelope sway, not sampled audio-frequency deflection.
      const sway=Math.sin(time*5+index+layer)*modalEnergy*35;
      const r=radius*(.65+layer*.14)+modalEnergy*20;
      ctx.fillStyle=`rgba(${color},${.12+modalEnergy*.8})`;ctx.strokeStyle=`rgba(${color},${.4+Math.min(.6,modalEnergy*2)})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x+sway,y-15);ctx.bezierCurveTo(x+r+sway,y-5,x+r+sway,y+18,x+sway,y+25);ctx.bezierCurveTo(x-r+sway,y+18,x-r+sway,y-5,x+sway,y-15);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.ellipse(x+sway,y+7,r*.68,4,0,0,Math.PI*2);ctx.stroke();
    }
    // A visible impulse marker at contact; there is no claim of planned striker physics yet.
    ctx.fillStyle=`rgba(${color},${.4+Math.min(.6,energy)})`;ctx.beginPath();ctx.arc(x,base-12,3+energy*3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#8fa99b';ctx.font='10px Arial';ctx.textAlign='center';ctx.fillText(names[index],x,base+31);
    $('notes').children[index].classList.toggle('active',energy>.12);
  }
}
function frame(){draw();requestAnimationFrame(frame);}syncUI();resize();frame();
