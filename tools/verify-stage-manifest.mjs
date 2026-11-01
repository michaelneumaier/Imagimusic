import {isDeepStrictEqual} from 'node:util';
import {attachLoomPerformance,validateComposition} from '../src/stage/composition.js';
import {validatePatch} from '../src/model.js';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createPerformance} from '../src/stage/performance.js';
import {createStageFrames} from '../src/stage/frame.js';
import {createTraceManifest} from '../src/stage/manifest.js';

/** Recompute scene proof from the saved instrument and camera, never trusting saved hashes. */
export function verifyStageManifest(saved){
 if(!saved?.instrument||!saved.camera)throw new Error('Expected an exported stage manifest with instrument and camera');
 let canonical;
 try{canonical=validatePatch(saved.instrument);}catch{throw new Error('Instrument is not a canonical patch');}
 if(!isDeepStrictEqual(canonical,saved.instrument))throw new Error('Instrument is not a canonical patch');
 if(saved.fps!==30||saved.sampleRate!==48000)throw new Error('Unsupported export timebase');
 if(!['manual','establish','follow','detail'].includes(saved.camera.mode??'manual'))throw new Error('Unknown camera mode');
 for(const key of ['position','target'])if(!Array.isArray(saved.camera[key])||saved.camera[key].length!==3||!saved.camera[key].every(Number.isFinite))throw new Error(`Invalid camera ${key}`);
 let composition;
 if(saved.composition!==undefined){
  try{composition=validateComposition(saved.composition);}catch{throw new Error('Composition is not canonical');}
  if(!isDeepStrictEqual(composition,saved.composition))throw new Error('Composition is not canonical');
 }
 const passage=attachLoomPerformance(createPerformance(saved.instrument,saved.sampleRate),composition);
 if(!Number.isFinite(saved.duration)||saved.duration<=0||saved.duration>passage.duration)throw new Error('Invalid export duration');
 const frames=createStageFrames(passage),project=frame=>frames.project(frame,saved.camera);
 const expected=createTraceManifest({...passage,duration:saved.duration},{fps:saved.fps,project});
 const mismatches=[];
 for(const field of ['v','seed','patch','fps','sampleRate','duration','frames','audioSamples','projected'])if(saved[field]!==expected[field])mismatches.push(field);
 if(saved.width!==1280||saved.height!==720)mismatches.push('dimensions');
 if(saved.videoDuration!==expected.frames/saved.fps)mismatches.push('videoDuration');
 if(saved.codecs?.video!=='avc'||saved.codecs?.audio!=='aac')mismatches.push('codecs');
 if(!Array.isArray(saved.hashes)||saved.hashes.length!==expected.hashes.length)mismatches.push('hashCount');
 const firstDifference=expected.hashes.findIndex((hash,i)=>hash!==saved.hashes?.[i]);
 if(firstDifference!==-1)mismatches.push(`frame:${firstDifference}`);
 return {valid:mismatches.length===0,frames:expected.frames,firstDifference,mismatches};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(!process.argv[2])throw new Error('Usage: node tools/verify-stage-manifest.mjs <manifest.json>');
  const result=verifyStageManifest(JSON.parse(readFileSync(process.argv[2],'utf8')));
  console.log(JSON.stringify(result));process.exitCode=result.valid?0:1;
 }catch(error){console.error(error.message);process.exitCode=1;}
}
