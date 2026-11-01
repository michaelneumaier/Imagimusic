import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {createGroveRestRecipe,validateRestAdmission,renderRestRecord} from '../src/score/grove-rest.js';
import {composeOnPulsePhrase,onPulseRecord} from '../src/score/grove-pulse.js';
import {stereoWav} from '../src/loom/model.js';
import {openPhrasePlayer} from './open-phrase-player.mjs';

const out=process.argv[2]??'renders/open-phrase-recurrence';
const recipe=createGroveRestRecipe(composeGrove({seed:3}),DEFAULT_VOICE_CONFIG,{sampleRate:48000});
const report={version:1,seed:3,sampleRate:recipe.sampleRate,outputGain:recipe.outputGain,answerDelaySeconds:.75,answerVelocity:.5,tailAfterFinalCallSeconds:5.5,cases:[],limits:'Authored audition, not a human timing target. Longer version adds one call-and-answer pair before the final call. Both versions keep the same answer relative to that final call and the same tail duration; their total durations differ. No loudness normalization or appeal verdict. Production opening unchanged.'};
await fs.mkdir(out,{recursive:true});let shorter;
for(const cycles of [1,2]){
 const phrase=composeOnPulsePhrase(recipe,{cycles});
 if(cycles===1)shorter=phrase;
 else{assert.equal(phrase.referenceDelaySeconds,shorter.referenceDelaySeconds);assert.equal(phrase.pulseUnitSeconds,shorter.pulseUnitSeconds);}
 for(const withAnswer of [false,true]){
  const name=(cycles===1?'one-cycle':'two-cycles')+(withAnswer?'-answer':'-opening'),record=onPulseRecord(recipe,phrase).record;
  record.ended.frame=phrase.endFrame+Math.round(report.tailAfterFinalCallSeconds*recipe.sampleRate);
  if(withAnswer)record.events.push({frame:phrase.endFrame+Math.round(report.answerDelaySeconds*recipe.sampleRate),order:record.events.length,body:phrase.neighbor,position:phrase.position,velocity:report.answerVelocity});
  validateRestAdmission(record,recipe);
  const pcm=renderRestRecord(record,recipe),wav=Buffer.from(stereoWav(pcm)),json=JSON.stringify(record,null,2)+'\n';
  if(!pcm.channels.every(c=>c.every(Number.isFinite)))throw new Error('Non-finite audio');
  await fs.writeFile(path.join(out,name+'.json'),json);await fs.writeFile(path.join(out,name+'.wav'),wav);
  report.cases.push({name,cycles,withAnswer,openingStrikes:phrase.commands.length,finalCallFrame:phrase.endFrame,answerFrame:withAnswer?record.events.at(-1).frame:null,ended:record.ended,samples:pcm.channels[0].length,wavSha256:crypto.createHash('sha256').update(wav).digest('hex'),recordSha256:crypto.createHash('sha256').update(json).digest('hex')});
 }
}
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(out,'index.html'),openPhrasePlayer({
 title:'One more return',
 intro:'Compare a shorter opening with one that lets the call and answer recur once more. Then hear each with the same answer added.',
 question:'Does another recurrence make the space feel inviting, or does the shorter opening leave more room for you?',
 disclosure:'Authored examples on Grove 3. Answers arrive 0.75 seconds after the final call at the same strength. The longer opening adds one call-and-answer pair; both leave the same tail after the final call, so total lengths differ. No timing target, normalization, or listening verdict.',
 cases:report.cases.map(c=>({file:c.name+'.wav',label:(c.cycles===1?'Shorter opening':'Another recurrence')+(c.withAnswer?' + answer':' alone')}))
}));
console.log(JSON.stringify(report,null,2));
