import fs from 'node:fs/promises';
import {recipeForRecord,bridgeEnergyExchange,restRecordLength} from '../src/score/grove-rest.js';
import {voiceSystem} from '../src/score/grove-voice.js';
import {createRestEngine,contactStateKey} from '../src/rest/engine.js';
const input=process.argv[2];if(!input)throw new Error('Usage: node tools/audit-bridge-work.mjs <Rest-record.json> [report.json]');
const record=JSON.parse(await fs.readFile(input,'utf8')),recipe=recipeForRecord(record),measured=bridgeEnergyExchange(record,recipe);
const {system,family}=voiceSystem(recipe.grove,recipe.voice),n=system.n,engine=createRestEngine(recipe),sr=recipe.sampleRate;
const bridges=recipe.grove.bridges.map(b=>({...b,k:b.coupling*recipe.grove.bodies[b.a].mass*(2*Math.PI*recipe.grove.bodies[b.a].hz)**2/family.attachFundamental**2}));
function endpoint(state,body){const weights=system.snapshot[body].shape(recipe.voice.attachU),offset=system.offsets[body],mass=Math.sqrt(recipe.grove.bodies[body].mass);let x=0,v=0;for(let j=0;j<weights.length;j++){x+=weights[j]*state[offset+j]/mass;v+=weights[j]*state[n+offset+j]/mass;}return {x,v};}
function powers(state){return bridges.map(b=>{const a=endpoint(state,b.a),z=endpoint(state,b.b),d=a.x-z.x,F=b.k*d;return {a:-F*a.v,b:F*z.v,stored:.5*b.k*d*d};});}
const totals=bridges.map(()=>({workOnA:0,workOnB:0,activity:0})),events=new Map();for(const event of record.events){if(!events.has(event.frame))events.set(event.frame,[]);events.get(event.frame).push(event);}
const frames=restRecordLength(record,recipe);
// Match the measurement's declared final sampled instant. Each interval ends
// before the next impulse; the next interval starts after that impulse.
for(let i=0;i<frames-1;i++){
 for(const event of events.get(i)??[])engine.strike(event.position,event.body,event.velocity);
 engine.setContacts(contactStateKey(Array.from({length:recipe.bodies},(_,body)=>{const c=record.contacts.find(c=>c.body===body&&c.start<=i&&i<c.end);return c?{zone:c.zone,strength:c.strength}:null;})));
 const left=powers(engine.state);engine.step();const right=powers(engine.state);
 for(let j=0;j<bridges.length;j++){const t=totals[j],a=left[j],b=right[j];t.workOnA+=(a.a+b.a)/(2*sr);t.workOnB+=(a.b+b.b)/(2*sr);t.activity+=(Math.abs(a.a)+Math.abs(b.a)+Math.abs(a.b)+Math.abs(b.b))/(2*sr);}
}
const final=powers(engine.state);
const report={input,sampleRate:sr,frames,convention:'Post-event left endpoint to pre-event right endpoint on each continuous interval; final time=(frames-1)/sampleRate. This audits quadrature, not acoustics or listener response.',bridges:bridges.map((b,i)=>{const t=totals[i],m=measured.bridges[i];return {a:b.a,b:b.b,reference:t,production:{workOnA:m.workOnA,workOnB:m.workOnB,activity:m.activity},productionMinusReference:{workOnA:m.workOnA-t.workOnA,workOnB:m.workOnB-t.workOnB,activity:m.activity-t.activity},referenceStorageResidual:-(t.workOnA+t.workOnB)-final[i].stored,productionStorageResidual:m.storageChange-m.finalStoredEnergy};})};
if(process.argv[3])await fs.writeFile(process.argv[3],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
