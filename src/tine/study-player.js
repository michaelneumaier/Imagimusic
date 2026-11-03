import {createListeningLevel,listeningGain} from '../grove/listening-level.js';
export function createTineStudyPlayer({audio,createContext=()=>new AudioContext(),createStage=createListeningLevel}){
 let context=null,source=null,stage=null,db=0,version=0;
 function stop(){version++;audio.pause();}
 async function play(url){
  stop();const own=version;
  if(!context){context=createContext();source=context.createMediaElementSource(audio);}
  if(!stage){const next=createStage(context,{db});try{source.connect(next.input);next.output.connect(context.destination);}catch(error){source.disconnect();next.dispose();throw error;}stage=next;}
  await context.resume();if(own!==version)return false;
  if(context.state!=='running')throw Error('Audio is interrupted. Choose a body again when audio is available.');
  audio.src=url;await audio.play();if(own!==version)return false;return true;
 }
 function setDb(value){listeningGain(value);stage?.setDb(value);db=value;}
 function park(){stop();if(context)Promise.resolve(context.suspend()).catch(()=>{});}
 return {play,stop,park,setDb,resume(){return context?context.resume():Promise.resolve();},get db(){return db;}};
}
