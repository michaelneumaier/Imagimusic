import {createListeningLevel,listeningGain} from './listening-level.js';
/** One media element, one graph. Files and their download bytes are untouched. */
export function createMediaListening(audio,{db=18,createContext=()=>new AudioContext(),createStage=createListeningLevel}={}){
 listeningGain(db);
 let context=null,source=null,stage=null,closed=false;
 function ensure(){
  if(closed)throw new Error('Listening player is closed');
  context??=createContext();
  // A media element can only be attached once. Retain its source if a later
  // connection fails, so an explicit retry never attempts to attach it twice.
  source??=context.createMediaElementSource(audio);
  if(!stage){
   const candidate=createStage(context,{db});
   try{candidate.output.connect(context.destination);source.connect(candidate.input);}
   catch(error){source.disconnect();candidate.dispose();throw error;}
   stage=candidate;
  }
 }
 return {
  setListeningDb(value){listeningGain(value);db=value;stage?.setDb(value);},
  play(){
   try{ensure();const resumed=context.resume(),played=audio.play();return Promise.all([resumed,played]);}
   catch(error){return Promise.reject(error);}
  },
  resume(){return context?context.resume():Promise.resolve();},
  pause(){audio.pause();},
  dispose(){if(closed)return;closed=true;audio.pause();source?.disconnect();stage?.dispose();context?.close();}
 };
}
