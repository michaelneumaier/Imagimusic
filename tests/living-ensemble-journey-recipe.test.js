import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnsembleJourneyRecipe,readEnsembleJourneyRecipe} from '../src/living/ensemble-journey-recipe.js';
const gesture=()=>[{frame:0,strength:.025},{frame:10000,strength:.1},{frame:144000,strength:.05}];
test('recipe round trip keeps the bounded personal gesture and exact sound fingerprint',()=>{
 const input=gesture(),recipe=createEnsembleJourneyRecipe(input,'f'.repeat(64));assert.deepEqual(readEnsembleJourneyRecipe(JSON.stringify(recipe)),recipe);input[0].strength=.1;assert.equal(recipe.gesture[0].strength,.025);
});
test('recipe refuses extra fields, unsupported versions, ambiguous timing and oversized text',()=>{
 const base=createEnsembleJourneyRecipe(gesture(),'f'.repeat(64));
 for(const value of [{...base,extra:true},{...base,version:2},{...base,sampleRate:44100},{...base,gesture:null},{...base,wavSha256:'unknown'},{...base,gesture:[...gesture(),gesture()[0]]},{...base,gesture:gesture().reverse()}])assert.throws(()=>readEnsembleJourneyRecipe(JSON.stringify(value)));
 for(const text of ['not json','null','[]',' '.repeat(4097),'🌱'.repeat(1025)])assert.throws(()=>readEnsembleJourneyRecipe(text));
});
