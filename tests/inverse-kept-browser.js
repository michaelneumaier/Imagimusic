import {readInverseFile,INVERSE_IMPORT_MAX_BYTES} from '../src/inverse/read-file.js';
import {createInverseJobs} from '../src/inverse/jobs.js';
import {canonicalInverseCandidate} from '../src/score/grove-inverse-kept.js';
import {createInversePhrase,inverseAnatomySha256} from '../src/score/grove-inverse-phrase.js';
import {keepInversePassage,canonicalInversePassage} from '../src/score/grove-inverse-passage.js';
import {createInversePhraseCapture} from '../src/inverse/phrase-capture.js';
import {createInverseInstrument} from '../src/inverse/instrument.js';
const button=document.querySelector('#run'),result=document.querySelector('#result');
const assert=(yes,message)=>{if(!yes)throw new Error(message);};
button.onclick=async()=>{
 button.disabled=true;result.textContent='Checking real workers…';const jobs=createInverseJobs(),checks=[];
 const rejects=async(text,label)=>{let refused=false;try{await jobs.run({kind:'reopen',text});}catch{refused=true;}assert(refused,label+' was accepted');checks.push(label);};
 try{
  const response=await fetch('./fixtures/inverse-kept-chain.json');assert(response.ok,'Fixture unavailable');
  const bytes=await response.arrayBuffer(),file=new File([bytes],'inverse-kept-chain.json',{type:'application/json'});
  const input=await readInverseFile(file),original=JSON.parse(input.text);assert(new TextEncoder().encode(input.text).byteLength===bytes.byteLength,'Read changed byte length');checks.push('Local UTF-8 File read');
  const opened=await jobs.run({kind:'reopen',text:input.text});
  assert(canonicalInverseCandidate(opened.record)===canonicalInverseCandidate(original),'Worker changed saved identity');
  assert(opened.candidate.status==='within-tolerance','Default chain no longer fits');checks.push('Worker reopen preserves canonical record and fit');
  const prepared=await jobs.run({kind:'candidate',grove:opened.candidate.grove,sampleRate:8000});
  const direct=createInverseInstrument(original.grove,{sampleRate:8000});let samples=0,maxError=0;
  for(let body=0;body<3;body++){
   const expected=direct.renderStrike(body);assert(prepared.strikes[body].channels.length===2,'Channel count changed');
   for(let c=0;c<2;c++){
    const actual=prepared.strikes[body].channels[c],reference=expected.channels[c];assert(actual.length===reference.length,'PCM length changed');
    for(let i=0;i<reference.length;i++){assert(Number.isFinite(actual[i]),'Non-finite sample');maxError=Math.max(maxError,Math.abs(actual[i]-reference[i]));samples++;}
   }
  }
  assert(maxError===0,'Prepared samples changed after reopening');checks.push('Three-strike stereo PCM equals direct saved model');
  const phrase=createInversePhrase([{body:1,time:10},{body:0,time:10.375},{body:2,time:10.75}],{at:'2026-11-02T09:00:00.000Z',sampleRate:8000,anatomySha256:await inverseAnatomySha256(original.grove)});
  const passage=await keepInversePassage(original,phrase,{at:'2026-11-02T09:01:00.000Z'}),passageText=await canonicalInversePassage(passage);
  const passageInput=await readInverseFile(new File([passageText],'phrase.json',{type:'application/json'}));
  const returned=await jobs.run({kind:'reopen',text:passageInput.text});
  assert(await canonicalInversePassage(returned.record)===passageText,'Passage changed across File/worker boundary');
  assert(returned.candidate.status===opened.candidate.status,'Passage fit differs');
  assert(JSON.stringify(returned.bound)===JSON.stringify(opened.bound),'Passage bound differs');
  const capture=createInversePhraseCapture();capture.restore(returned.phrase);
  const restoredPhrase=capture.snapshot.phrase;
  assert(phrase.events.length===restoredPhrase.events.length&&phrase.events.every((e,i)=>e.body===restoredPhrase.events[i].body&&e.at===restoredPhrase.events[i].at),'Restored touches changed');
  for(const key of Object.keys(phrase).filter(k=>k!=='events'))assert(restoredPhrase[key]===phrase[key],'Restored phrase field changed: '+key);checks.push('Portable File/worker round trip, fit and restored phrase');
  const returnedPCM=await jobs.run({kind:'candidate',grove:returned.candidate.grove,sampleRate:8000});
  for(let b=0;b<3;b++)for(let c=0;c<2;c++){
   const actual=returnedPCM.strikes[b].channels[c],expected=prepared.strikes[b].channels[c];assert(actual.length===expected.length,'Passage PCM length differs');
   for(let i=0;i<expected.length;i++)assert(actual[i]===expected[i],'Passage PCM differs');
  }checks.push('Portable anatomy prepares identical stereo PCM');
  const mismatch=structuredClone(passage);mismatch.phrase.anatomySha256='0'.repeat(64);
  await rejects(JSON.stringify(mismatch),'Passage origin mismatch refused');
  const foreign=structuredClone(passage);foreign.anatomy.model.outputGain+=1;
  await rejects(JSON.stringify(foreign),'Passage incompatible model refused');
  assert(capture.snapshot.phrase===restoredPhrase,'Refused worker intake changed completed memory');
  const incompatible=structuredClone(original);incompatible.model.outputGain+=1;
  await rejects(JSON.stringify(incompatible),'Incompatible model refused');await rejects('{','Malformed JSON refused');
  await rejects(' '.repeat(INVERSE_IMPORT_MAX_BYTES+1),'Oversized worker input refused');
  const pending=jobs.run({kind:'reopen',text:input.text});jobs.cancel();let cancelled=false;
  try{await pending;}catch(error){cancelled=error.name==='AbortError';}assert(cancelled,'Cancellation did not reject');checks.push('Pending real worker cancelled');
  const retry=await jobs.run({kind:'reopen',text:input.text});assert(canonicalInverseCandidate(retry.record)===canonicalInverseCandidate(original),'Retry changed record');checks.push('Retry after refusals and cancellation');
  result.textContent=`PASS: ${checks.length} checks; ${samples} compared samples; PCM maximum error ${maxError}; ${bytes.byteLength}-byte fixture.\n`+JSON.stringify({checks,samples,maxError,bytes:bytes.byteLength,fit:opened.candidate.status,maxAbsCents:opened.candidate.residual.maxAbsCents,userAgent:navigator.userAgent,scope:'Actual File reader and workers; no native chooser or production UI lifecycle claim.'},null,2);
 }catch(error){result.textContent='FAIL: '+error.message;}finally{jobs.cancel();button.disabled=false;}
};
