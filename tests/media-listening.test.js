import test from 'node:test';
import assert from 'node:assert/strict';
import {createMediaListening} from '../src/grove/media-listening.js';
function setup(){
 const calls=[],stages=[],audio={src:'first.wav',play(){calls.push(['play',this.src]);return Promise.resolve();},pause(){calls.push(['pause']);}};
 const source={connect(input){calls.push(['source',input]);},disconnect(){calls.push(['disconnect']);}};
 const context={destination:{},createMediaElementSource(element){assert.equal(element,audio);calls.push(['attach']);return source;},resume(){calls.push(['resume']);return Promise.resolve();},close(){calls.push(['close']);}};
 const createContext=()=>{calls.push(['context']);return context;};
 const createStage=(_context,{db})=>{assert.equal(_context,context);const stage={input:{},output:{connect(destination){assert.equal(destination,context.destination);}},levels:[db],setDb(db){this.levels.push(db);},dispose(){this.disposed=true;}};stages.push(stage);return stage;};
 return {calls,stages,audio,context,source,createContext,createStage};
}
test('first explicit play creates one graph; changed examples and level reuse it',async()=>{
 const f=setup(),player=createMediaListening(f.audio,f);player.setListeningDb(20);assert.deepEqual(f.calls,[]);
 await player.play();f.audio.src='second.wav';player.setListeningDb(12);await player.play();
 assert.equal(f.calls.filter(c=>c[0]==='attach').length,1);assert.equal(f.stages.length,1);assert.deepEqual(f.stages[0].levels,[20,12]);
 assert.deepEqual(f.calls.filter(c=>c[0]==='play'),[['play','first.wav'],['play','second.wav']]);
 player.dispose();player.dispose();assert.equal(f.stages[0].disposed,true);assert.equal(f.calls.filter(c=>c[0]==='close').length,1);await assert.rejects(player.play(),/closed/);
});
test('failed downstream connection disposes the stage and retries without attaching the media twice',async()=>{
 const f=setup(),base=f.createStage;let fail=true;f.createStage=(...args)=>{const stage=base(...args);stage.output.connect=()=>{if(fail)throw Error('graph failure');};return stage;};
 const player=createMediaListening(f.audio,f);await assert.rejects(player.play(),/graph failure/);assert.equal(f.stages[0].disposed,true);assert.equal(f.calls.filter(c=>c[0]==='play').length,0);
 fail=false;await player.play();assert.equal(f.calls.filter(c=>c[0]==='attach').length,1);assert.equal(f.stages.length,2);player.dispose();
});
test('pause during pending context resume cannot cause a later play call',async()=>{
 const f=setup();let resolve;f.context.resume=()=>new Promise(r=>resolve=r);
 const player=createMediaListening(f.audio,f),pending=player.play();player.pause();resolve();await pending;
 assert.deepEqual(f.calls.filter(c=>['play','pause'].includes(c[0])),[['play','first.wav'],['pause']]);player.dispose();
});
