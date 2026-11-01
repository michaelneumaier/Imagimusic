import { DEFAULT_PATCH } from '../src/model.js';
import { createBellowsGraph, applyBellowsSchedule, renderBellows } from '../src/bellows-audio.js';
const results = [];
const assert = (value, message) => { if (!value) throw new Error(message); };
async function check(name, run) {
  const row = document.createElement('li'); row.textContent = name + ' — running'; document.getElementById('results').append(row);
  try { const detail = await run(); row.textContent = 'PASS · ' + name; const code = document.createElement('pre'); code.textContent = JSON.stringify(detail, null, 2); row.append(code); results.push({name,passed:true,detail}); }
  catch(error) { row.textContent = 'FAIL · ' + name + ': ' + error.message; results.push({name,passed:false,error:error.message}); }
}
async function oneVoice(patch, rolling = false, sourceSeed = 731) {
  const voice = { id:1, noteHz:220, velocity:.8, noteOn:.05, noteOff:.65 };
  const end = voice.noteOff + patch.bellows.adsr.r;
  const context = new OfflineAudioContext(1, Math.ceil((end+.1)*48000),48000);
  const graph = createBellowsGraph(context, context.destination, voice, patch, sourceSeed);
  if (rolling) {
    for(let from=voice.noteOn;from<end-1e-9;){const to=Math.min(end,from+.1);applyBellowsSchedule(graph,voice,patch,48000,from,to);from=to;}
  } else applyBellowsSchedule(graph,voice,patch,48000,voice.noteOn,end);
  graph.source.start(voice.noteOn);graph.source.stop(end+.01);
  return (await context.startRendering()).getChannelData(0);
}
await check('Rolling and whole-note automation render the same waveform', async()=>{
  const patch=structuredClone(DEFAULT_PATCH), a=await oneVoice(patch), b=await oneVoice(patch,true);
  let peakError=0,peakSignal=0;for(let i=0;i<a.length;i++){peakError=Math.max(peakError,Math.abs(a[i]-b[i]));peakSignal=Math.max(peakSignal,Math.abs(a[i]));}
  assert(peakSignal>.001,'Silent waveform');assert(peakError<1e-4,`Scheduling difference ${peakError}`);
  return {samples:a.length,peakSignal,peakError};
});
await check('Air source renders repeatably from its seed',async()=>{
  const patch=structuredClone(DEFAULT_PATCH);patch.bellows.source='air';
  const a=await oneVoice(patch,false,42), b=await oneVoice(patch,false,42), c=await oneVoice(patch,false,43);
  let same=0,different=0;for(let i=0;i<a.length;i++){same=Math.max(same,Math.abs(a[i]-b[i]));different=Math.max(different,Math.abs(a[i]-c[i]));}
  assert(same<1e-6,'Same-seed audio differed');assert(different>.001,'Different seed did not affect noise');return{sameSeedError:same,differentSeedDifference:different};
});
await check('Gate release reaches silence in the rendered audio',async()=>{
  const a=await oneVoice(structuredClone(DEFAULT_PATCH));let tailPeak=0;for(let i=a.length-2400;i<a.length;i++)tailPeak=Math.max(tailPeak,Math.abs(a[i]));
  assert(tailPeak<1e-7,`Non-silent tail ${tailPeak}`);return{last50msPeak:tailPeak};
});
await check('Maximum resonance export is finite and remains within PCM range',async()=>{
  const patch=structuredClone(DEFAULT_PATCH);patch.bellows.resonance=1;patch.bellows.cutoffHz=180;patch.bellows.envAmount=0;patch.bellows.lfo.depthOct=0;
  const samples=await renderBellows(patch);let peak=0;for(const value of samples){assert(Number.isFinite(value),'Non-finite PCM');peak=Math.max(peak,Math.abs(value));}
  assert(peak>.001&&peak<1,`Peak outside range: ${peak}`);return{seconds:samples.length/48000,peak};
});
const passed=results.filter(r=>r.passed).length;
document.getElementById('summary').textContent=`${passed}/${results.length} browser audio checks passed.`;
