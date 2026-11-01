import {saveMidiStage} from './stage-transfer.js';
import {compileImportedScore} from './mapping.js';
import {summarizeMidi} from './preview.js';
import {DEFAULT_PATCH} from '../model.js';
import {element,table} from './desk-table.js';

const families=[['','Unassigned'],['bellows','Bellows — pitch and gate'],['garden','Resonator garden — fixed pitches'],['tine','Physical tine — rhythm only'],['loom','Tension Loom — rhythm on two bodies'],['fm','FM tensioner — one entrance'],['none','Omit these notes']];
function select(choices){const node=element('select');for(const [value,label] of choices){const option=element('option',label);option.value=value;node.append(option);}return node;}
function label(text,control){const node=element('label',text);node.append(control);return node;}
function number(value,min,max){const node=element('input');node.type='number';node.required=true;node.step='any';node.min=min;node.max=max;node.value=value;return node;}
function destination(row){
 if(!row.to)return '—';
 if(row.to.body!==undefined)return `Body ${row.to.body+1}`;
 if(row.to.slot!==undefined)return `Resonator ${row.to.slot+1} · ${row.to.hz.toFixed(2)} Hz`;
 if(row.to.hz!==undefined)return `${row.to.hz.toFixed(2)} Hz${row.to.gateSeconds!==undefined?` · ${row.to.gateSeconds.toFixed(6)} s gate`:''}`;
 return row.to.note??'—';
}

/** Preview the real compiler at the default patch/48 kHz. Edits invalidate the
 * displayed report; drafts never persist or start audio. */
