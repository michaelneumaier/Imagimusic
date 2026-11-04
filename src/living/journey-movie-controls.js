import {createLivingJourneyMovieSession} from './journey-movie-session.js';

export function setupLivingJourneyMovieControls({getSelection,beforePrepare,canMake=()=>true,onChange=()=>{}}){
 const $=id=>document.getElementById(id);
 const session=createLivingJourneyMovieSession({onChange:()=>{refresh();onChange();}});
 function refresh(){$('journey-make-film').disabled=session.busy||!canMake();$('journey-cancel-film').disabled=!session.busy;}
 $('journey-cancel-film').addEventListener('click',()=>session.cancel());
 $('journey-make-film').addEventListener('click',async()=>{
  if(session.busy||!canMake())return;
  const selection=getSelection();beforePrepare();
  try{
   const pending=session.prepare(selection,text=>$('journey-film-status').textContent=text);
   $('journey-cancel-film').focus({preventScroll:true});
   const result=await pending;
   const links=result.links.map(item=>{const a=document.createElement('a');Object.assign(a,{href:item.href,download:item.download,textContent:item.label});return a;});
   $('journey-film-downloads').replaceChildren(...links);$('journey-film-result').hidden=false;
   $('journey-film-description').textContent=`${result.personal?`Your phrase · ${result.touches} touches`:`Seed ${result.seed} · ${result.treatment}`} · ${result.seconds.toFixed(2)} seconds · held ensemble view · ${result.reveal?'response veils':'solid bodies'}. These downloads stay until another film succeeds or this page is reloaded.`;
   $('journey-film-status').textContent='Film prepared locally. Save it below; nothing has played or been uploaded.';
  }catch(error){$('journey-film-status').textContent=(error.name==='AbortError'?'Film preparation cancelled.':`Film preparation failed: ${error.message}`)+' Any previous film remains available.';}
  finally{refresh();if(document.activeElement===$('journey-cancel-film'))$('journey-make-film').focus({preventScroll:true});}
 });
 refresh();return {cancel:session.cancel,refresh,get busy(){return session.busy;}};
}
