import {createListeningContinuation} from './listening-continuation.js';
import {createLivingDirectedPhrase,LIVING_PHRASE_SPACING} from './generative-phrase.js';
import {createLivingGreeting} from './greeting.js';
import {readLivingKeptFile,LIVING_RECIPE_FILE_LIMIT} from './recipe-file.js';
import {createLivingExploration,serializeLivingExploration,validateLivingExploration} from './exploration-record.js';
import {createLivingMovieControls} from './movie-controls.js';
import {createLivingRecord,livingFragment,readLivingAddress} from './record.js';
import {createAudioRenderJob} from '../audio-render-job.js';
import {createLivingPerformanceView} from './performance-view.js';
import {createLivingResponse} from './response.js';
import {LIVING_PRESENTATIONS,livingPresentationVersion} from './presentation.js';
import {createLivingScene} from './scene.js';
import {createTineLiveSession} from '../tine/live-session.js';
import {createTineComparisonSession} from '../tine/live-comparison-session.js';
import {createTineLiveCapture} from '../tine/live-capture.js';
import {createGroveReplay} from '../grove/replay.js';
import {createTineDesign} from '../tine/address.js';
import {tineLiveFragment} from '../tine/live-address.js';
const $=id=>document.getElementById(id),canvas=$('instrument'),status=$('scene-status'),buttons=[...document.querySelectorAll('[data-view]')];
const design=createTineDesign();
let arrangementVersion=1,presentationVersion=4,playingDesign=design,branchCapture=null,seenBranch=null,branchReturnFocus=false;
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');let choseCameraMotion=false;
$('camera-motion').checked=!motionPreference.matches;
$('camera-motion').addEventListener('change',()=>{choseCameraMotion=true;});
motionPreference.addEventListener('change',()=>{if(!choseCameraMotion)$('camera-motion').checked=!motionPreference.matches;});
let world=null,session=null,raf=0,wantsFocus=false,returnFocus=false,liveResponse=null,replayResponse=null,replayCount=0,replayFocus=false,selectedPCM=null,seenCapture=null,seenComparison=null;
const bodyButtons=[...document.querySelectorAll('[data-length]')];
let restoreVersion=0,movie=null,explorationJob=null,explorationURL=null,branchOrigin=null,pendingBranchOrigin=null;
let examplePlaying=false,generatedPlaying=false,generatedPhrase=null,generatedSpacing='original',generatedArrangementVersion=1,generatedKeepURL=null;
const arrangementNames={1:'Overlapping round',2:'Spacious exchange',3:'A reply, then a breath'};
const arrangementButtons=[...document.querySelectorAll('[data-arrangement]')];
const spacingButtons=[...document.querySelectorAll('[data-spacing]')];
const exampleName=()=>generatedPlaying?'A generated piece':'An authored example';
const generatedTitle=phrase=>({repeat:'A returning motif',linger:'The last touch waits',soften:'A softer return'})[phrase.variation];
let unfolding=false,arrangementJob=null,arrangementPCM=null,arrangementView=null,lastPart=null,replayReturnButton='again';
const active=state=>['preparing','playing','ringing','ending'].includes(state);
const continuation=createListeningContinuation({next:()=>{
 if(document.hidden||!world||listening()||active(session.state)||movie?.busy||explorationJob||capture.pending||comparison.pending||branchCapture?.pending){stopContinuation();return;}
 previewGenerated(crypto.getRandomValues(new Uint32Array(1))[0],generatedSpacing);
},onChange:()=>{
 $('continue-listening').checked=continuation.enabled;
 $('continue-note').textContent=continuation.pending?'A moment of quiet. Another piece follows in three seconds.':continuation.enabled?'Another piece will follow when this one settles. Quiet stops the sequence.':'Optional: let new pieces follow at the same pace and arrangement. Keeping, exploring or leaving stops the sequence.';
 controls();
}});
function stopContinuation(){continuation.stop();}
$('continue-listening').addEventListener('change',()=>{
 if($('continue-listening').checked){continuation.enable();if(!listening()&&!active(session.state))continuation.queue();}
 else stopContinuation();
});
const listening=()=>['preparing','playing','suspended'].includes(replay.state);
function controls(){
 const branchPending=!!branchCapture?.pending;
 const state=session?.state??'idle',busy=active(state)||!!movie?.busy||!!explorationJob,repeat=listening();
 $('phrase-exploration').hidden=!capture.current;
 $('begin').disabled=!world||busy||repeat;
 $('hear-first').disabled=!world||busy||repeat||capture.pending||comparison.pending||branchPending;
 $('generate-piece').disabled=$('hear-first').disabled;
 $('another-piece').disabled=$('generate-piece').disabled;
 $('replay-generated').disabled=$('hear-first').disabled||!generatedPhrase;
 $('explore-generated').disabled=$('replay-generated').disabled;
 $('keep-generated').disabled=$('replay-generated').disabled;
 for(const b of [...spacingButtons,...arrangementButtons])b.disabled=$('replay-generated').disabled;
 $('open-recipe').disabled=!world||busy||repeat;
 $('return-branch').disabled=!world||busy||repeat||capture.pending||comparison.pending||branchPending||!branchCapture?.current;
 $('play-body').disabled=!world||busy||repeat||capture.pending||comparison.pending||branchPending||!selectedPCM||selectedPCM.record.design.lengthMm===80;
 $('touch').disabled=repeat||state!=='playing'||session.touches>=8;
 $('quiet').disabled=!continuation.pending&&((!busy&&!repeat)||(busy&&state==='ending'));
 $('again').hidden=!selectedPCM;
 $('again').disabled=!world||busy||repeat||capture.pending||comparison.pending||branchPending||!selectedPCM;
 for(const b of bodyButtons)b.disabled=!world||busy||repeat||capture.pending||comparison.pending||branchPending||!capture.current;
 $('keep-exploration').disabled=!world||busy||repeat||branchPending||!branchCapture?.current||!branchOrigin;
 $('keep-encounter').disabled=!world||busy||repeat||capture.pending||!capture.current;
 $('unfold').disabled=!world||busy||repeat||capture.pending||comparison.pending||branchPending||!capture.current;
 for(const b of buttons)b.disabled=!world||(repeat&&unfolding);
 movie?.refresh();
 if(repeat&&unfolding){$('touch-count').textContent=examplePlaying?exampleName():'Your phrase unfolding';return;}
 $('touch-count').textContent=repeat?`${replayCount} / ${selectedPCM.record.events.length} remembered ${selectedPCM.record.events.length===1?'touch':'touches'}`:`${session?.touches??0} / 8 touches`;
}
function touch(){if(!session||$('touch').disabled)return;session.strike(.1).catch(error=>{if(error.name!=='AbortError')$('playing-status').textContent=error.message;});}
function animate(){
 raf=0;const repeat=listening(),t=repeat?replay.time():session.time(),response=repeat?replayResponse:liveResponse;
 if(repeat&&unfolding){
  const frame=arrangementView.at(t);world?.arrangementFrame(frame,$('reveal').checked,$('camera-motion').checked);$('touch-count').textContent=`${frame.touches} / ${frame.totalTouches} ${examplePlaying?(generatedPlaying?'generated':'example'):'remembered'} touches`;$('remaining').textContent=`${t.toFixed(1)} / ${arrangementPCM.seconds.toFixed(1)} seconds`;
  const wideVisible=!$('camera-motion').checked||frame.cameraOpen>0,chapterKey=frame.part+':'+wideVisible;
  if(lastPart!==chapterKey){lastPart=chapterKey;const title=(examplePlaying?{opening:exampleName()+': a phrase, alone.',answer:'The phrase opens into three bodies.',return:'The opening phrase returns.'}:{opening:'Your phrase, alone.',answer:'Three bodies answering.',return:'The original phrase returns.'})[frame.part];$('playing-status').textContent=title;status.textContent=title;canvas.setAttribute('aria-label',wideVisible?'Three independent steel blades: 95 mm left, 80 mm centre, 65 mm right. Each veil follows that body’s recorded touches.':(examplePlaying?'The original 80 mm blade, playing a prepared phrase.':'The original 80 mm blade, playing your phrase alone.'));}
  if(frame.performers)canvas.setAttribute('aria-label',canvas.getAttribute('aria-label').replace(/ Score-driven strikers.*$/,'')+' Score-driven strikers prepare, touch and recover on the recorded timeline.');
  if(listening())raf=requestAnimationFrame(animate);return;
 }
 if(response&&$('reveal').checked)world?.response(response.at(t).points);
 if(repeat){
  const record=selectedPCM.record,count=record.events.filter(e=>e.frame/record.sampleRate<=t).length;
  if(count!==replayCount){replayCount=count;world?.acknowledgeTouch(count>0);controls();}
  $('remaining').textContent=`${t.toFixed(1)} / ${selectedPCM.seconds.toFixed(1)} seconds`;
 }else $('remaining').textContent=t<4?`${Math.max(0,4-t).toFixed(1)} seconds to touch`:'Letting it ring';
 if(active(session.state)||repeat)raf=requestAnimationFrame(animate);
}
function stopView(){cancelAnimationFrame(raf);raf=0;world?.response(null);if(unfolding){lastPart=null;world?.clearArrangement();status.textContent='80 × 10 × 1 mm · drag to look around';canvas.setAttribute('aria-label','Three-dimensional 80 mm steel blade clamped at one end on a ceramic arch.');if(examplePlaying)selectPCM(selectedPCM);}$('remaining').textContent='Quiet';}
function runView(){if(!raf)raf=requestAnimationFrame(animate);}
try{
 world=createLivingScene(canvas,{onTouch:touch});world.setLook(LIVING_PRESENTATIONS[presentationVersion].look);status.textContent='80 × 10 × 1 mm · drag to look around';
 for(const button of buttons)button.addEventListener('click',()=>{world.view(button.dataset.view);for(const b of buttons)b.setAttribute('aria-pressed',String(b===button));status.textContent=button.textContent;});
}catch(error){status.textContent='The 3D view could not open. The sound sketch and scene boards are available below.';for(const b of buttons)b.disabled=true;console.error(error);}
function describeBody(){
 if(!selectedPCM)return 'First make a phrase. Then discover how it sounds in another body.';
 const mm=selectedPCM.record.design.lengthMm,fresh=selectedPCM===branchCapture?.current;
 return `${mm===80?'Original':mm===95?'Longer':'Shorter'} body · ${mm} mm. ${fresh?'Your new phrase is selected. Hear again replays it.':mm===80?'Hear again replays your original phrase.':'Hear again plays your original touches on this body.'}`;
}

