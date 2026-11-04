import {readFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createLivingJourneyStudy} from '../src/living/journey-study.js';
import {createLivingConnectedJourneyStudy} from '../src/living/connected-journey-study.js';
import {createLivingEvolvingJourneyStudy} from '../src/living/evolving-journey-study.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const treatments=[['chapters','',createLivingJourneyStudy],['connected','-connected',createLivingConnectedJourneyStudy],['evolving','-evolving',createLivingEvolvingJourneyStudy]];
export async function checkLivingJourneyArtifacts(directory=join(root,'renders/living-journey-study')){
 const results=[];
 for(const [treatment,suffix,make] of treatments)for(const seed of [42,2950288811]){
  const stem=`journey-${seed}${suffix}`;let error=null;
  try{
   const report=JSON.parse(await readFile(join(directory,stem+'.json'),'utf8'));
   if(report.previewGain!==8||JSON.stringify(report.plan)!==JSON.stringify(make(seed)))throw Error('report does not match the current score');
   const hash=createHash('sha256');for await(const chunk of createReadStream(join(directory,stem+'.wav')))hash.update(chunk);
   if(hash.digest('hex')!==report.sha256)throw Error('WAV does not match its report');
  }catch(e){error=e.message;}
  results.push({seed,treatment,stem,ready:error===null,error});
 }
 return results;
}

async function main(){
 const args=process.argv.slice(2);let directory=join(root,'renders/living-journey-study'),check=false;
 for(let i=0;i<args.length;i++){
  if(args[i]==='--check')check=true;
  else if(args[i]==='--directory'&&args[i+1])directory=resolve(args[++i]);
  else throw Error('Usage: node tools/prepare-living-journeys.mjs [--check] [--directory PATH]');
 }
 let states=await checkLivingJourneyArtifacts(directory);
 for(const state of states){
  if(state.ready){console.log('Verified: '+state.stem);continue;}
  if(check){console.log('Missing or stale: '+state.stem+' · '+state.error);continue;}
  console.log('Rendering: '+state.stem);
  const flags=state.treatment==='chapters'?[]:['--'+state.treatment];
  await new Promise((yes,no)=>{const child=spawn(process.execPath,['tools/render-living-journey-study.mjs',String(state.seed),directory,...flags],{cwd:root,stdio:['ignore','ignore','inherit']});child.on('error',no);child.on('exit',(code,signal)=>code===0?yes():no(Error('Journey render failed: '+(signal??code))));});
 }
 if(!check)states=await checkLivingJourneyArtifacts(directory);
 const missing=states.filter(s=>!s.ready);
 if(missing.length){process.exitCode=1;console.log(`${missing.length} journey artifact pairs need preparation.`);}
 else console.log('All six journey WAV/report pairs match the current scores.');
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
