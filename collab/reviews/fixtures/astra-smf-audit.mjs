import {parseSMF,validateNoteList} from '../../../src/midi/smf.js';
const u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
const chunk=(s,a)=>[...s].map(x=>x.charCodeAt()).concat(u32(a.length),a);
const smf=a=>Uint8Array.from([...chunk('MThd',[0,0,0,1,0,96]),...chunk('MTrk',a)]);
const eot=[0,255,47,0];
const many=[0,192,1];for(let i=1;i<65537;i++)many.push(0,1);many.push(...eot);
try{const x=parseSMF(smf(many));console.log('EVENT_LIMIT_ACCEPTED',x.ignored.programChange);}catch(e){console.log('EVENT_LIMIT_REJECTED',e.message);}
const ticks=[];for(let i=0;i<65;i++)ticks.push(255,255,255,127,192,1);ticks.push(...eot);
const long=parseSMF(smf(ticks));try{validateNoteList(long);console.log('PARSE_VALIDATES',long.endTick);}catch(e){console.log('PARSER_OUTPUT_REJECTED',long.endTick,e.message);}
const base=parseSMF(smf([0,176,64,127,0,144,60,100,96,128,60,0,...eot]));
for(const [name,mutate] of [
 ['sustain eventOrder NaN',x=>x.sustain[0].eventOrder=NaN],
 ['off before on eventOrder',x=>x.notes[0].offEventOrder=0],
 ['ignored negative and unknown keys',x=>{x.ignored.programChange=-1;x.ignored.extra='bad';}],
 ['warnings malformed',x=>x.warnings.push({kind:'invented',noteId:Infinity,detail:{}})],
 ['tracks channels duplicates',x=>x.tracks[0].channels=[0,0]],
]){const x=structuredClone(base);mutate(x);try{validateNoteList(x);console.log('TAMPER_ACCEPTED',name);}catch(e){console.log('TAMPER_REJECTED',name,e.message);}}
