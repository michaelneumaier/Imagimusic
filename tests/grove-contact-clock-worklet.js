import {createContactEventQueue} from '../src/grove/contact-events.js';
class ContactClockProbe extends AudioWorkletProcessor{
 constructor(){super();this.queue=createContactEventQueue();this.values={zero:.25,beforeA:.125,beforeB:.375,boundary:.75,after:-.25,late:.125};this.late=false;
  for(const [id,frame] of [['after',257],['beforeA',127],['zero',0],['boundary',128],['beforeB',127]])this.queue.enqueue(id,frame);
 }
 process(inputs,outputs){
  const channels=outputs[0],acks=[];
  // Deliberately simulate a control arriving at a later render quantum.
  if(currentFrame>=256&&!this.late){this.queue.enqueue('late',1);this.late=true;}
  for(let i=0;i<channels[0].length;i++){let value=0;this.queue.applyThrough(currentFrame+i,event=>{value+=this.values[event.id];acks.push(event);});for(const channel of channels)channel[i]=value;}
  if(acks.length)this.port.postMessage(acks);return true;
 }
}
registerProcessor('grove-contact-clock-probe',ContactClockProbe);
