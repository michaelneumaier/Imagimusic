/** Replay the finished capture's PCM without editing its events, gain or ending. */
export function createGroveReplay({createContext=()=>new AudioContext(),onChange=()=>{}}={}){
 let context,source,bus,origin=0,duration=0,position=0,token=0,state='idle';
 const emit=()=>onChange({state});
 const time=()=>source?Math.min(duration,Math.max(0,context.currentTime-origin)):position;
 function stop(){
  token++;position=time();const old=source,oldBus=bus;source=bus=null;
  if(old){const now=context.currentTime;oldBus.gain.cancelScheduledValues(now);oldBus.gain.setValueAtTime(1,now);oldBus.gain.linearRampToValueAtTime(0,now+.025);old.stop(now+.03);}
  state='idle';emit();
 }
 async function play(pcm){
  stop();const own=token;state='preparing';emit();
  try{
   if(!context){context=createContext();context.onstatechange=()=>{if(!source)return;if(context.state!=='running'){state='suspended';emit();}else if(state==='suspended'){state='playing';emit();}};}await context.resume();if(own!==token)return;
   if(context.state!=='running')throw new Error('Audio is interrupted. Try listening again.');
   const buffer=context.createBuffer(pcm.channels.length,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((samples,i)=>buffer.copyToChannel(samples,i));
   const node=context.createBufferSource(),gain=context.createGain();node.buffer=buffer;node.connect(gain);gain.connect(context.destination);
   source=node;bus=gain;position=0;duration=buffer.duration??pcm.channels[0].length/pcm.sampleRate;origin=context.currentTime+.035;
   node.onended=()=>{node.disconnect();gain.disconnect();if(source===node){source=bus=null;position=duration;state='ended';emit();}};
   node.start(origin);state='playing';emit();
  }catch(error){if(own!==token)return;state='error';emit();throw error;}
 }
 return {play,stop,time,get state(){return state;},dispose(){stop();context?.close();}};
}
