import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {renderLivingJourneyStudy} from '../src/living/journey-study.js';
import {stereoWav} from '../src/loom/model.js';

const seed=Number(process.argv[2]??42),directory=resolve(process.argv[3]??'renders/living-journey-study');
const pcm=renderLivingJourneyStudy(seed),previewGain=8;
const channels=pcm.channels.map(c=>Float32Array.from(c,v=>v*previewGain));
if(channels.some(c=>c.some(v=>!Number.isFinite(v)||Math.abs(v)>1)))throw Error('Shared preview gain clips.');
const wav=Buffer.from(stereoWav({sampleRate:pcm.sampleRate,channels}));
const report={seed,seconds:pcm.seconds,previewGain,sourcePeak:pcm.peak,sha256:createHash('sha256').update(wav).digest('hex'),limits:'Finite authored seven-chapter study derived from one seed, not adaptive composition or a continuous physical simulation. Each chapter restarts independent four-mode tine passes with ideal impulses and a velocity pickup. Recorded endings and explicit silence separate chapters. Arrangement3 uses ideal distributed viscous loss, not a contact pad. No acoustic radiation, coupling, normalization or new instrument invention. Chapter names describe compositional intent, not measured emotions. No subjective listening verdict or independent review claimed.',plan:pcm.plan};
mkdirSync(directory,{recursive:true});
writeFileSync(resolve(directory,`journey-${seed}.wav`),wav);
writeFileSync(resolve(directory,`journey-${seed}.json`),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({directory,seed,seconds:pcm.seconds,previewPeak:pcm.peak*previewGain,chapters:pcm.plan.sections.map(s=>({name:s.name,start:s.startFrame/pcm.sampleRate,end:s.endFrame/pcm.sampleRate}))},null,2));
