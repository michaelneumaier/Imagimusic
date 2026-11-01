/** A small audio-clock transport. Superseded preparation can never start audio. */
export function createListeningTransport({createContext,prepare,onChange=()=>{}}){
 let context,source,output,job,token=0,origin=0,offset=0,duration=0,state='idle',pcm=null,fadeStart=0;
 const emit=()=>onChange({state,time:time(),duration});
 function time(){return state==='playing'?Math.min(duration,Math.max(offset,context.currentTime-origin)):offset;}
 function release(){
  if(!source)return;
  const old=source,oldOutput=output;source=null;output=null;
  const now=context.currentTime;oldOutput.gain.cancelScheduledValues(now);oldOutput.gain.setValueAtTime(Math.min(1,Math.max(0,(now-fadeStart)/.05)),now);oldOutput.gain.linearRampToValueAtTime(0,now+.025);old.stop(now+.03);
 }
 function stop(){offset=time();token++;job?.cancel();job=null;release();state=pcm?'paused':'idle';emit();}
 async function play(input){
  stop();const own=token;state='preparing';emit();
  try{
   context??=createContext();await context.resume();if(own!==token)return;
   if(!pcm){job=prepare({...input,sampleRate:context.sampleRate});const result=await job.promise;if(own!==token)return;pcm=result;job=null;duration=pcm.channels[0].length/pcm.sampleRate;}
   const buffer=context.createBuffer(pcm.channels.length,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((data,i)=>buffer.copyToChannel(data,i));
   if(offset>=duration)offset=0;
   const node=context.createBufferSource(),gain=context.createGain();node.buffer=buffer;node.connect(gain);gain.connect(context.destination);
   source=node;output=gain;origin=context.currentTime+.035-offset;
   fadeStart=context.currentTime;gain.gain.setValueAtTime(0,context.currentTime);gain.gain.linearRampToValueAtTime(1,context.currentTime+.05);
   node.onended=()=>{node.disconnect();gain.disconnect();if(source===node){source=null;output=null;offset=duration;state='ended';emit();}};
   node.start(context.currentTime+.035,offset);state='playing';emit();
  }catch(error){if(own!==token)return;job=null;state='error';emit();throw error;}
 }
 function select(seconds){stop();pcm=null;offset=0;duration=seconds;state='idle';emit();}
 function seek(seconds){stop();offset=Math.max(0,Math.min(duration,seconds));state=pcm?'paused':'idle';emit();}
 return {play,stop,select,seek,time,get state(){return state;},get pcm(){return pcm;},dispose(){stop();context?.close();}};
}
