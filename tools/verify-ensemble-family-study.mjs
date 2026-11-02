import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {canonicalEnsembleRecord,validateEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {renderEnsembleMix} from '../src/grove/ensemble-mix.js';
import {stereoWav} from '../src/loom/model.js';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
/** Checks the authored experiment, not just that its files agree with a manifest.
 * Rendering uses the block mixer, independently of the producer's full renderer. */
export async function verifyFamilyStudy(directory){
 const report=JSON.parse(await fs.readFile(path.join(directory,'report.json'),'utf8'));
 const html=await fs.readFile(path.join(directory,'index.html'),'utf8');
 const buttons=[...html.matchAll(/<button\b[^>]*data-file="([^"]+)"[^>]*data-sha256="([^"]+)"[^>]*>/g)];
 assert.deepEqual(report.cases.map(c=>c.seed),[3,7,11],'exactly the three curated families in order');
 assert.equal(report.sampleRate,48000);assert.equal(buttons.length,3);
 const checks=[];let vocabulary;
 for(const [i,seed] of [3,7,11].entries()){
  const item=report.cases[i],name=`family-${seed}`;
  assert.equal(item.name,name);assert.equal(item.file,name+'.wav');assert.equal(item.recordFile,name+'.json');
  const text=await fs.readFile(path.join(directory,item.recordFile),'utf8'),record=JSON.parse(text);
  validateEnsembleRecord(record,{admission:true});
  assert.equal(text,canonicalEnsembleRecord(record)+'\n');
  assert.equal(record.sampleRate,48000);assert.deepEqual(record.ended,{frame:288000,fadeFrames:1200});
  const groves=[48,51,55].map(note=>retuneGroveCluster(composeGrove({seed}),note));
  assert.deepEqual(record.parts.map(p=>p.record.grove),groves,'full generated anatomy, not seed labels alone');
  assert.deepEqual(record.parts[0].record.events,[{frame:0,order:0,body:0,position:1,velocity:.5}]);
  assert.deepEqual(record.parts.slice(1).map(p=>p.record.events),[[],[]]);
  assert.deepEqual(record.parts.map(p=>p.record.contacts),[[],[],[]]);
  const current=record.parts.map(({record:r})=>({voice:r.voice,outputGain:r.outputGain,zones:r.zones,strengths:r.strengths}));
  for(const part of current)assert.deepEqual(part.voice,DEFAULT_VOICE_CONFIG);
  if(vocabulary)assert.deepEqual(current,vocabulary,'only generated anatomy changes');else vocabulary=current;
  const g=groves[0];assert.deepEqual(item.anatomy,{bodiesHz:g.bodies.map(b=>+b.hz.toFixed(1)),masses:g.bodies.map(b=>+b.mass.toFixed(4)),bridges:g.bridges.map(e=>({a:e.a+1,b:e.b+1,coupling:+e.coupling.toFixed(4)})),loss:g.loss});
  const pcm=renderEnsembleMix(record),rebuilt=Buffer.from(stereoWav(pcm)),wav=await fs.readFile(path.join(directory,item.file));
  assert.deepEqual(wav,rebuilt,'saved WAV equals independent fixed one-third block mix');
  let peak=0;for(const channel of pcm.channels)for(const sample of channel)peak=Math.max(peak,Math.abs(sample));
  assert.equal(item.peak,peak);assert.equal(item.peakDbfs,+(20*Math.log10(peak)).toFixed(1));
  assert.equal(item.frames,289200);assert.equal(item.recordSha256,sha(text));assert.equal(item.wavSha256,sha(wav));
  assert.equal(buttons[i][1],item.file);assert.equal(buttons[i][2],sha(wav));
  checks.push({seed,frames:item.frames,peakDbfs:item.peakDbfs,wavSha256:sha(wav),recordSha256:sha(text),independentMixByteExact:true});
 }
 return {scope:'Authored records, anatomy and gesture invariants, report/file identities and exact independent mix; no hearing, preference or device-performance verdict. Envelope-share measurements are not independently recomputed here.',checks};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const directory=process.argv[2]??'renders/ensemble-family-study';
 console.log(JSON.stringify(await verifyFamilyStudy(directory),null,2));
}
