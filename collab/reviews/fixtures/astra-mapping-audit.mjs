import {parseSMF} from '../../../src/midi/smf.js';
import {exampleMidiBytes} from '../../../src/midi/preview.js';
import {compileImportedScore,validateMappingPlan} from '../../../src/midi/mapping.js';
import {DEFAULT_PATCH} from '../../../src/model.js';

const make=()=>({version:1,source:{name:'audit.mid',bytes:53,sha256:'0'.repeat(64)},
  notes:parseSMF(exampleMidiBytes()),plan:{version:1,window:{startSeconds:0,endSeconds:.75},lead:.35,tailSeconds:4,velocityCurve:'linear',assignments:[{track:0,channel:'all',family:'bellows',sustainPedal:false}]}});
let x=make();x.plan.velocityCurve='toString';
try{validateMappingPlan(x.plan,x.notes);console.log('INHERITED_CURVE_ACCEPTED');}catch(e){console.log('INHERITED_CURVE_REJECTED',e.message);}
x=make();x.notes.notes[0].pitch=0;
try{console.log('OUT_OF_RANGE_BELLOWS',compileImportedScore(x,DEFAULT_PATCH).report.rows[0]);}catch(e){console.log('OUT_OF_RANGE_REJECTED',e.message);}
x=make();x.notes.notes[0].velocity=1;x.plan.velocityCurve='quiet';
console.log('QUIET_VELOCITY',compileImportedScore(x,DEFAULT_PATCH).recipe.events[0].velocity,'expected',.7/127);
x=make();x.notes.notes[0].offTick=0;x.notes.notes[0].offSeconds=0;x.plan.window.endSeconds=.000001;
console.log('SUB_SAMPLE_REMAINDER',compileImportedScore(x,DEFAULT_PATCH).report.rows[0]);
x=make();x.plan.assignments=[];x.plan.window={startSeconds:.6,endSeconds:.75};
console.log('OUTSIDE_WINDOW_NO_ASSIGNMENT',compileImportedScore(x,DEFAULT_PATCH).report.counts);
