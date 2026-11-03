import {createInverseJobs} from '../inverse/jobs.js';
import {createSketchAddressRecord,sketchAddressFragment,readSketchAddress} from './address.js';
import {varySketchDecay} from './variation.js';
import {createSketchTransport} from './transport.js';
const $=id=>document.getElementById(id);
const select=$('interpretation'),prepare=$('prepare'),start=$('start'),whole=$('whole'),shared=$('shared'),quiet=$('quiet'),motion=$('motion'),status=$('status');
const decayScale=$('decay-scale'),resetDecay=$('reset-decay'),keepAddress=$('keep-address');
const jobs=createInverseJobs({makeWorker:()=>new Worker(new URL('./prepare-worker.js',import.meta.url),{type:'module'})});
let rows=[],prepared=null,preparedRecord=null,transport=null,context=null,version=0,busy=false,orbs=[],frame=0;
motion.checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;
const say=text=>{status.textContent=text;};
function controls(){keepAddress.disabled=!preparedRecord||busy;const playable=!!transport&&context?.state==='running'&&!busy;start.disabled=!prepared||busy||playable;whole.disabled=shared.disabled=quiet.disabled=!playable;for(const button of document.querySelectorAll('[data-mode]'))button.disabled=!playable;prepare.disabled=decayScale.disabled=resetDecay.disabled=!rows.length||busy;}
function still(){for(const orb of orbs){orb.style.setProperty('--scale',1);orb.style.setProperty('--opacity',.55);}}
function draw(){frame=0;if(document.hidden)return;if(transport&&motion.checked){const state=transport.snapshot();state.modes.forEach((mode,i)=>{const level=Math.min(1,mode.envelope*state.pickupGain*4);orbs[i].style.setProperty('--scale',1+.3*level);orbs[i].style.setProperty('--opacity',.55+.45*level);});}else still();frame=requestAnimationFrame(draw);}
motion.addEventListener('change',()=>{if(!motion.checked)still();});
function stop(message){transport?.quiet();if(message)say(message);}
function activate(mode){try{const receipt=transport.activate({mode,strength:.35});say(receipt.accepted?(mode===null?'Activated the whole sketch.':`Activated mode ${mode+1}.`):'Let an earlier ring settle, then try again.');}catch(error){say(error.message);controls();}}
whole.addEventListener('click',()=>activate(null));quiet.addEventListener('click',()=>stop('Quiet. You can begin again.'));
shared.addEventListener('click',()=>{try{const receipt=transport.playSharedGesture();say(receipt.accepted?'Started the shared gesture: opening, lighter return, opening. Add your own answer whenever you like.':'Let the earlier rings settle, or choose Quiet before starting the shared gesture.');}catch(error){say(error.message);controls();}});
function draftChanged(){const scale=Number(decayScale.value);$('decay-value').textContent=scale.toFixed(2)+'× · '+(scale===1?'fitted decays':'your variation');$('selection-note').textContent='Changes are staged. Prepare when you want to replace the current sketch.';}
decayScale.addEventListener('input',draftChanged);
resetDecay.addEventListener('click',()=>{decayScale.value='1';draftChanged();});
select.addEventListener('change',()=>{decayScale.value='1';draftChanged();});
prepare.addEventListener('click',async()=>{
 const row=rows[Number(select.value)];let variation,record;
 try{record=createSketchAddressRecord(row.title,row.fit,Number(decayScale.value));variation=varySketchDecay(record.parameters,record.decayScale);}catch(error){say(error.message);return;}
 const identity=row.title+(variation.changed?` · your decay variation ${variation.scale.toFixed(2)}×`:' · fitted decays'),ticket=++version;busy=true;transport?.dispose();transport=null;prepared=null;preparedRecord=null;still();controls();$('identity').textContent='Preparing '+identity;say('Preparing silently…');
 try{const result=await jobs.run({parameters:variation.parameters,sampleRate:context?.sampleRate??48000,seconds:4});if(ticket!==version)return;prepared=result;preparedRecord=record;
  $('address-status').textContent='The prepared sketch can now be kept in its address. Later slider changes stay separate until prepared.';
  $('identity').textContent=identity;$('modes').replaceChildren();orbs=[];
  result.parameters.frequencies.forEach((frequency,i)=>{const card=document.createElement('div');card.className='mode';const orb=document.createElement('div');orb.className='orb';orb.setAttribute('aria-hidden','true');orb.style.setProperty('--tint',['#b4d5b4','#c8b6d8','#d8bd89','#9bcbd1'][i]);orbs.push(orb);const button=document.createElement('button');button.textContent=`Ring mode ${i+1}`;button.dataset.mode=i;button.addEventListener('click',()=>activate(i));const label=document.createElement('p');label.textContent=`${frequency.toFixed(2)} Hz · ${result.parameters.decays[i].toFixed(2)} s decay`;card.append(orb,button,label);$('modes').append(card);});
  $('gain').textContent=`Pickup gain ${result.pickupGain.toFixed(5)} · manual activation strength 0.35 · mono · four seconds per activation.`;
  $('selection-note').textContent='Prepared. Start listening enables the controls without playing a sound.';say('Ready. Start listening when you choose.');
 }catch(error){if(ticket===version&&error.name!=='AbortError'){say(error.message);$('identity').textContent='Preparation did not finish. Try again.';}}finally{if(ticket===version){busy=false;controls();}}
});
start.addEventListener('click',async event=>{const keyboard=event.detail===0,ticket=version;busy=true;controls();try{context??=new AudioContext({sampleRate:prepared.sampleRate});await context.resume();if(ticket!==version||document.hidden){await context.suspend();return;}transport??=createSketchTransport(context,prepared);context.onstatechange=()=>{controls();if(context.state!=='running')say('Listening is suspended. Start listening to continue.');};say('Listening is ready. Choose a mode or let them ring together.');}catch(error){say('Could not start listening: '+error.message);}finally{busy=false;controls();if(keyboard&&ticket===version&&!whole.disabled&&!document.hidden)whole.focus();}});
keepAddress.addEventListener('click',()=>{try{const url=new URL(location.href);url.hash=sketchAddressFragment(preparedRecord);history.replaceState(null,'',url);$('address-status').textContent='This address now holds the prepared sketch. Bookmark it or copy the browser address to return. Reopening is silent; Prepare and Start listening remain your choices. Its source label is declared, not authenticated.';}catch(error){$('address-status').textContent='Could not keep the address: '+error.message;}});
window.addEventListener('hashchange',()=>location.reload());
function park(){version++;jobs.cancel();busy=false;transport?.dispose();transport=null;context?.suspend().catch(()=>{});still();controls();say('Listening paused while the page is away.');}
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;park();}else if(!frame)draw();});
window.addEventListener('pagehide',park);
function appendRow(row,fromAddress=false){const option=document.createElement('option');option.value=rows.length;option.textContent=(fromAddress?'Kept address · ':'')+row.title;rows.push(row);select.append(option);}
let opened=null,addressError=null;
try{opened=readSketchAddress(location.hash);if(opened){appendRow({title:opened.label,fit:opened.parameters},true);decayScale.value=String(opened.decayScale);draftChanged();select.disabled=false;controls();$('selection-note').textContent='Sketch opened from its address. Its label is declared, not authenticated. Prepare when you choose; nothing has played.';}}catch(error){addressError=error.message;say(addressError);}
draw();
try{const response=await fetch('renders/joint-decay-study/report.json');if(!response.ok)throw Error('Local study report unavailable.');const report=await response.json();for(const row of report.rows.filter(row=>row.fit))appendRow(row);select.disabled=false;if(!opened)$('selection-note').textContent=addressError?'Address refused. You can still choose a local study interpretation.':'Choose a sketch, then prepare it silently.';controls();}catch(error){if(opened){$('address-status').textContent='Local study report unavailable; this address contains the parameters needed to prepare its sketch.';}else{say(addressError??error.message);$('selection-note').textContent='The generated local listening study or a valid kept sketch address is needed.';}}
