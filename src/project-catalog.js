import {renderNotebook} from './project-notebook.js';
const entries=[
 ['Start here','welcome.html','Encounters','Playable','Three gentle doors into the project: listen, play, and rest a hand.'],
 ['Listen','listen.html','Encounters','Playable','Follow a sound between connected bodies in a short guided encounter.'],
 ['The Grove','grove.html','Encounters','Playable','Strike a body in a coupled instrument and watch its modeled response.'],
 ['Rest','rest.html','Encounters','Playable','Strike, damp, and release. Keep a passage as gestures, sound, or a film.'],
 ['Leave room','pulse.html','Experiments','Prototype','An authored opening leaves the instrument ringing for your own answer.'],
 ['Three Groves — experimental','ensemble.html','Experiments','Prototype','Play three voices. “Meet another family” offers three generated anatomies for a fresh passage. “Look closer” reveals three numbered bodies to play within one Grove; all three instruments remain audible. “Begin with a memory” lets a short passage open a new response. Keep performances or make a return through other voices. Device output and performance remain unevaluated.'],
 ['A sound, several bodies','inverse.html','Experiments','Prototype','Inverse workshop: search chain and triangle anatomies for three declared resonances and a common decay, then prepare and touch each candidate. Fixed spatial body and connection views, with numbered strike controls. Shows fit errors and near misses. Three-mass physical model with virtual pickups; no audio upload, unique-body recovery or full sound matching.'],
 ['A powered encounter','powered.html','Experiments','Prototype','Supply a bounded source, rest a hand, and observe the release. Optional traces reveal the model’s response.'],
 ['A gesture, another answer','adapt.html','Experiments','Prototype','Use saved gestures or a prepared example to change connection strengths, compare, and play either structure.'],
 ['Resonator garden','index.html','Instruments','Playable','The original laboratory: instrument controls, a physical tine, and interpreted synthesizer mechanisms.'],
 ['Tension Loom','loom.html','Instruments','Playable','Explore coupled resonators and the physical parameters behind their response.'],
 ['FM tensioner','tensioner.html','Instruments','Playable','A visible tension mechanism interprets frequency modulation.'],
 ['Touch. Listen. Answer.','touch.html','Encounters','Playable','An earlier touch-led study of musical gestures and response.'],
 ['Expressive voices','expressive.html','Instruments','Playable','Follow a changing chord. “Look closer” holds one selected voice while all remain audible; inspect its iris, bellows and pitch lever. These bodies interpret a synthesizer. Optionally bring a local MIDI 2.0 Clip within the importer’s stated limits; general DAW compatibility is unverified.'],
 ['Grove voices','grove-voices.html','Instruments','Study','Inspect the voice configurations behind the Grove.'],
 ['The Conservatory','stage.html','Composition & keeping','Playable','A shared score, mechanical performers, causal inspection, and local performance rendering.'],
 ['Bring a score','midi.html','Composition & keeping','In progress','Map a local MIDI file to available instruments and inspect the mapping.'],
 ['Reopen a passage','reopen.html','Composition & keeping','Tool','Return to supported saved Grove and Rest records. Ensemble records are not supported here yet.'],
 ['Return to three voices','ensemble-reopen.html','Composition & keeping','Tool','Rebuild a saved three-Grove ensemble, labelled derived return or continued passage. Local files up to two minutes plus their fade, at 8–48 kHz and up to 256 KiB; explicit playback and sound download.'],
 ['Listening room','audition.html','Listening studies','Study','Compare prepared examples from the earlier instrument work.'],
 ['A changed structure','variant-audition.html','Listening studies','Study','Compare the same gesture on a fixed one-connection variant at equal output gain.'],
 ['Repeated adaptation','adaptation-audition.html','Listening studies','Study','Explore the bounded adaptation comparison and its declared conditions.'],
 ['Room for an answer','renders/open-phrase-study/index.html','Listening studies','Rendered study','The same opening with a neighboring answer at three different delays. Optional private listening notes.'],
 ['One more return','renders/open-phrase-recurrence/index.html','Listening studies','Rendered study','Compare one and two cycles of the opening, alone and with the same delayed answer.'],
 ['What does expression add?','renders/expressive-compare/index.html','Listening studies','Rendered study','The same notes and saved synthesizer patch, with and without ongoing expression changes. Two authored offline examples share a listening level; pressure, per-note controls and pitch bends differ.'],
 ['The same touch, three families','renders/ensemble-family-study/index.html','Listening studies','Rendered study','One identical strike on C across three generated families. Authored offline examples preserve the page’s mix and each family’s relative level; tuning, mass, connections and loss change together.'],
 ['One Grove, three bodies','renders/ensemble-body-study/index.html','Listening studies','Rendered study','Compare the same strike on each connected body of C, then on two bodies together. Four authored offline examples preserve the instrument page’s mix and relative levels.'],
 ['A memory, then an answer','renders/ensemble-continuation-study/index.html','Listening studies','Rendered study','Compare an authored passage with its remembered opening and an authored G response. Same instruments and playable gestures; original and continued examples are rendered offline.'],
 ['A passage returns','renders/ensemble-return-study/index.html','Listening studies','Rendered study','An authored passage and its derived return: identical gesture timing carried by different voices, with a shared listening level.'],
 ['Three Groves','renders/harmonic-groves/index.html','Listening studies','Rendered study','Three intact instruments: a shared pitch center versus C–E♭–G, with matched gestures and a fixed mix.']
];
const studyAvailability=new Map();
function updateStudyLinks(){
 for(const link of document.querySelectorAll('a[href^="renders/"],a[data-study-url]')){
  const url=link.dataset.studyUrl??link.getAttribute('href');
  if(!studyAvailability.has(url))continue;
  if(!link.dataset.studyUrl){link.dataset.studyUrl=url;link.dataset.originalLabel=link.textContent;}
  if(studyAvailability.get(url)){
   link.href=url;link.textContent=link.dataset.originalLabel;link.removeAttribute('aria-disabled');link.classList.remove('unavailable');
  }else{
   link.removeAttribute('href');link.textContent=link.dataset.originalLabel.replace(' ↗','')+' · not prepared in this local copy';link.setAttribute('aria-disabled','true');link.classList.add('unavailable');
  }
 }
}
const catalog=document.getElementById('catalog'),search=document.getElementById('search'),category=document.getElementById('category'),count=document.getElementById('count');
function element(tag,text,className){const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;}
function render(){
 const query=search.value.trim().toLocaleLowerCase(),shown=entries.filter(e=>(category.value==='all'||e[2]===category.value)&&e.join(' ').toLocaleLowerCase().includes(query));
 catalog.replaceChildren();
 for(const [title,url,group,status,description] of shown){const card=element('article',null,'card'),top=element('div',null,'card-top');top.append(element('span',group),element('span',status,'tag'+(/Study|study|Prototype/.test(status)?' study':'')));card.append(top,element('h3',title),element('p',description));const link=element('a','Open '+title+' ↗');link.href=url;card.append(link);catalog.append(card);}
 if(!shown.length)catalog.append(element('p','No matching studies. Try another word or choose Everything.','empty'));
 count.textContent=shown.length+' of '+entries.length+' entries · local working collection';
 updateStudyLinks();
}
search.addEventListener('input',render);category.addEventListener('change',render);render();
const notebook=document.getElementById('notebook'),title=document.getElementById('document-title'),status=document.getElementById('document-status'),source=document.getElementById('document-source'),text=document.getElementById('document-text');
const reading=document.getElementById('document-reading'),raw=document.getElementById('document-raw');
let revision=0,request;
document.getElementById('close-doc').onclick=()=>notebook.close();
notebook.addEventListener('close',()=>{revision++;request?.abort();});
for(const button of document.querySelectorAll('[data-doc]'))button.addEventListener('click',async()=>{
 const own=++revision;request?.abort();request=new AbortController();title.textContent=button.childNodes[0].textContent.replace('↗','').trim();source.href=button.dataset.doc;text.textContent='';reading.replaceChildren();raw.open=false;status.textContent='Loading the source notebook…';notebook.showModal();
 try{const response=await fetch(button.dataset.doc,{signal:request.signal});if(!response.ok)throw new Error('This document is unavailable ('+response.status+').');const body=await response.text();if(own!==revision)return;text.textContent=body;renderNotebook(reading,body);status.textContent='Reading layout · Exact source below. Historical notes may describe earlier versions.';}
 catch(error){if(own===revision&&error.name!=='AbortError')status.textContent=error.message+' Use the source link or try again.';}
});

// Only generated pages are optional in a fresh checkout. No audio is loaded.
for(const [,url] of entries.filter(e=>e[1].startsWith('renders/'))){
 fetch(url,{method:'HEAD',cache:'no-store'}).then(response=>response.status===405?fetch(url,{cache:'no-store'}):response).then(response=>studyAvailability.set(url,response.ok),()=>studyAvailability.set(url,false)).then(updateStudyLinks);
}
