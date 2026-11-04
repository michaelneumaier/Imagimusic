import {readFileSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {renderLivingPersonalJourneyStudy} from '../src/living/personal-journey-study.js';
import {stereoWav} from '../src/loom/model.js';

const [input,destination='renders/living-personal-journey']=process.argv.slice(2);
if(!input||statSync(input).size>16*1024)throw Error('Provide a completed live-tine JSON record no larger than16KiB.');
const pcm=renderLivingPersonalJourneyStudy(JSON.parse(readFileSync(input,'utf8'))),previewGain=8;
const channels=pcm.channels.map(c=>Float32Array.from(c,v=>v*previewGain));
if(channels.some(c=>c.some(v=>!Number.isFinite(v)||Math.abs(v)>1)))throw Error('This phrase exceeds shared preview headroom; no normalization was applied.');
const identity=createHash('sha256').update(JSON.stringify(pcm.plan.source)).digest('hex');
const wav=Buffer.from(stereoWav({sampleRate:pcm.sampleRate,channels})),directory=resolve(destination),stem=`personal-${identity.slice(0,12)}`;
const report={kind:'imagimusic-living-personal-journey-render',version:1,sourceSha256:identity,seconds:pcm.seconds,previewGain,sourcePeak:pcm.peak,sha256:createHash('sha256').update(wav).digest('hex'),plan:pcm.plan,limits:'Experimental finite composition from the supplied live record, not inferred musical style. Every transformation retains the event count and original post-touch tail; intervals may reflect, accents rotate and timing scale within admission bounds. Opening and home retain the exact original record and isolated stereo PCM. Independent four-mode tine passes and velocity pickup, ideal impulses, no shared resonator state, acoustic radiation or collision simulation. Fixed gain8 without normalization; unsuitable headroom is refused. Not a supported generated-seed report, flagship recipe or film input. No listening preference or independent-review claim.'};
mkdirSync(directory,{recursive:true});writeFileSync(resolve(directory,stem+'.wav'),wav);writeFileSync(resolve(directory,stem+'.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stem,seconds:pcm.seconds,originalTouches:pcm.plan.source.events.length,voices:pcm.plan.voices.length,previewPeak:pcm.peak*previewGain}));
