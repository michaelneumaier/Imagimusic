import {readFileSync} from 'node:fs';import {resolve} from 'node:path';import assert from 'node:assert/strict';
import {createLivingMoviePlan,validateLivingMovieAudio} from '../src/living/movie-plan.js';
import {renderLivingArrangement} from '../src/living/arrangement.js';
import {groveMovieAudioEvidence} from '../src/grove/movie-audio.js';
const directory=resolve(process.argv[2]??'renders/living-movie-source'),saved=JSON.parse(readFileSync(resolve(directory,'movie-source.json'),'utf8')),record=JSON.parse(readFileSync(resolve(directory,'encounter.json'),'utf8'));
const plan=createLivingMoviePlan(record);for(const [key,value] of Object.entries(plan.manifest))assert.deepEqual(saved[key],value,'Manifest mismatch: '+key);
const pcm=renderLivingArrangement(record.source);validateLivingMovieAudio(pcm,saved);const evidence=await groveMovieAudioEvidence(pcm,'source.wav');
assert.deepEqual(saved.audio,evidence.audio,'Audio fingerprints differ');assert.deepEqual(readFileSync(resolve(directory,'source.wav')),Buffer.from(evidence.wav),'Saved WAV differs from reconstruction');
console.log(JSON.stringify({verified:true,frames:plan.times.length,sourceSamples:pcm.frames,scope:'Recipe, frame-state hashes, exact source PCM fingerprints and WAV bytes. No encoded movie or pixel verification.'},null,2));
