import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {verifyExpressiveComparison} from '../tools/finalize-expressive-compare.mjs';
import {composeExpressiveStudy,canonicalExpressionScore} from '../src/midi2/expression.js';
import {createExpressionPerformance} from '../src/expressive/performance.js';
import {DEFAULT_PATCH,validatePatch,encodeWav} from '../src/model.js';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
// Synthetic audio, explicitly NOT a browser render. Exercise the artifact verifier's
// identity/format/derivation checks; real browser evidence is produced separately.
async function fixture(t){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'imagimusic-expression-audit-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const score=composeExpressiveStudy(),patchSnapshot=validatePatch(DEFAULT_PATCH),p=createExpressionPerformance(score,patchSnapshot,48000);
 const plain={...score,source:{...score.source,name:score.source.name+' · note-only'},events:score.events.filter(e=>!['polyPressure','perNoteController','perNotePitchBend','pitchBend'].includes(e.type)).map((e,order)=>({...e,order}))};
 const texts=[score,plain].map(s=>canonicalExpressionScore(s)+'\n');
 const metadata={version:1,patchSnapshot,patchSha256:sha(JSON.stringify(patchSnapshot)),sampleRate:48000,duration:p.duration,scores:{composed:{sha256:sha(texts[0])},noteOnly:{sha256:sha(texts[1])}}};
 const metadataText=JSON.stringify(metadata),values=new Float32Array(Math.ceil(p.duration*48000));values[0]=.02;
 const wav=Buffer.from(encodeWav(values,48000));
 const report={version:1,passed:true,userAgent:'SYNTHETIC UNIT FIXTURE, NOT BROWSER EVIDENCE',comparisonSha256:sha(metadataText),patchSha256:metadata.patchSha256,results:['composed','note-only'].map((key,i)=>({key,scoreSha256:sha(texts[i]),sampleRate:48000,duration:p.duration,frames:values.length,repeatFloat32Exact:true,pcmSha256:sha(new Uint8Array(values.buffer)),wavSha256:sha(wav),peak:values[0],rms:values[0]/Math.sqrt(values.length),final100msPeak:0}))};
 const put=(name,value)=>fs.writeFile(path.join(dir,name),typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));
 await Promise.all([put('comparison.json',metadataText),put('browser-verification.json',report),put('composed.json',texts[0]),put('note-only.json',texts[1]),put('composed.wav',wav),put('note-only.wav',wav)]);
 return {dir,put,report,metadata,plain,wav};
}
test('artifact verification accepts bound fixtures and refuses changed WAV bytes or a false browser result',async t=>{
 const f=await fixture(t);assert.equal((await verifyExpressiveComparison(f.dir)).results.length,2);
 const damaged=Buffer.from(f.wav);damaged[44]^=1;await f.put('composed.wav',damaged);
 await assert.rejects(verifyExpressiveComparison(f.dir));
 await f.put('composed.wav',f.wav);f.report.passed=false;await f.put('browser-verification.json',f.report);
 await assert.rejects(verifyExpressiveComparison(f.dir));
});
test('matching replacement hashes cannot conceal a wrong note-only derivation or WAV format',async t=>{
 const f=await fixture(t);f.plain.events.find(e=>e.type==='noteOn').velocity16--;
 const text=canonicalExpressionScore(f.plain)+'\n';await f.put('note-only.json',text);f.metadata.scores.noteOnly.sha256=sha(text);f.report.results[1].scoreSha256=sha(text);
 const metadataText=JSON.stringify(f.metadata);f.report.comparisonSha256=sha(metadataText);await f.put('comparison.json',metadataText);await f.put('browser-verification.json',f.report);
 await assert.rejects(verifyExpressiveComparison(f.dir),/independently derive/);
 const g=await fixture(t),damaged=Buffer.from(g.wav);damaged.writeUInt16LE(2,22);g.report.results[0].wavSha256=sha(damaged);await g.put('composed.wav',damaged);await g.put('browser-verification.json',g.report);
 await assert.rejects(verifyExpressiveComparison(g.dir));
});