function selectPCM(pcm){
 selectedPCM=pcm;const mm=pcm?.record.design.lengthMm??80;world?.setLength(mm);
 status.textContent=`${mm} × 10 × 1 mm · drag to look around`;
 canvas.setAttribute('aria-label',`Three-dimensional ${mm} mm steel blade clamped at one end on a ceramic arch. Use the view buttons below to inspect it.`);
 for(const b of bodyButtons)b.setAttribute('aria-pressed',String(Number(b.dataset.length)===mm));
 $('body-path').hidden=!pcm||mm===80;if(pcm)$('body-path').href='tine-play.html'+tineLiveFragment(pcm.record);
 $('body-note').textContent=describeBody();$('play-body').textContent=mm===80?'Play this body':`Play the ${mm} mm body`;
}
const comparison=createTineComparisonSession({onChange:({current,pending,message})=>{
 if(current&&current!==seenComparison){seenComparison=current;selectPCM(current.candidate);}
 $('body-note').textContent=pending?'Preparing another body quietly…':describeBody();
 if(message)$('body-note').textContent=`That body could not be prepared. The previous body is still available. ${message}`;
 controls();
}});
const capture=createTineLiveCapture({onChange:({current,pending,message})=>{
 if(current&&current!==seenCapture){seenCapture=current;selectPCM(current);seenComparison=null;comparison.setSource(current.record);}
 if(current){$('open-phrase').href='tine-play.html'+tineLiveFragment(current.record);$('phrase-path').hidden=false;}
 $('phrase-note').textContent=message?`The latest replay could not be prepared. ${current?'Your previous phrase is still available. ':''}${message}`:pending?'Remembering this phrase…':current?`${current.record.events.length} ${current.record.events.length===1?'touch':'touches'} · ${current.seconds.toFixed(2)} seconds. Hear it here, or open it to compare bodies and keep its address.`:'A completed phrase will appear here.';
 controls();
}});
branchCapture=createTineLiveCapture({onChange:({current,pending,message})=>{
 if(current&&current!==seenBranch){branchOrigin=pendingBranchOrigin;pendingBranchOrigin=null;seenBranch=current;selectPCM(current);$('return-branch').hidden=false;$('branch-path').hidden=false;$('branch-path').href='tine-play.html'+tineLiveFragment(current.record);$('branch-path').textContent=`Open the new ${current.record.design.lengthMm} mm phrase ↗`;}
 $('branch-note').textContent=message?`The new phrase could not be prepared. Your original remains available. ${message}`:pending?'Remembering the new phrase separately…':current?`New ${current.record.design.lengthMm} mm phrase · ${current.record.events.length} ${current.record.events.length===1?'touch':'touches'}. Return to either phrase here. Unfolding and encounter keeping use the original.`:'Choose a longer or shorter body to make a new phrase here. Your original stays available.';
 controls();if(branchReturnFocus&&!pending){branchReturnFocus=false;if(!$('play-body').disabled)$('play-body').focus({preventScroll:true});}
}});
const replay=createGroveReplay({listeningDb:0,onChange:({state})=>{
 const quietFocused=document.activeElement===$('quiet');
 if(state==='ended'&&generatedPlaying)continuation.queue();
 if(state==='error'||state==='suspended')stopContinuation();
 controls();
 if(state==='preparing')$('playing-status').textContent=examplePlaying?'Preparing '+exampleName().toLowerCase()+'…':'Preparing your phrase…';
 if(state==='playing'){if(unfolding)world?.setLength(80);$('playing-status').textContent=unfolding?(examplePlaying?exampleName()+' is unfolding…':'Your phrase is unfolding…'):`Your phrase, returning on the ${selectedPCM.record.design.lengthMm} mm body.`;if(replayFocus)$('quiet').focus({preventScroll:true});runView();}
 if(state==='suspended'){$('playing-status').textContent='Replay was interrupted. Choose Quiet, then hear it again.';stopView();}
 if(!listening()){stopView();if(state==='ended')$('playing-status').textContent=examplePlaying?(generatedPlaying?'The piece has settled. Hear it again, keep it, or make another.':'The example has settled. Open Play a phrase to make one of your own.'):'Your phrase has settled. Hear it again, or begin something new.';if(quietFocused&&replayFocus&&!continuation.enabled)$(replayReturnButton).focus({preventScroll:!generatedPlaying});replayFocus=false;}
}});
session=createTineLiveSession({listeningDb:0,onChange:event=>{
 const touchFocused=document.activeElement===$('touch'),quietFocused=document.activeElement===$('quiet');
 if(event.state==='ending'&&(touchFocused||quietFocused))returnFocus=true;
 controls();if(event.sampleRate)liveResponse=createLivingResponse(playingDesign,event.sampleRate);
 const messages={preparing:'Preparing the instrument…',playing:`${playingDesign.lengthMm} mm body. Touch the blade, or use the Touch button.`,ringing:'The touch window has closed. Let it ring, or choose Quiet.',ending:'Ending gently…',ended:'The phrase has settled. Hear it again, or begin something new.',interrupted:'Playing stopped while the page or audio was away. Begin again when ready.',cancelled:'Preparation cancelled.',error:event.message};
 $('playing-status').textContent=messages[event.state]??'Choose Make a piece to listen, or open Play a phrase.';
 if(event.event){liveResponse?.accept(event.event);world?.acknowledgeTouch();$('touch-note').textContent=`Touch ${event.touches} accepted at sample ${event.event.frame}. The gold spot marks the fixed touch position; it is not a vibration display.`;}
 if(event.finished?.snapshot.events.length)(playingDesign.lengthMm===80?capture:branchCapture).accept(event.finished).catch(error=>{$(playingDesign.lengthMm===80?'phrase-note':'branch-note').textContent=error.message;});
 if(event.finished&&!event.finished.snapshot.events.length)$('playing-status').textContent='This pass ended without touches.'+(capture.current?' Your previous phrase remains available.':'');
 if(event.state==='playing'&&wantsFocus){wantsFocus=false;$('touch').focus({preventScroll:true});}
 if(touchFocused&&$('touch').disabled&&!$('quiet').disabled)$('quiet').focus({preventScroll:true});
 if(!active(event.state)){stopView();if(touchFocused||quietFocused||returnFocus){if(playingDesign.lengthMm!==80&&branchCapture.pending)branchReturnFocus=true;else $(playingDesign.lengthMm===80?($('playing-tools').open?'begin':'playing-invitation'):'play-body').focus({preventScroll:true});}returnFocus=false;}
 else if(event.state==='playing')runView();
}});
async function startPlaying(nextDesign){
 stopContinuation();
 $('playing-tools').open=true;
 const origin=nextDesign.lengthMm===80?null:selectedPCM===branchCapture.current?branchOrigin:createLivingRecord(capture.current.record,{cameraMotion:$('camera-motion').checked,reveal:$('reveal').checked,presentationVersion,arrangementVersion});
 branchReturnFocus=false;restoreVersion++;cancelExploration();pendingBranchOrigin=origin;
 cancelArrangement();unfolding=false;examplePlaying=false;comparison.cancel();capture.cancel();branchCapture.cancel();replay.park();playingDesign=nextDesign;selectPCM(nextDesign.lengthMm===80?capture.current:selectedPCM);liveResponse=null;world?.response(null);world?.acknowledgeTouch(false);wantsFocus=true;
 $('touch-note').textContent='Touches join the vibration already ringing. The gold spot appears only after a touch is accepted.';
 document.querySelector('.scene').scrollIntoView({block:'center',behavior:'instant'});
 try{await session.start(nextDesign);}catch(error){if(error.name!=='AbortError')$('playing-status').textContent=error.message;}
}
$('begin').addEventListener('click',()=>startPlaying(design));
$('play-body').addEventListener('click',()=>{if(!$('play-body').disabled)startPlaying(selectedPCM.record.design);});
$('return-branch').addEventListener('click',()=>{if($('return-branch').disabled)return;stopContinuation();comparison.cancel();unfolding=false;selectPCM(branchCapture.current);controls();});
$('again').addEventListener('click',async()=>{
 const pcm=selectedPCM;if(!pcm||$('again').disabled)return;stopContinuation();
 cancelArrangement();unfolding=false;examplePlaying=false;replayReturnButton='again';
 replayResponse=createLivingResponse(pcm.record.design,pcm.sampleRate);pcm.record.events.forEach(event=>replayResponse.accept(event));replayCount=0;
 world?.acknowledgeTouch(false);$('touch-note').textContent='Returning to the selected phrase, including its timing and ending.';
 document.querySelector('.scene').scrollIntoView({block:'center',behavior:'instant'});
 // play() first emits idle while stopping any old source; set focus intent after that synchronous step.
 const playing=replay.play(pcm);replayFocus=true;
 try{await playing;}catch(error){$('playing-status').textContent=error.message;}
});
function cancelArrangement(){arrangementJob?.cancel();arrangementJob=null;}
async function playArrangement(source,example=false,generated=false,version=arrangementVersion){
 if(generated)continuation.cancelPending();else stopContinuation();
 examplePlaying=example;generatedPlaying=generated;restoreVersion++;
 if(!example)selectPCM(capture.current);world?.view('opening');for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.view==='opening'));
 unfolding=true;lastPart=null;replayReturnButton=example?(generated?'replay-generated':'playing-invitation'):'unfold';arrangementPCM=null;arrangementView=null;
 let job;try{job=createAudioRenderJob(new URL('./arrangement-worker.js',import.meta.url),createLivingRecord(source,{presentationVersion,arrangementVersion:version}));}catch(error){stopContinuation();unfolding=false;$('playing-status').textContent=error.message;controls();return;}arrangementJob=job;
 const prepared=job.promise.then(pcm=>{if(arrangementJob!==job)throw new DOMException('Arrangement cancelled','AbortError');arrangementJob=null;arrangementPCM=pcm;arrangementView=createLivingPerformanceView(source,presentationVersion,version);return pcm;});
 $('touch-note').textContent=version===3?'An opening, a partial reply that releases its ring, two full answers, then the original returns. Independent bodies; ideal distributed damping on the first reply.':example?exampleName()+': a phrase crosses three bodies, then returns. Your own phrase stays separate.':'Five complete passes: original, three staggered answers, then the original again. Independent bodies; no mechanical coupling.';
 document.querySelector('.scene').scrollIntoView({block:'center',behavior:'instant'});
 const playing=replay.play(prepared);replayFocus=true;controls();
 try{await playing;}catch(error){cancelArrangement();if(error.name!=='AbortError')$('playing-status').textContent=error.message;}
}
$('unfold').addEventListener('click',()=>{if(!$('unfold').disabled)playArrangement(capture.current.record);});
$('hear-first').addEventListener('click',()=>{if(!$('hear-first').disabled)playArrangement(createLivingGreeting(),true,false,1);});
function previewGenerated(seed,spacing){
 generatedPhrase=createLivingDirectedPhrase(seed,spacing);generatedSpacing=spacing;
 $('generated-actions').hidden=false;
 if(generatedKeepURL)$('generated-keep-note').textContent='The download below still holds your last kept piece. Keep this piece saves the current one.';
 for(const b of spacingButtons)b.setAttribute('aria-pressed',String(b.dataset.spacing===spacing));
 $('generated-title').textContent=generatedTitle(generatedPhrase);
 $('generated-note').textContent=`${LIVING_PHRASE_SPACING[spacing].name} · ${arrangementNames[generatedArrangementVersion]}. A small motif crosses three bodies, then comes home.`;
 for(const b of arrangementButtons)b.setAttribute('aria-pressed',String(Number(b.dataset.arrangement)===generatedArrangementVersion));
 $('generated-identity').textContent=`Seed ${seed} · phrase grammar 1 · spacing direction 1. Six generated touches, with a ${generatedPhrase.variation==='repeat'?'repeated motif':generatedPhrase.variation==='linger'?'delayed final touch':'softer second cell'}. Kept encounters preserve the exact touches; this seed and direction label are not included in the saved encounter format.`;
 playArrangement(generatedPhrase.source,true,true,generatedArrangementVersion);
}
for(const id of ['generate-piece','another-piece'])$(id).addEventListener('click',()=>{
 if($(id).disabled)return;
 previewGenerated(crypto.getRandomValues(new Uint32Array(1))[0],generatedSpacing);
});
for(const button of spacingButtons)button.addEventListener('click',()=>{
 if(button.disabled||!generatedPhrase)return;
 previewGenerated(generatedPhrase.seed,button.dataset.spacing);
});
for(const button of arrangementButtons)button.addEventListener('click',()=>{
 if(button.disabled||!generatedPhrase)return;
 generatedArrangementVersion=Number(button.dataset.arrangement);previewGenerated(generatedPhrase.seed,generatedSpacing);
});
$('replay-generated').addEventListener('click',()=>{if(!$('replay-generated').disabled)playArrangement(generatedPhrase.source,true,true,generatedArrangementVersion);});
$('keep-generated').addEventListener('click',()=>{
 if($('keep-generated').disabled||!generatedPhrase)return;stopContinuation();
 try{
  const record=createLivingRecord(generatedPhrase.source,{arrangementVersion:generatedArrangementVersion,presentationVersion,cameraMotion:$('camera-motion').checked,reveal:$('reveal').checked});
  const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});
  if(blob.size>LIVING_RECIPE_FILE_LIMIT)throw Error('This recipe exceeds the supported file size.');
  const next=URL.createObjectURL(blob),link=$('generated-download');
  link.href=next;link.download=`imagimusic-piece-${generatedPhrase.seed}-${generatedPhrase.spacing}-arrangement${generatedArrangementVersion}.json`;
  link.textContent=`Last kept piece — save again: ${generatedTitle(generatedPhrase)} · ${LIVING_PHRASE_SPACING[generatedPhrase.spacing].name.toLowerCase()} · ${arrangementNames[generatedArrangementVersion].toLowerCase()}`;link.hidden=false;
  if(generatedKeepURL)URL.revokeObjectURL(generatedKeepURL);generatedKeepURL=next;
  $('generated-keep-note').textContent='Your piece is ready to save. Open this recipe here whenever you want to hear or explore it. Your current original and address are unchanged.';
  link.click();
 }catch(error){$('generated-keep-note').textContent='Could not keep this piece. '+error.message;}
});
$('explore-generated').addEventListener('click',async()=>{
 if($('explore-generated').disabled)return;
 const phrase=generatedPhrase,version=generatedArrangementVersion;park();const own=restoreVersion;
 await capture.load(phrase.source);if(own!==restoreVersion)return;
 if(JSON.stringify(capture.current?.record)!==JSON.stringify(phrase.source)){$('generated-note').textContent='This piece could not be prepared for exploration. The previous original remains available.';return;}
 arrangementVersion=version;unfolding=false;examplePlaying=false;generatedPlaying=false;
 $('generated-note').textContent=`${generatedTitle(phrase)} is now your current original, at ${LIVING_PHRASE_SPACING[phrase.spacing].name.toLowerCase()}, with ${arrangementNames[version].toLowerCase()}. Compare its bodies, play an answer, or keep the encounter.`;
 $('touch-note').textContent='This original phrase was generated. Its timing and accents remain intact when you compare bodies or keep the encounter.';
 $('playing-status').textContent='Generated phrase adopted quietly. Hear again, unfold it, or choose another body to play.';controls();
});
for(const button of bodyButtons)button.addEventListener('click',async()=>{
 if(button.disabled)return;stopContinuation();unfolding=false;const lengthMm=Number(button.dataset.length);
 if(lengthMm===80){comparison.cancel();selectPCM(capture.current);controls();return;}
 try{await comparison.prepare({lengthMm,widthMm:10});}catch(error){$('body-note').textContent=error.message;}
});
$('reveal').addEventListener('change',()=>{if(!$('reveal').checked){if(unfolding&&arrangementView)world?.arrangementFrame(arrangementView.at(replay.time()),false,$('camera-motion').checked);else world?.response(null);}});
$('touch').addEventListener('click',touch);
$('touch').addEventListener('keydown',event=>{if(event.repeat&&(event.code==='Space'||event.code==='Enter'))event.preventDefault();});
$('quiet').addEventListener('click',()=>{
 const wasWaiting=continuation.pending;stopContinuation();
 if(wasWaiting&&!listening()&&!active(session.state)){$('playing-status').textContent='Listening sequence stopped. This piece is still available to replay, keep or explore.';return;}
 if(explorationJob){restoreVersion++;cancelExploration();$('recipe-note').textContent='Opening cancelled. Both previous phrases remain available.';controls();return;}
 if(movie?.busy){movie.cancel();return;}
 if(listening()){cancelArrangement();replay.stop();$('playing-status').textContent=examplePlaying?(generatedPlaying?'Piece stopped. Hear it again, explore it, or make another.':'Example stopped. Choose Begin when you want to play.'):'Replay stopped. Your phrase is unchanged.';return;}
 session.quiet().catch(error=>{if(error.name!=='AbortError')$('playing-status').textContent=error.message;});
});
$('level').addEventListener('input',()=>{const db=Number($('level').value);session.setListeningDb(db);replay.setListeningDb(db);$('level-value').textContent=`+${db} dB`;});
function park(){stopContinuation();pendingBranchOrigin=null;cancelExploration();branchReturnFocus=false;movie?.cancel();restoreVersion++;cancelArrangement();wantsFocus=false;replayFocus=false;comparison.cancel();capture.cancel();branchCapture?.cancel();replay.park();session.park();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)park();});window.addEventListener('pagehide',park);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();park();status.textContent='The 3D view was interrupted. Reload to restore it; the sound sketch remains available.';for(const b of buttons)b.disabled=true;world?.dispose();world=null;controls();});
movie=createLivingMovieControls({getSource:()=>capture.current.record,getOptions:()=>({cameraMotion:$('camera-motion').checked,reveal:$('reveal').checked,presentationVersion,arrangementVersion}),canMake:()=>!!world&&!explorationJob&&!active(session.state)&&!listening()&&!capture.pending&&!comparison.pending&&!branchCapture?.pending&&!!capture.current,onChange:controls});
controls();
$('make-film').addEventListener('click',stopContinuation,{capture:true});

