import {canonicalScore,compileScoreEvents} from '../score/conversation.js';
import {createAuthoredPerformance} from './authored-performance.js';
import {DEFAULT_COMPOSITION} from './composition.js';

/** Copy validated authoring data before compiling; score seed and tempo are authoritative. */
export function createScorePerformance(patch,score,composition=DEFAULT_COMPOSITION,sampleRate=48000){
 const saved=JSON.parse(canonicalScore(score));
 const {events,loomScore,fmTime,holdUntil}=compileScoreEvents(saved);
 if(composition.loom?.enabled&&!loomScore.length)throw new Error('This score has no Loom strikes; disable Loom or choose another score');
 const passage=createAuthoredPerformance({...patch,tempo:saved.tempo,seed:saved.seed},{events,loomScore,fmTime,holdUntil},composition,sampleRate);
 return {...passage,score:saved};
}

export function readScoreSearch(search){
 const value=new URLSearchParams(search).get('score');
 if(value===null)return null;
 try{return JSON.parse(canonicalScore(JSON.parse(value)));}
 catch(error){throw new Error('Invalid score in this link: '+error.message);}
}

export function scoreURL(base,score){
 const url=new URL(base);
 if(score===null)url.searchParams.delete('score');
 else url.searchParams.set('score',canonicalScore(score));
 return url.href;
}
