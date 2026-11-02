import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {retuneGroveCluster} from '../src/score/grove-tuning.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe} from '../src/score/grove-rest.js';
import {composeEnsemblePhrase,ensembleRecords} from '../src/score/grove-ensemble.js';
import {ensembleRecordFromParts,canonicalEnsembleRecord,renderEnsembleRecord} from '../src/score/grove-ensemble-record.js';
import {verifyDerivedEnsemble} from '../src/score/grove-ensemble-derived.js';
import {prepareEnsembleReturn} from '../src/grove/ensemble-return-prepare.js';
import {stereoWav} from '../src/loom/model.js';
import {openPhrasePlayer} from './open-phrase-player.mjs';

const out=process.argv[2]??'renders/ensemble-return-study',sampleRate=48000;
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const recipes=[48,51,55].map(note=>createGroveRestRecipe(retuneGroveCluster(composeGrove({seed:3}),note),DEFAULT_VOICE_CONFIG,{sampleRate}));
const original=ensembleRecordFromParts(ensembleRecords(recipes,composeEnsemblePhrase(recipes,{together:false,velocity:.5})));
const sourceText=canonicalEnsembleRecord(original),result=await prepareEnsembleReturn(original);
assert.equal(canonicalEnsembleRecord(original),sourceText);
assert.equal((await verifyDerivedEnsemble(result.derived,original)).verified,true);
const originalPcm=renderEnsembleRecord(original),returnedReference=renderEnsembleRecord(result.derived.ensemble);
assert.deepEqual(result.pcm.channels,returnedReference.channels);
await fs.mkdir(out,{recursive:true});
await fs.writeFile(path.join(out,'original.json'),sourceText+'\n');
await fs.writeFile(path.join(out,'return.json'),result.text);
const cases=[];
for(const [name,label,pcm] of [['original','Authored passage · original',originalPcm],['return','The same gestures · next voices',result.pcm]]){
 const wav=Buffer.from(stereoWav(pcm));await fs.writeFile(path.join(out,name+'.wav'),wav);
 let peak=0;for(const ch of pcm.channels)for(const v of ch)peak=Math.max(peak,Math.abs(v));
 cases.push({name,label,file:name+'.wav',wavSha256:sha(wav),frames:pcm.channels[0].length,peak});
}
const report={version:1,sampleRate,origin:'Authored short ensemble demonstration; not a personal performance.',sourceCanonicalSha256:sha(sourceText),derivedFileSha256:sha(result.text),mapping:'0 → 1, 1 → 2, 2 → 0; instruments fixed; gesture frames and shared ending unchanged',sourceVerified:true,cases,limits:'Reduced vibrating-body models with virtual pickups. Three independent instruments, fixed one-third mix, no resampling or loudness normalization. Listening shares one playback level, defaulting to +20 dB unless this browser has a saved preference; saved WAVs retain canonical model level. No subjective appeal or device-output claim.'};
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(out,'index.html'),openPhrasePlayer({title:'A passage returns',intro:'An authored phrase returns through different voices. Its arrivals and touches keep their timing; each history moves to the next instrument.',question:'What stays recognizable when the voices change? Which version invites another listen?',disclosure:report.limits,playLinkLabel:'Play Three Groves ↗',playLinkHref:'../../ensemble.html',listeningDb:20,listeningKey:'imagimusic-ensemble-listening-db',cases}));
console.log(JSON.stringify(report,null,2));
