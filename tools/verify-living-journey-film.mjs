import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {createLivingJourneyMoviePlan} from '../src/living/journey-movie-plan.js';
import {renderLivingPersonalJourneyArtifact} from '../src/living/personal-journey-artifact.js';
import {readLivingPersonalJourneyReport} from '../src/living/personal-journey-report.js';
import {renderLivingJourneyArtifact} from '../src/living/journey-artifact.js';
import {prepareLivingJourneyMovieAudio} from '../src/living/journey-movie-audio.js';
import {readLivingJourneyReport,LIVING_JOURNEY_REPORT_LIMIT} from '../src/living/journey-report.js';

const hash=bytes=>createHash('sha256').update(new Uint8Array(bytes)).digest('hex');
const scope='Rebuilt model/frame states and exact same-runtime source recording only. Does not inspect MP4 bytes, pixels, codecs, decoded AAC, audiovisual synchronization or musical quality. Shared model factories are reused; this is not independent peer review.';

export async function verifyLivingJourneyFilm(manifest,scoreText,wav){
 const checks=[];const check=(name,ok)=>checks.push({name,ok});
 try{
  if(!(wav instanceof ArrayBuffer)||wav.byteLength<44||wav.byteLength>64*1024*1024)throw Error('Use a WAV no larger than64MiB.');
  if(JSON.stringify(manifest).length>2*1024*1024)throw Error('Film details exceed2MiB.');
  if(typeof scoreText!=='string'||Buffer.byteLength(scoreText)>LIVING_JOURNEY_REPORT_LIMIT)throw Error('Score report exceeds its input limit.');
  const personal=JSON.parse(scoreText)?.kind==='imagimusic-living-personal-journey-artifact';
  const kept=(personal?readLivingPersonalJourneyReport:readLivingJourneyReport)(scoreText),plan=createLivingJourneyMoviePlan(kept.request,{reveal:manifest?.reveal});
  const {audio,codecs,encoding,...storedPlan}=manifest;
  // Downloads are JSON: e.g. the first instance's -0 depth returns as 0.
  // Compare the exact serialized contract rather than in-memory signed zero.
  check('Full score, layout, timing, reveal choice and every frame-state hash rebuild',isDeepStrictEqual(JSON.parse(JSON.stringify(storedPlan)),JSON.parse(JSON.stringify(plan.manifest))));
  check('Declared codec choices are H.264/AAC',isDeepStrictEqual(codecs,{video:'avc',audio:'aac'}));
  check('Encoding scope is retained as text',typeof encoding==='string'&&encoding.length>0);
  const rebuilt=await (personal?renderLivingPersonalJourneyArtifact:renderLivingJourneyArtifact)(kept.request);
  const {wav:rebuiltWav,...rebuiltReport}=rebuilt;
  check('Complete generated score report matches this runtime',isDeepStrictEqual(JSON.parse(scoreText),rebuiltReport));
  const expected=await prepareLivingJourneyMovieAudio(rebuilt,plan.manifest);
  check('Saved soundtrack evidence matches regenerated recording',isDeepStrictEqual(audio,expected.evidence));
  check('Provided WAV bytes equal the regenerated recording',wav.byteLength===rebuiltWav.byteLength&&hash(wav)===rebuilt.sha256);
  return {ok:checks.every(c=>c.ok),checks,...(personal?{personal:true,touches:kept.request.source.events.length}:{seed:kept.request.seed,treatment:kept.request.treatment}),modelFrames:plan.times.length,audioSamples:rebuilt.frames,scope};
 }catch(error){checks.push({name:error.message,ok:false});return {ok:false,checks,scope};}
}

function readBounded(path,limit){const size=statSync(path).size;if(size>limit)throw Error(`Input exceeds ${limit} bytes: ${path}`);const bytes=readFileSync(path);if(bytes.length!==size)throw Error('Input changed during reading.');return bytes;}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{
  const args=process.argv.slice(2);if(args.length!==3)throw Error('Usage: node tools/verify-living-journey-film.mjs film-details.json score-report.json soundtrack.wav');
  const manifest=JSON.parse(readBounded(args[0],2*1024*1024).toString('utf8')),score=readBounded(args[1],LIVING_JOURNEY_REPORT_LIMIT).toString('utf8'),bytes=readBounded(args[2],64*1024*1024);
  const result=await verifyLivingJourneyFilm(manifest,score,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
  console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
 }catch(error){console.error(error.message);process.exitCode=1;}
}
