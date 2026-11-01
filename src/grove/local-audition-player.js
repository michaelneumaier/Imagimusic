/** Explicit-choice playback for local study files. One media element owns sound. */
export function bindLocalAudition({sound,quietButton,status,choices}){
 let selected=null,operation=0;
 function quiet(){operation++;sound.pause();quietButton.disabled=true;}
 for(const {button,url,label} of choices)button.onclick=async()=>{
  quiet();const own=operation;selected=label;sound.src=url;quietButton.disabled=false;status(`Listening: ${label}.`);
  try{await sound.play();}catch{if(own===operation){quietButton.disabled=true;status('This sound could not play. Choose a version to try again.');}}
 };
 quietButton.onclick=()=>{quiet();status('Quiet. Choose a version when you’re ready.');};
 sound.addEventListener('ended',()=>{quietButton.disabled=true;status(`${selected} has settled. Choose a version when you’re ready.`);});
 sound.addEventListener('error',()=>{quietButton.disabled=true;status('This local sound is unavailable.');});
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();quietButton.click();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){quiet();if(selected)status('Quiet. Choose a version when you’re ready.');}});
 window.addEventListener('pagehide',quiet);window.addEventListener('pageshow',e=>{if(e.persisted)status('Welcome back. Choose a version when you’re ready.');});
}
