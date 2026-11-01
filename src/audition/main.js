import {composeConversation} from '../score/conversation.js';
import {scoreURL} from '../stage/score-performance.js';
const videos=[...document.querySelectorAll('video')],status=document.getElementById('status');
for(const video of videos){
 video.addEventListener('play',()=>{for(const other of videos)if(other!==video)other.pause();status.textContent=video.id==='legacy'?'Listening to the seeded study.':'Listening to the three-part conversation.';});
 video.addEventListener('pause',()=>{if(videos.every(other=>other.paused))status.textContent='Playback paused. Use the player to resume, or Listen to restart.';});
 video.addEventListener('ended',()=>{if(videos.every(other=>other.paused))status.textContent='Recording finished. Try the other arrangement, or explore it in the stage.';});
 video.addEventListener('error',()=>{status.textContent='This local recording is unavailable. Open the stage to explore the live instrument.';});
}
for(const button of document.querySelectorAll('[data-play]'))button.onclick=async()=>{
 const video=document.getElementById(button.dataset.play);video.currentTime=0;
 try{await video.play();}catch(error){status.textContent='Playback could not start: '+error.message;}
};
document.getElementById('camera').onchange=event=>{
 const video=document.getElementById('conversation');video.pause();
 video.addEventListener('loadedmetadata',()=>{video.pause();status.textContent='Camera ready. Playback is paused; choose Listen to start from the beginning.';},{once:true});
 video.src=event.target.value==='follow'?'renders/conservatory-conversation-follow-731.mp4':'renders/conservatory-conversation-731.mp4';
 video.load();status.textContent='Camera changed. Choose Listen to start this version from the beginning.';
};
document.getElementById('open-stage').href=scoreURL(new URL('stage.html?loom=1&fmEnabled=1',location.href),composeConversation());
