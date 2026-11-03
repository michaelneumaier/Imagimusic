import {renderNotebook} from './project-notebook.js';
const entries=[
 ['Start here','welcome.html','Encounters','Playable','Three gentle doors into the project: listen, play, and rest a hand.'],
 ['Listen','listen.html','Encounters','Playable','Follow a sound between connected bodies in a short guided encounter.'],
 ['The Grove','grove.html','Encounters','Playable','One instrument with three connected bodies. Strike one and watch the others respond. Choose its original voice or explore a voice with higher partials.'],
 ['Rest','rest.html','Encounters','Playable','Strike, damp, and release. Keep a passage as gestures, sound, or a film.'],
 ['Leave room','pulse.html','Experiments','Prototype','An authored opening leaves the instrument ringing for your own answer.'],
 ['Three Groves — experimental','ensemble.html','Experiments','Prototype','Play three separate Grove instruments together; each has three internally connected bodies. “Meet another family” offers three generated anatomies for a fresh passage. “Look closer” reveals three numbered bodies to play within one Grove; all three instruments remain audible. “Begin with a memory” lets a short passage open a new response. Keep performances or make a return through other voices. Device output and performance remain unevaluated.'],
 ['A sound, several bodies','inverse.html','Experiments','Prototype','Inverse workshop: find playable bodies for three resonances. Carry a shared gesture or your own brief phrase between anatomies, search again, and return to your phrase’s original body. Keep a phrase with its original anatomy for another visit. Bounded three-mass model; another search may repeat an anatomy. Matches declared resonances and decay, not a whole sound or a unique acoustic object.'],
 ['A sound to begin with','inverse-sound.html','Experiments','Study','Inspect a short local WAV as separate channel waveforms, with sample details and exact-file identity. Opening is silent; listen explicitly to an attenuated copy, up to eight seconds. This first sound-input study does not yet estimate resonances or suggest an instrument.'],
 ['A powered encounter','powered.html','Experiments','Prototype','Supply a bounded source, rest a hand, and observe the release. Optional traces reveal the model’s response.'],
 ['A gesture, another answer','adapt.html','Experiments','Prototype','Use saved gestures or a prepared example to change connection strengths, compare, and play either structure.'],
 ['Resonator garden','index.html','Instruments','Playable','The original laboratory: instrument controls, a physical tine, and interpreted synthesizer mechanisms.'],
 ['Tension Loom','loom.html','Instruments','Playable','Tune frequency, coupling, detuning and loss in a two-body model. Keep the design in its address, or carry its settings into Touch to play and keep your own passage.'],
 ['FM tensioner','tensioner.html','Instruments','Playable','A visible tension mechanism interprets frequency modulation.'],
 ['Touch. Listen. Answer.','touch.html','Encounters','Playable','Play two bodies with gestures that join the sound already ringing. Name and keep a passage, return to it, choose a still picture, or play a custom connection designed in the Loom.'],
 ['Expressive voices','expressive.html','Instruments','Playable','Follow a changing chord. “Look closer” holds one selected voice while all remain audible; inspect its iris, bellows and pitch lever. These bodies interpret a synthesizer. Optionally bring a local MIDI 2.0 Clip within the importer’s stated limits; general DAW compatibility is unverified.'],
 ['Grove voices','grove-voices.html','Instruments','Study','Compare prepared recordings of The Grove’s original voice and its voice with higher partials, then enter the instrument to play either. A listening study, with reported levels rather than perceptual loudness matching.'],
 ['The Conservatory','stage.html','Composition & keeping','Playable','A shared score, mechanical performers, causal inspection, and local performance rendering.'],
 ['Bring a score','midi.html','Composition & keeping','In progress','Map a local MIDI file to available instruments and inspect the mapping.'],
 ['Reopen a passage','reopen.html','Composition & keeping','Tool','Return to supported saved Grove and Rest records. Ensemble records are not supported here yet.'],
 ['Return to a touch','touch-return.html','Composition & keeping','Tool','Reopen saved Touch gestures in their original two-body connection, then compare the same gestures in another named connection. Prepare silently, return to the original, or keep either sound as WAV. Named files retain their labels; comparisons get distinct filenames. Begin a fresh performance on the saved instrument, including custom settings. Changed settings and pickup scaling are shown. Local Touch v1 files; bounded reconstruction, no conversion from Rest or Grove recordings.'],
 ['Return to three voices','ensemble-reopen.html','Composition & keeping','Tool','Rebuild a saved three-Grove ensemble, labelled derived return or continued passage. Local files up to two minutes plus their fade, at 8–48 kHz and up to 256 KiB; explicit playback and sound download.'],
 ['Listening room','audition.html','Listening studies','Study','Compare prepared examples from the earlier instrument work.'],
 ['A changed structure','variant-audition.html','Listening studies','Study','Compare the same gesture on a fixed one-connection variant at equal output gain.'],
 ['Repeated adaptation','adaptation-audition.html','Listening studies','Study','Explore the bounded adaptation comparison and its declared conditions.'],
 ['A ring, opened','sketch.html','Experiments','Playable study','Play individual resonances or a whole voice constructed from six interpretations of one synthetic recording. Shape its decay, compare a shared gesture, and keep the prepared design in its address for a quiet return. Optional envelope circles and visible pickup scaling. Independent modes, not recovered geometry.'],
 ['What continues beyond the glimpse?','renders/joint-decay-study/index.html','Listening studies','Rendered study','Compare a synthetic noisy source with models fitted to its first half-second or first two seconds. One shared listening gain; later samples are withheld from fitting. Supplied frequencies and deliberate omissions, not automatic instrument inference.'],
 ['Room between touches','renders/touch-recurrence-study/index.html','Listening studies','Rendered study','Six alternating Touch gestures on one instrument: even spacing, pairs and space, or widening intervals. Same strengths, gain, first and last onset, and ending; only interior timing changes. Keep the authored study gestures or enter an empty instrument to respond freely.'],
 ['A touch meets a ring','renders/touch-interference-study/index.html','Listening studies','Rendered study','Leave an opening ringing, or add the same right-hand touch at two times separated by two milliseconds. Identical opening samples, instrument and gain; changed timing changes interference. Authored examples with downloadable gestures, not a precision-playing challenge or a perceptual claim.'],
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
