/** Presentation only: no audio, score, saved identity or motion-setting changes. */
export function setupJourneyListeningView({beforeEnter=()=>{}}={}){
 const button=document.getElementById('listening-view'),caption=document.getElementById('listening-caption');
 let listening=false;
 function set(value){
  if(value)beforeEnter();
  listening=value;
  document.body.classList.toggle('listening-view',value);
  button.setAttribute('aria-pressed',String(value));
  button.textContent=value?'Show the workshop':'Enter listening view';
  caption.hidden=!value;
 }
 button.hidden=false;
 button.addEventListener('click',()=>set(!listening));
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&listening){set(false);button.focus({preventScroll:true});}
 });
}