export function mountMappingDesk(host,intake){
 host.replaceChildren(element('h2','Choose instruments'));
 if(!intake.notes.notes.length||intake.notes.durationSeconds<=0){host.append(element('p','This file has no positive-duration passage to map.'));return;}
 const groups=summarizeMidi(intake.notes).groups,assignments=new Map();
 host.append(element('p','Assign each channel, choose an excerpt, then preview every note’s destination. This preview uses the default laboratory instrument at 48 kHz. Use the reviewed mapping on the stage to play or render it. Loom and FM are enabled when assigned. The mechanisms interpret the notes; this does not reconstruct the original instruments.'));
 const form=element('form'),controls=element('div');controls.className='mapping-controls';
 const start=number(0,0,intake.notes.durationSeconds),end=number(Math.min(intake.notes.durationSeconds,119.65),0,intake.notes.durationSeconds);
 const lead=number(.35,0,5),tail=number(4,0,30),curve=select([['linear','Original dynamics'],['quiet','Quieter (70%)'],['lift','Lift softer notes']]);
 controls.append(label('Excerpt start (seconds)',start),label('Excerpt end (seconds)',end),label('Approach time (seconds)',lead),label('Ending hold (seconds)',tail),label('Dynamics',curve));
 const windowNote=element('p',intake.notes.durationSeconds>119.65?'The initial excerpt is limited to 119.65 seconds. Adjust the start and end to choose another passage.':'The initial excerpt covers the whole file.');
 const channel=select(groups.map((g,i)=>[String(i),`Track ${g.track+1} / channel ${g.channel+1} · ${g.name||'Untitled'} · ${g.count} notes`]));
 const family=select(families),choices=element('div');choices.className='mapping-controls';
 const garden=select([['','Choose a pitch policy'],['drop','Omit unavailable pitches'],['nearest','Use nearest resonator pitch']]);
 const pedal=element('input');pedal.type='checkbox';
 const loom=select([['','Choose a body rule'],['parity','Even pitches → body 1; odd → body 2'],['pitches','Choose two source pitches']]);
 const body0=number(60,0,127),body1=number(62,0,127);body0.step=body1.step='1';
 const gardenLabel=label('Unavailable garden pitches',garden),pedalLabel=label('Honor sustain pedal',pedal),loomLabel=label('Loom body assignment',loom);
 const body0Label=label('Source pitch for body 1 (MIDI)',body0),body1Label=label('Source pitch for body 2 (MIDI)',body1);
 choices.append(gardenLabel,pedalLabel,loomLabel,body0Label,body1Label);
 const assignmentSummary=element('p'),reportHost=element('div'),status=element('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const preview=element('button','Preview mapping');preview.type='submit';preview.className='primary';
 form.append(controls,windowNote,label('Channel to configure',channel),label('Instrument',family),choices,assignmentSummary,preview,status);
 host.append(form,reportHost);
 function invalidate(){reportHost.replaceChildren();status.textContent='Choices changed. Preview again to see the result.';status.dataset.error='false';}
 function visibility(){
  gardenLabel.hidden=family.value!=='garden';pedalLabel.hidden=family.value!=='bellows';loomLabel.hidden=family.value!=='loom';
  const pitches=family.value==='loom'&&loom.value==='pitches';body0Label.hidden=body1Label.hidden=!pitches;
  garden.disabled=family.value!=='garden';loom.disabled=family.value!=='loom';body0.disabled=body1.disabled=!pitches;
 }
 function save(){
  const g=groups[Number(channel.value)],a={track:g.track,channel:g.channel,family:family.value};
  if(a.family==='garden')a.gardenUnplayable=garden.value;
  if(a.family==='bellows')a.sustainPedal=pedal.checked;
  if(a.family==='loom')a.loomBody=loom.value==='pitches'?{rule:'pitches',body0:body0.valueAsNumber,body1:body1.valueAsNumber}:{rule:loom.value};
  if(a.family)assignments.set(channel.value,a);else assignments.delete(channel.value);
  assignmentSummary.textContent=`${assignments.size} of ${groups.length} note-bearing channels have an instrument choice. Unassigned notes within the excerpt must be resolved before playback.`;
  visibility();invalidate();
 }
 function restore(){
  const a=assignments.get(channel.value);family.value=a?.family??'';garden.value=a?.gardenUnplayable??'';pedal.checked=a?.sustainPedal??false;
  loom.value=a?.loomBody?.rule??'';body0.value=a?.loomBody?.body0??60;body1.value=a?.loomBody?.body1??62;visibility();
 }
 for(const control of [family,garden,pedal,loom,body0,body1])control.addEventListener('input',save);
 channel.onchange=restore;
 for(const control of [start,end,lead,tail,curve])control.addEventListener('input',invalidate);
 form.onsubmit=event=>{
  event.preventDefault();reportHost.replaceChildren();if(!form.reportValidity())return;
  const imported={version:1,...intake,plan:{version:1,window:{startSeconds:start.valueAsNumber,endSeconds:end.valueAsNumber},lead:lead.valueAsNumber,tailSeconds:tail.valueAsNumber,velocityCurve:curve.value,assignments:[...assignments.values()]}};
  try{
   const {report}=compileImportedScore(imported,DEFAULT_PATCH,48000);
   status.dataset.error='false';status.textContent=report.counts.unassigned?`${report.counts.unassigned} notes in this excerpt still need an instrument choice.`:`Mapping preview ready · ${report.onsets} scheduled entrances.`;
   reportHost.append(element('p',Object.entries(report.counts).map(([kind,n])=>`${kind}: ${n}`).join(' · ')),element('p',`Unplanned mechanical strikes: garden ${report.planner.garden.unplanned}, tine ${report.planner.tine.unplanned}. These notes still sound with their original mallets.`));
   const rows=element('div'),warnings=element('div');reportHost.append(rows,element('h3','Mapping notes'),warnings);
   table(rows,['Event','Track / channel','Source pitch','Instrument','Result','Destination','Pitch change','Reason'],report.rows.map(r=>[r.noteId,`${r.track+1} / ${r.channel+1}`,r.pitch,r.family??'Unassigned',r.class,destination(r),r.cents===null?'—':`${r.cents} cents`,r.reason??'—']));
   table(warnings,['Kind','Detail'],report.warnings.map(w=>[w.kind,w.detail]));
   const use=element('button','Use this mapping on stage');use.type='button';use.className='primary';use.disabled=!!report.counts.unassigned||!report.onsets;
   use.onclick=()=>{try{const id=saveMidiStage(sessionStorage,imported);location.href=`stage.html?midi=${encodeURIComponent(id)}`;}catch(error){status.dataset.error='true';status.textContent=error.message;}};
   reportHost.append(use,element('p','The passage stays in this browser session. Reopen the file from the MIDI desk to share or restore it in another session.'));
  }catch(error){status.dataset.error='true';status.textContent=error.message;}
 };
 restore();assignmentSummary.textContent=`All ${groups.length} note-bearing channels start unassigned.`;
}
