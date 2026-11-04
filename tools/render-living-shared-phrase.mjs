import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createTineDesign} from '../src/tine/address.js';
import {createLivingSharedPhrasePass} from '../src/living/shared-phrase-pass.js';
import {personalOriginalWav} from '../src/living/personal-original.js';

const directory=resolve(process.argv[2]??'renders/living-shared-phrase-study');
const source={kind:'imagimusic-tine-live',version:1,design:createTineDesign(),sampleRate:48000,events:[{frame:16800,strength:.025},{frame:28800,strength:.1},{frame:48000,strength:.05}],fadeStart:120000};
const guests=[{frame:28800,strength:.05},{frame:72000,strength:.025}];
mkdirSync(directory,{recursive:true});
const reports=[];
for(const [name,input] of [['original',[]],['joined',guests]]){
 const pass=createLivingSharedPhrasePass(source),frames=121200,samples=new Float32Array(frames);pass.start();
 for(const event of input){pass.process(samples.subarray(pass.frame,event.frame));pass.strike(event.strength);}
 pass.process(samples.subarray(pass.frame));const snapshot=pass.snapshot(),record={...source,events:snapshot.events};
 const wav=personalOriginalWav({record,sampleRate:48000,frames,channels:[samples]},record);
 const report={kind:'imagimusic-living-shared-phrase-demonstration',version:1,name,source,guests:input,acceptedRecord:record,applied:snapshot.applied,frames,seconds:frames/48000,previewGain:8,sha256:createHash('sha256').update(new Uint8Array(wav)).digest('hex'),scope:'Authored demonstration, not a visitor recording. One continuing four-mode body; score events precede guest events at the same frame. No collisions, acoustic radiation, long-running scheduling or native live participation verified.'};
 writeFileSync(resolve(directory,name+'.wav'),new Uint8Array(wav));writeFileSync(resolve(directory,name+'.json'),JSON.stringify(report,null,2)+'\n');reports.push({name,seconds:report.seconds,sha256:report.sha256});
}
console.log(JSON.stringify({directory,reports},null,2));
