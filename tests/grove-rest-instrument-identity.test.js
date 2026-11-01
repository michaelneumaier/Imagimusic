import test from 'node:test';
import assert from 'node:assert/strict';
import {composeGrove} from '../src/score/grove.js';
import {DEFAULT_VOICE_CONFIG} from '../src/score/grove-voice.js';
import {restInstrumentIdentity} from '../src/grove/rest-instrument-identity.js';
test('seed alone never authorizes a link to a different curated instrument',()=>{
 const record={grove:composeGrove({seed:3}),voice:DEFAULT_VOICE_CONFIG};
 assert.equal(restInstrumentIdentity(record).canOpenCurated,true);
 const changed=structuredClone(record);changed.grove.bridges[0].coupling*=1.2;
 assert.equal(restInstrumentIdentity(changed).canOpenCurated,false);
 assert.match(restInstrumentIdentity(changed).label,/CHANGED STRUCTURE/);
 const voice=structuredClone(record);voice.voice.partials=1;
 assert.equal(restInstrumentIdentity(voice).canOpenCurated,false);
 assert.equal(restInstrumentIdentity({...record,grove:composeGrove({seed:5})}).canOpenCurated,false);
});
