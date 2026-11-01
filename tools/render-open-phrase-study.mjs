import {openPhrasePlayer} from './open-phrase-player.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,validateRestAdmission,renderRestRecord} from '../src/score/grove-rest.js';
import {composeOnPulsePhrase,onPulseRecord} from '../src/score/grove-pulse.js';
import {stereoWav} from '../src/loom/model.js';

// A listening artifact for the Grove3 prototype: authored examples, never a
// recommendation for a visitor's response time. No normalization or limiter.
const out=process.argv[2]??'renders/open-phrase-study';
const recipe=createGroveRestRecipe(composeGrove({seed:3}),DEFAULT_VOICE_CONFIG,{sampleRate:48000});
const phrase=composeOnPulsePhrase(recipe),base=onPulseRecord(recipe,phrase).record;
const ending=phrase.endFrame+Math.round(5.5*recipe.sampleRate),velocity=.5;
const choices=[['opening',null],['answer-soon',.25],['answer-later',.75],['answer-after-space',1.5]];
const report={version:1,seed:3,sampleRate:recipe.sampleRate,outputGain:recipe.outputGain,opening:phrase.commands,returnFrame:phrase.endFrame,physicalPeriodSeconds:phrase.physicalPeriodSeconds,pulseUnitSeconds:phrase.pulseUnitSeconds,referenceDelaySeconds:phrase.referenceDelaySeconds,response:{body:phrase.neighbor,position:phrase.position,velocity},ending:{frame:ending,fadeFrames:base.ended.fadeFrames},cases:[],question:'Does the returning note invite an answer, and how does the available space feel at each delay?',limits:'These are authored examples on Grove3, not actual human responses or recommended response times. Same opening, response gesture, gain and ending; only the response delay changes. No listening or appeal verdict. The opening-only case has no response.'};
await fs.mkdir(out,{recursive:true});
for(const [name,delay] of choices){
 const record=structuredClone(base);record.ended={...report.ending};
 if(delay!==null)record.events.push({frame:phrase.endFrame+Math.round(delay*recipe.sampleRate),order:record.events.length,...report.response});
 validateRestAdmission(record,recipe);
 const pcm=renderRestRecord(record,recipe),wav=Buffer.from(stereoWav(pcm)),json=JSON.stringify(record,null,2)+'\n';
 if(!pcm.channels.every(c=>c.every(Number.isFinite)))throw new Error('Non-finite study audio');
 if(pcm.channels[0].length!==ending+record.ended.fadeFrames)throw new Error('Study durations differ');
 await fs.writeFile(path.join(out,name+'.json'),json);await fs.writeFile(path.join(out,name+'.wav'),wav);
 report.cases.push({name,answerDelaySeconds:delay,answerFrame:delay===null?null:record.events.at(-1).frame,strikes:record.events.length,samples:pcm.channels[0].length,wavSha256:crypto.createHash('sha256').update(wav).digest('hex'),recordSha256:crypto.createHash('sha256').update(json).digest('hex')});
}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(out,'README.md'),'# Room for an answer\n\nFour authored listening examples for the optional Leave room prototype. Listen to opening.wav, then compare answer-soon.wav, answer-later.wav, and answer-after-space.wav. The same neighbor strike arrives 0.25, 0.75, or 1.5 seconds after the return. These are illustrations, not recommended timings.\n\nAll four keep the same Grove3, default voice, model gain, opening and ending. No loudness normalization. Records are canonical Rest files and can be opened locally with reopen.html. report.json contains exact frames and hashes.\n\nListening questions: Does the return feel like a return? Is there room to enter? Does an answer join the existing ring or feel separate? No subjective listening verdict has been made.\n');
console.log(JSON.stringify(report,null,2));
await fs.writeFile(path.join(out,'index.html'),openPhrasePlayer({
 title:'Room for an answer',
 intro:'Hear the opening alone, then the same answer placed at three different distances from its return.',
 question:'Does the return feel like a return? Does an answer join the ring, or begin something separate?',
 disclosure:'Authored listening examples on Grove 3. These delays are illustrations, not targets. The opening, answer strength, model gain and ending stay the same; the opening-only example has no answer. No listening verdict has been made.',
 cases:report.cases.map(c=>({file:c.name+'.wav',wavSha256:c.wavSha256,label:c.answerDelaySeconds===null?'Opening alone':'Answer after '+c.answerDelaySeconds+' seconds'}))
}));
