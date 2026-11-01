const entries=[
 ['Start here','welcome.html','Encounters','Playable','Three gentle doors into the project: listen, play, and rest a hand.'],
 ['Listen','listen.html','Encounters','Playable','Follow a sound between connected bodies in a short guided encounter.'],
 ['The Grove','grove.html','Encounters','Playable','Strike a body in a coupled instrument and watch its modeled response.'],
 ['Rest','rest.html','Encounters','Playable','Strike, damp, and release. Keep a passage as gestures, sound, or a film.'],
 ['Leave room','pulse.html','Experiments','Prototype','An authored opening leaves the instrument ringing for your own answer.'],
 ['A powered encounter','powered.html','Experiments','Prototype','Supply a bounded source, rest a hand, and observe the release. Optional traces reveal the model’s response.'],
 ['A gesture, another answer','adapt.html','Experiments','Prototype','Use saved gestures or a prepared example to change connection strengths, compare, and play either structure.'],
 ['Resonator garden','index.html','Instruments','Playable','The original laboratory: instrument controls, a physical tine, and interpreted synthesizer mechanisms.'],
 ['Tension Loom','loom.html','Instruments','Playable','Explore coupled resonators and the physical parameters behind their response.'],
 ['FM tensioner','tensioner.html','Instruments','Playable','A visible tension mechanism interprets frequency modulation.'],
 ['Touch. Listen. Answer.','touch.html','Encounters','Playable','An earlier touch-led study of musical gestures and response.'],
 ['Expressive voices','expressive.html','Instruments','Playable','Follow independent changing voices through a visual instrument study.'],
 ['Grove voices','grove-voices.html','Instruments','Study','Inspect the voice configurations behind the Grove.'],
 ['The Conservatory','stage.html','Composition & keeping','Playable','A shared score, mechanical performers, causal inspection, and local performance rendering.'],
 ['Bring a score','midi.html','Composition & keeping','In progress','Map a local MIDI file to available instruments and inspect the mapping.'],
 ['Reopen a passage','reopen.html','Composition & keeping','Tool','Return to supported saved Grove and Rest records. The planned ensemble file is not supported yet.'],
 ['Listening room','audition.html','Listening studies','Study','Compare prepared examples from the earlier instrument work.'],
 ['A changed structure','variant-audition.html','Listening studies','Study','Compare the same gesture on a fixed one-connection variant at equal output gain.'],
 ['Repeated adaptation','adaptation-audition.html','Listening studies','Study','Explore the bounded adaptation comparison and its declared conditions.'],
 ['Room for an answer','renders/open-phrase-study/index.html','Listening studies','Rendered study','The same opening with a neighboring answer at three different delays. Optional private listening notes.'],
 ['One more return','renders/open-phrase-recurrence/index.html','Listening studies','Rendered study','Compare one and two cycles of the opening, alone and with the same delayed answer.'],
 ['Three Groves','renders/harmonic-groves/index.html','Listening studies','Rendered study','Three intact instruments: a shared pitch center versus C–E♭–G, with matched gestures and a fixed mix.']
];
const catalog=document.getElementById('catalog'),search=document.getElementById('search'),category=document.getElementById('category'),count=document.getElementById('count');
function element(tag,text,className){const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;}
function render(){
 const query=search.value.trim().toLocaleLowerCase(),shown=entries.filter(e=>(category.value==='all'||e[2]===category.value)&&e.join(' ').toLocaleLowerCase().includes(query));
 catalog.replaceChildren();
 for(const [title,url,group,status,description] of shown){const card=element('article',null,'card'),top=element('div',null,'card-top');top.append(element('span',group),element('span',status,'tag'+(/Study|study|Prototype/.test(status)?' study':'')));card.append(top,element('h3',title),element('p',description));const link=element('a','Open '+title+' ↗');link.href=url;card.append(link);catalog.append(card);}
 if(!shown.length)catalog.append(element('p','No matching studies. Try another word or choose Everything.','empty'));
 count.textContent=shown.length+' of '+entries.length+' entries · local working collection';
}
search.addEventListener('input',render);category.addEventListener('change',render);render();
const notebook=document.getElementById('notebook'),title=document.getElementById('document-title'),status=document.getElementById('document-status'),source=document.getElementById('document-source'),text=document.getElementById('document-text');
let revision=0,request;
document.getElementById('close-doc').onclick=()=>notebook.close();
notebook.addEventListener('close',()=>{revision++;request?.abort();});
for(const button of document.querySelectorAll('[data-doc]'))button.addEventListener('click',async()=>{
 const own=++revision;request?.abort();request=new AbortController();title.textContent=button.childNodes[0].textContent.replace('↗','').trim();source.href=button.dataset.doc;text.textContent='';status.textContent='Loading the source notebook…';notebook.showModal();
 try{const response=await fetch(button.dataset.doc,{signal:request.signal});if(!response.ok)throw new Error('This document is unavailable ('+response.status+').');const body=await response.text();if(own!==revision)return;text.textContent=body;status.textContent='Working source · Markdown shown as plain text. Historical entries describe their own checkpoint, not necessarily the current state.';}
 catch(error){if(own===revision&&error.name!=='AbortError')status.textContent=error.message+' Use the source link or try again.';}
});
