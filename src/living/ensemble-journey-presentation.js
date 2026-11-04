/** Optional page presentation; no automatic playback or composition changes. */
export function setupJourneyPresentation({root,audio,toggle,pause,secondaryDetails,keyboard=document}){
 let settled=false,opened=[];
 function setSettled(value){
  if(value===settled)return;settled=value;
  if(value){opened=secondaryDetails.filter(d=>d.open);secondaryDetails.forEach(d=>d.open=false);}
  else{opened.forEach(d=>d.open=true);opened=[];}
  root.classList.toggle('settled',value);toggle.setAttribute('aria-pressed',String(value));toggle.textContent=value?'Show the full page':'Settle into listening';
 }
 toggle.hidden=false;pause.hidden=false;
 toggle.addEventListener('click',()=>setSettled(!settled));
 pause.addEventListener('click',()=>audio.pause());
 const update=()=>pause.disabled=audio.paused||audio.ended;
 for(const event of ['play','pause','ended','emptied'])audio.addEventListener(event,update);update();
 keyboard.addEventListener('keydown',event=>{if(event.key==='Escape'&&settled){setSettled(false);toggle.focus();}});
}
