import {createTouchSession,renderTouchBank,renderTouchRecording} from '../src/touch/session.js';
import {createTouchReturnSession} from '../src/touch/return-session.js';
const output=document.getElementById('result'),session=createTouchReturnSession();
try{
 const live=createTouchSession({frequency:196,coupling:.004,detune:40,loss:.45},8000);live.strike({frame:0,body:0,velocity:.5});live.strike({frame:401,body:1,velocity:.25});live.finish(1600);
 const record=live.snapshot(),file=new File([JSON.stringify(record)],'generated-touch.json',{type:'application/json'}),actual=await session.open(file),expected=renderTouchRecording(record,renderTouchBank(live));
 if(JSON.stringify(actual.record)!==JSON.stringify(record)||actual.name!==file.name)throw Error('Record identity changed.');
 for(let c=0;c<2;c++){if(actual.pcm.channels[c].length!==expected.channels[c].length)throw Error('PCM length changed.');for(let i=0;i<expected.channels[c].length;i++)if(actual.pcm.channels[c][i]!==expected.channels[c][i])throw Error('PCM differs at '+i);}
 try{await session.open(new File(['{}'],'invalid.json'));throw Error('Invalid source accepted.');}catch(error){if(!error.message.includes('missing or unknown'))throw error;}if(session.result!==actual)throw Error('Failure replaced the previous passage.');
 const pending=session.open(file);session.cancel();try{await pending;throw Error('Cancelled source accepted.');}catch(error){if(error.name!=='AbortError')throw error;}if(session.result!==actual)throw Error('Cancellation replaced the previous passage.');
 output.textContent='PASS 3/3\nReal File → module worker → unchanged record and exact stereo PCM.\nInvalid replacement retains the original result.\nCancelled replacement retains the original result.\nNo device playback or native picker claim.';
}catch(error){output.textContent='FAIL: '+error.message;}finally{session.dispose();}
