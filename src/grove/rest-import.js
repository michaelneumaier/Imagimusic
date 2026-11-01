import {validateGrove} from '../score/grove.js';
import {validateVoiceConfig} from '../score/grove-voice.js';
import {recipeForRecord,validateRestAdmission,renderRestRecord,REST_RECORD_KIND,REST_RECORD_VERSION,REST_MAX_STATES} from '../score/grove-rest.js';
import {REST_MAX_SECONDS,REST_MAX_EVENTS,REST_MAX_CONTACTS,REST_QUIET_FADE_SECONDS} from '../rest/limits.js';
import {REST_IMPORT_MAX_BYTES} from './read-rest-file.js';
import {createRestReplayPicture} from './rest-replay-picture.js';

/** Bound work before constructing the contact-state matrix bank or allocating PCM.
 * These are reader limits, not changes to the saved record or model schema.
 * The 25 ms fade limit deliberately matches live Quiet (including automatic Quiet),
 * stricter than the general record validator’s one-second fade allowance. */
export function parseRestImport(text){
 if(typeof text!=='string'||text.length>REST_IMPORT_MAX_BYTES||new TextEncoder().encode(text).byteLength>REST_IMPORT_MAX_BYTES)throw new Error('Choose a gesture JSON file no larger than 256 KiB.');
 let record;try{record=JSON.parse(text);}catch{throw new Error('This file is not valid gesture JSON.');}
 if(record?.kind!==REST_RECORD_KIND||record?.version!==REST_RECORD_VERSION)throw new Error('Choose a Rest version 2 gesture file.');
 const sr=record.sampleRate;
 if(!Number.isInteger(sr)||sr<8000||sr>96000)throw new Error('This reader supports sample rates from 8000 to 96000 Hz.');
 const end=record.ended;
 if(!end||!Number.isSafeInteger(end.frame)||end.frame<0||end.frame>REST_MAX_SECONDS*sr||!Number.isSafeInteger(end.fadeFrames)||end.fadeFrames<1||end.fadeFrames>Math.ceil(REST_QUIET_FADE_SECONDS*sr))throw new Error('Open a finished passage of at most two minutes with its short Quiet fade.');
 if(!Array.isArray(record.events)||!record.events.length||record.events.length>REST_MAX_EVENTS||!Array.isArray(record.contacts)||record.contacts.length>REST_MAX_CONTACTS)throw new Error('The passage must contain 1–128 strikes and at most 256 contacts.');
 validateGrove(record.grove);validateVoiceConfig(record.voice);
 if(!Array.isArray(record.zones)||!record.zones.length||record.zones.length>7||record.zones.some(u=>!Number.isFinite(u)||u<0||u>1))throw new Error('Invalid contact positions.');
 if(!Array.isArray(record.strengths)||!record.strengths.length||record.strengths.length>7||(1+record.zones.length*record.strengths.length)**record.grove.bodies.length>REST_MAX_STATES)throw new Error('The contact configuration is too large to reopen.');
 if(record.strengths.some(s=>typeof s!=='string'&&(!s||typeof s.name!=='string'||!Number.isFinite(s.c)||s.c<=0)))throw new Error('Invalid contact strengths.');
 return record;
}

/** Rebuild exactly, without changing gain, timing, gestures, or instrument. Run in a worker. */
export function prepareRestImport(text,{fps=60}={}){
 const record=parseRestImport(text),recipe=recipeForRecord(record);
 validateRestAdmission(record,recipe);
 return {record,pcm:renderRestRecord(record,recipe),picture:createRestReplayPicture(record,recipe,{fps})};
}
