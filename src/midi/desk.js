import {element,table} from './desk-table.js';
import {mountMappingDesk} from './mapping-desk.js';
import {readMidiFile} from './read-file.js';
import {summarizeMidi, midiPitchLabel, exampleMidiBytes} from './preview.js';

const $ = id => document.getElementById(id);
let pending = null;
function clear(resetFile=true){
  pending?.abort();pending=null;$('results').hidden=true;if(resetFile)$('midi-file').value='';$('clear').disabled=true;
  for(const id of ['groups','notes','warnings','ignored','mapping'])$(id).replaceChildren();
  for(const id of ['file-name','summary','fingerprint'])$(id).textContent='';
  $('status').textContent='Choose a file to begin.';$('status').dataset.error='false';
}
async function open(file){
  clear(false);if(!file)return;
  const controller=new AbortController();pending=controller;$('clear').disabled=false;
  $('status').textContent='Reading the score…';
  try{
    const {source,notes}=await readMidiFile(file,{signal:controller.signal});
    if(pending!==controller)return;
    const overview=summarizeMidi(notes);
    $('file-name').textContent=source.name;
    $('summary').textContent=`${notes.notes.length} note${notes.notes.length===1?'':'s'} · ${notes.trackCount} track${notes.trackCount===1?'':'s'} · ${notes.durationSeconds.toFixed(3)} seconds · ${notes.ppq} ticks per quarter note · SMF ${notes.format} · ${notes.sustain.length} pedal events`;
    $('fingerprint').textContent=`${source.bytes} bytes · SHA-256 ${source.sha256}`;
    table($('groups'),['Track','Name','Channel','Notes','Pitch range','First–last key (s)'],overview.groups.map(g=>[
      g.track+1,g.name||'Untitled',g.channel+1,g.count,`${midiPitchLabel(g.low)} – ${midiPitchLabel(g.high)}`,`${g.first.toFixed(3)} – ${g.last.toFixed(3)}`]));
    table($('notes'),['Event ID','Track / channel','Pitch','Velocity','Onset (s)','Key release (s)'],notes.notes.map(n=>[
      n.noteId,`${n.track+1} / ${n.channel+1}`,midiPitchLabel(n.pitch),n.velocity,n.onSeconds.toFixed(6),n.offSeconds.toFixed(6)]));
    table($('warnings'),['Kind','Reference','Detail'],notes.warnings.map(w=>[w.kind,'noteId' in w?`Note ${w.noteId}`:`Event ${w.eventOrder}`,w.detail]));
    table($('ignored'),['Kind','Count'],overview.ignored.map(x=>[x.kind,x.count]));
    mountMappingDesk($('mapping'),{source,notes});
    $('results').hidden=false;$('status').textContent=notes.notes.length?'Score ready to inspect.':'This file contains no note-on events.';
  }catch(error){if(pending!==controller||error.name==='AbortError')return;$('status').textContent=error.message;$('status').dataset.error='true';}
  finally{if(pending===controller)pending=null;}
}
$('midi-file').onchange=event=>open(event.target.files[0]);
$('example').onclick=()=>{$('midi-file').value='';open(new File([exampleMidiBytes()],'three-note-example.mid',{type:'audio/midi'}));};
$('clear').onclick=()=>clear();
window.addEventListener('pagehide',()=>pending?.abort());
