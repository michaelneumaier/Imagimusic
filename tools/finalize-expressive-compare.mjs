// Check the kept browser render artifacts before building the shared listening page.
// This verifies bindings and WAV measurements, not an independent Node audio render.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {validatePatch} from '../src/model.js';
import {canonicalExpressionScore,composeExpressiveStudy} from '../src/midi2/expression.js';
import {openPhrasePlayer} from './open-phrase-player.mjs';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export async function verifyExpressiveComparison(directory){
 const read=name=>fs.readFile(path.join(directory,name));
 const [metadataBytes,reportBytes,aBytes,bBytes]=await Promise.all(['comparison.json','browser-verification.json','composed.json','note-only.json'].map(read));
 const metadata=JSON.parse(metadataBytes),report=JSON.parse(reportBytes),composed=JSON.parse(aBytes),plain=JSON.parse(bBytes);
 assert.equal(report.version,1);assert.equal(report.passed,true);assert.equal(report.comparisonSha256,sha(metadataBytes));
 assert.ok(metadata.patchSnapshot&&typeof metadata.patchSnapshot==='object','exact patch snapshot required');
 assert.deepEqual(validatePatch(metadata.patchSnapshot),metadata.patchSnapshot);
 assert.equal(metadata.patchSha256,sha(JSON.stringify(metadata.patchSnapshot)));assert.equal(report.patchSha256,metadata.patchSha256);
 assert.equal(canonicalExpressionScore(composed),canonicalExpressionScore(composeExpressiveStudy()),'authored composed source');
 const removed=new Set(['polyPressure','perNoteController','perNotePitchBend','pitchBend']);
 const expectedEvents=composed.events.filter(e=>!removed.has(e.type)).map((e,order)=>({...e,order}));
 const expectedPlain={...composed,source:{...composed.source,name:(composed.source.name+' · note-only').slice(0,120)},events:expectedEvents};
 assert.equal(canonicalExpressionScore(plain),canonicalExpressionScore(expectedPlain),'independently derive the note-only score');
 assert.deepEqual(report.results.map(r=>r.key),['composed','note-only']);
 const results=[];
 for(const [i,key]of ['composed','note-only'].entries()){
  const result=report.results[i],scoreBytes=i===0?aBytes:bBytes,source=metadata.scores[i===0?'composed':'noteOnly'];
  assert.equal(source.sha256,sha(scoreBytes));assert.equal(result.scoreSha256,source.sha256);
  assert.equal(result.repeatFloat32Exact,true);assert.match(result.pcmSha256,/^[a-f0-9]{64}$/);
  assert.equal(result.sampleRate,metadata.sampleRate);assert.equal(result.duration,metadata.duration);
  assert.equal(result.frames,Math.ceil(metadata.sampleRate*metadata.duration));
  const wav=await read(key+'.wav');assert.equal(sha(wav),result.wavSha256);
  assert.equal(wav.length,44+result.frames*2);
  assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt32LE(4),wav.length-8);
  assert.equal(wav.toString('ascii',8,16),'WAVEfmt ');assert.equal(wav.readUInt32LE(16),16);
  assert.equal(wav.readUInt16LE(20),1);assert.equal(wav.readUInt16LE(22),1);
  assert.equal(wav.readUInt32LE(24),result.sampleRate);assert.equal(wav.readUInt32LE(28),result.sampleRate*2);
  assert.equal(wav.readUInt16LE(32),2);assert.equal(wav.readUInt16LE(34),16);
  assert.equal(wav.toString('ascii',36,40),'data');assert.equal(wav.readUInt32LE(40),result.frames*2);
  let peak=0,energy=0,tail=0;
  for(let frame=0;frame<result.frames;frame++){const value=wav.readInt16LE(44+frame*2)/32767;peak=Math.max(peak,Math.abs(value));energy+=value*value;if(frame>=result.frames-Math.round(result.sampleRate*.1))tail=Math.max(tail,Math.abs(value));}
  assert.ok(peak>1e-5&&peak<.98);assert.equal(tail,0);assert.equal(result.final100msPeak,0);
  assert.ok(Math.abs(peak-result.peak)<=1/32767,'PCM16 peak agrees within quantization');
  assert.ok(Math.abs(Math.sqrt(energy/result.frames)-result.rms)<=1/32767,'PCM16 RMS agrees within quantization');
  results.push({key,file:key+'.wav',wavSha256:result.wavSha256,frames:result.frames,sampleRate:result.sampleRate,pcm16Peak:peak});
 }
 return {metadata,report,results};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const directory=process.argv[2]??'renders/expressive-compare',checked=await verifyExpressiveComparison(directory);
 const html=openPhrasePlayer({title:'What does expression add',intro:'The same notes, played through the same instrument. Hear the composed changes, then the notes with those expression messages removed.',question:'What does the expression add, to your ear?',disclosure:'Authored symbolic scores rendered offline through the same saved subtractive-synthesizer patch. Notes, velocities, note attributes and durations are preserved; pressure, per-note controls and pitch-bend messages differ. No normalization. This is not a MIDI 1.0 versus MIDI 2.0 comparison, an acoustic chamber simulation, or a claim of device performance. Repeated Float32 renders matched within the tested browser; saved WAVs are PCM16.',cases:checked.results.map(r=>({...r,label:r.key==='composed'?'Composed · independent expression':'Note-only · expression changes removed'})),playLinkHref:'../../expressive.html',playLinkLabel:'Watch the expressive voices ↗',listeningDb:20,listeningKey:'imagimusic-ensemble-listening-db'});
 await fs.writeFile(path.join(directory,'index.html'),html);
 await fs.writeFile(path.join(directory,'artifact-verification.json'),JSON.stringify({version:1,passed:true,results:checked.results,scope:'Canonical score derivation, exact saved patch binding, browser-report identities, WAV bytes/format/quantized measurements. Browser repeatability is reported evidence, not independently rendered here.'},null,2)+'\n');
 console.log(JSON.stringify({passed:true,results:checked.results},null,2));
}