$('keep-encounter').addEventListener('click',()=>{
 if($('keep-encounter').disabled)return;stopContinuation();
 try{const record=createLivingRecord(capture.current.record,{cameraMotion:$('camera-motion').checked,reveal:$('reveal').checked,presentationVersion,arrangementVersion});history.replaceState(null,'',livingFragment(record));$('keep-note').textContent='Encounter kept in this address. Bookmark or copy it to return quietly. New playing changes the address only when you choose Keep again.';}
 catch(error){$('keep-note').textContent=error.message;}
});
function cancelExploration(){explorationJob?.cancel();explorationJob=null;}
$('keep-exploration').addEventListener('click',()=>{
 if($('keep-exploration').disabled)return;stopContinuation();
 try{
  const record=createLivingExploration(branchOrigin,branchCapture.current.record);
  const next=URL.createObjectURL(new Blob([serializeLivingExploration(record)],{type:'application/json'}));
  const link=$('exploration-download');link.href=next;link.download=`imagimusic-exploration-${record.response.design.lengthMm}mm.json`;link.hidden=false;
  if(explorationURL)URL.revokeObjectURL(explorationURL);explorationURL=next;
  $('exploration-note').textContent=`Both phrases are ready to save: the original this performance began with, and your new ${record.response.design.lengthMm} mm phrase. This file stays with that pair until you prepare another.`;
 }catch(error){$('exploration-note').textContent='Could not prepare this pair. '+error.message;}
});
async function restoreExploration(value){
 const record=validateLivingExploration(value);park();const own=restoreVersion;
 $('recipe-note').textContent='Preparing both kept phrases quietly…';
 try{
  const job=createAudioRenderJob(new URL('./exploration-worker.js',import.meta.url),record);explorationJob=job;controls();
  const pcm=await job.promise;if(own!==restoreVersion||explorationJob!==job)return;
  if(JSON.stringify(pcm.record)!==JSON.stringify(record)||JSON.stringify(pcm.original.record)!==JSON.stringify(record.original.source)||JSON.stringify(pcm.response.record)!==JSON.stringify(record.response))throw Error('The prepared phrases do not match this exploration.');
  const commitOriginal=capture.stage(pcm.original),commitResponse=branchCapture.stage(pcm.response);
  // Both validations and copies succeeded. No observer sees a partial pair.
  commitOriginal();commitResponse();pendingBranchOrigin=record.original;explorationJob=null;
  unfolding=false;world?.clearArrangement();applyPresentation(record.original);
  capture.publish();branchCapture.publish();
  $('playing-status').textContent='Both kept phrases are ready. Your new phrase is selected; hear it when you choose.';
  $('recipe-note').textContent='Both phrases reopened quietly. Original returns to the first phrase; Return to the new phrase restores your response. The address and previous downloads are unchanged. Unfolding and films use the original.';
 }catch(error){
  if(own!==restoreVersion)return;
  $('recipe-note').textContent='Could not open this exploration. Both previous phrases remain available. '+error.message;
 }finally{if(own===restoreVersion){explorationJob=null;controls();}}
}
function applyPresentation(record){
 arrangementVersion=record.arrangementVersion;presentationVersion=livingPresentationVersion(record);world?.setLook(LIVING_PRESENTATIONS[presentationVersion].look);
 $('camera-motion').checked=record.cameraMotion&&!motionPreference.matches;choseCameraMotion=true;$('reveal').checked=record.reveal;
}
async function restoreRecord(record,origin,note=$('keep-note')){
 park();const own=restoreVersion;
 unfolding=false;world?.clearArrangement();note.textContent='Opening your kept encounter quietly…';
 await capture.load(record.source);if(own!==restoreVersion)return;
 if(!capture.current||JSON.stringify(capture.current.record)!==JSON.stringify(record.source)){note.textContent='This encounter could not be prepared. Your previous phrase and address remain available.';return;}
 // Commit presentation only after source reconstruction succeeds.
 applyPresentation(record);
 $('playing-status').textContent='Your kept phrase is ready. Hear it again or unfold it when you choose.';
 note.textContent=`Kept encounter reopened quietly from ${origin}: original touches, ${arrangementNames[arrangementVersion].toLowerCase()} and reveal choice restored. ${LIVING_PRESENTATIONS[presentationVersion].name} appearance restored. Listening level and manual camera position are not saved.`+(record.cameraMotion&&motionPreference.matches?' Camera motion is off for your reduced-motion preference.':'')+(origin==='a recipe file'?' The address is unchanged; choose Keep encounter in address to update it.':'');
}
async function restoreAddress(){
 park();if(!location.hash)return;
 try{await restoreRecord(readLivingAddress(location.hash),'this address');}
 catch(error){$('keep-note').textContent='Could not open this encounter. '+error.message+(capture.current?' Your previous phrase remains available.':'');}
}
$('open-recipe').addEventListener('change',async()=>{
 const file=$('open-recipe').files?.[0];$('open-recipe').value='';if(!file)return;
 park();const own=restoreVersion;$('recipe-note').textContent='Reading the selected kept file locally…';
 try{const record=await readLivingKeptFile(file);if(own!==restoreVersion)return;if(record.kind==='imagimusic-living-exploration')await restoreExploration(record);else await restoreRecord(record,'a recipe file',$('recipe-note'));}
 catch(error){if(own===restoreVersion)$('recipe-note').textContent='Could not open this kept file. '+error.message+(capture.current?' Your previous phrase remains available.':'');}
});
window.addEventListener('hashchange',restoreAddress);if(location.hash)restoreAddress();
