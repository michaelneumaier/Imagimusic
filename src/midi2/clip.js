import {readUMPPackets} from './ump.js';
// M2-116-U v1.0 §§3,5–7. This is a bounded file/timeline reader, not a
// receiver or conformance certificate. No message is sent to an audio engine.
export const CLIP_DEFAULT_TEMPO_10NS=50000000;
const isTimeSignature=m=>m.kind==='unsupported'&&m.family==='flex'&&m.form===0&&m.address===1&&m.bank===0&&m.status===1;

/** Single-clock receiver policy: tempo messages affect the Clip timeline regardless
 * of their retained Group field. Conflicting cross-Group values at one tick
 * within one section are refused; same-Group changes retain presentation order. A
 * missing tempo uses120BPM with an explicit report; no tempo is silently clamped.
 * Configuration time is retained. The musical origin is separately identified;
 * callers must prepare configuration, not play it or collapse it to time zero.
 */
export function parseMIDIClip(bytes,options={}){
 if(!(bytes instanceof Uint8Array))throw new TypeError('MIDI Clip input must be a Uint8Array.');
 if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('Clip options must be an object.');
 for(const key of Object.keys(options))if(!['maxBytes','maxPackets'].includes(key))throw new Error(`Unknown Clip option: ${key}`);
 const header=[0x53,0x4d,0x46,0x32,0x43,0x4c,0x49,0x50];
 if(bytes.length<8||header.some((b,i)=>bytes[i]!==b))throw new Error('Expected the eight-byte SMF2CLIP header.');
 const raw=readUMPPackets(bytes,{...options,offset:8});
 if(raw[0]?.message.kind!=='deltaClockstamp'||raw[0].message.ticks!==0)throw new Error('This Clip reader requires an initial zero clockstamp; profile preambles are not supported.');
 if(raw[1]?.message.kind!=='ticksPerQuarter'||raw[1].message.ticks===0)throw new Error('A nonzero DCTPQ must follow the initial zero clockstamp.');
 const ticksPerQuarter=raw[1].message.ticks,packets=[],tempos=[],tempoAtTick=new Map();
 let tick=0,seconds=0,musicalSeconds=0,tempo=CLIP_DEFAULT_TEMPO_10NS,declaredTempo=false,assumedForElapsedTime=false;
 let start=-1,end=-1,lastNonClock=null,headerTempos=0,headerSignatures=0;
 for(let index=0;index<raw.length;index++){
  const packet=raw[index],m=packet.message,previous=raw[index-1]?.message;
  if(m.kind==='deltaClockstamp'){
   if(previous?.kind==='deltaClockstamp')throw new Error(`Unsupported consecutive clockstamps at byte ${packet.byteOffset}; no intervening event.`);
   if(m.ticks>0&&!declaredTempo)assumedForElapsedTime=true;
   const elapsed=m.ticks*tempo/ticksPerQuarter/1e8;
   tick+=m.ticks;seconds+=elapsed;if(start!==-1)musicalSeconds+=elapsed;
   if(!Number.isSafeInteger(tick)||!Number.isFinite(seconds))throw new Error('Clip timing exceeds the numeric range.');
  }else if(m.kind==='ticksPerQuarter'&&index!==1)throw new Error(`DCTPQ may occur only once, in the configuration header (byte ${packet.byteOffset}).`);
  if(m.kind==='startOfClip'){
   if(start!==-1)throw new Error('The Clip contains more than one Start of Clip.');
   if(previous?.kind!=='deltaClockstamp')throw new Error(`Start of Clip needs its preceding clockstamp at byte ${packet.byteOffset}.`);
   start=index;
  }
  if(m.kind==='endOfClip'){
   if(start===-1)throw new Error('End of Clip precedes Start of Clip.');
   if(previous?.kind!=='deltaClockstamp')throw new Error(`End of Clip needs its preceding clockstamp at byte ${packet.byteOffset}.`);
   if(index!==raw.length-1)throw new Error('End of Clip must be the final packet.');
   end=index;
  }
  if(m.kind==='tempo'){
   if(m.tenNanosecondsPerQuarter===0)throw new Error(`Zero tempo duration at byte ${packet.byteOffset} cannot define a clock.`);
   if(start===-1){
    if(++headerTempos>1||lastNonClock!=='ticksPerQuarter'||tick!==0)throw new Error('Configuration tempo must occur once, immediately after DCTPQ at tick zero.');
   }
   const scope=(start===-1?'configuration:':'sequence:')+tick,groups=tempoAtTick.get(scope)??new Map();
   for(const [group,prior]of groups)if(group!==m.group&&prior.value!==m.tenNanosecondsPerQuarter)throw new Error(`Conflicting tempos at tick ${tick}, bytes ${prior.byteOffset} and ${packet.byteOffset}.`);
   groups.set(m.group,{value:m.tenNanosecondsPerQuarter,byteOffset:packet.byteOffset});tempoAtTick.set(scope,groups);
   tempo=m.tenNanosecondsPerQuarter;declaredTempo=true;
   tempos.push({tick,seconds,group:m.group,tenNanosecondsPerQuarter:tempo,byteOffset:packet.byteOffset});
  }
  if(start===-1&&isTimeSignature(m)){
   if(++headerSignatures>1||lastNonClock!=='tempo'||tick!==0)throw new Error('Configuration time signature must occur once, immediately after tempo at tick zero.');
  }
  packets.push({...packet,tick,seconds,...(start!==-1?{sequenceSeconds:musicalSeconds}:{})});
  if(m.kind!=='deltaClockstamp')lastNonClock=m.kind;
 }
 if(start===-1||end===-1)throw new Error('The Clip requires Start of Clip and End of Clip markers.');
 const origin={tick:packets[start].tick,seconds:packets[start].seconds,byteOffset:packets[start].byteOffset};
 const configuration=packets.slice(0,start-1),sequence=packets.slice(start-1);
 sequence[0]={...sequence[0],sequenceSeconds:0};
 const assumedTempo=assumedForElapsedTime||tempos.length===0;
 return {version:1,ticksPerQuarter,origin,end:{tick,seconds},durationSeconds:musicalSeconds,configuration,sequence,tempos,
  report:{assumedTempo,defaultTempoBpm:assumedTempo?120:null,tempoPolicy:'One Clip clock; retained Group fields do not create separate clocks. Conflicting simultaneous values across Groups within a section are refused; same-Group changes retain presentation order.',configurationPolicy:'Preserved with elapsed setup time, not applied or rendered. Receiver preparation is required before playback.',
   unsupported:packets.filter(p=>p.message.kind==='unsupported').map(p=>({byteOffset:p.byteOffset,section:p.byteOffset<packets[start-1].byteOffset?'configuration':'sequence',message:p.message,words:p.words})),
   limitations:['Profile preambles before the initial clockstamp are unsupported.','Time signatures and other undecoded metadata are retained, not interpreted.','This parser does not apply receiver state, admit an instrument, render audio, or verify a device.']}};
}
