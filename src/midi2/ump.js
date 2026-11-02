// Binary packet boundary for Clip import. M2-104-UM v1.1.2, Table4 and
// Figures24–27,33–34,46–52,55,66–67,70 (diagrams visually checked).
// This is not a Clip timeline, transport, or conformance validator. Unsupported
// packets retain their exact words and offsets; reserved bits are ignored when
// extracting known fields, as required by §2.1.3, and remain in those raw words.
export const UMP_WORD_COUNTS=Object.freeze([1,1,1,2,2,4,1,1,2,2,2,3,3,4,4,4]);
export const UMP_LIMITS=Object.freeze({maxBytes:262144,maxPackets:65536});
const RESERVED_TYPES=new Set([6,7,8,9,10,11,12,14]);

function decode(words){
 const w=words[0],mt=w>>>28,group=(w>>>24)&15,status=(w>>>20)&15,channel=(w>>>16)&15;
 if(mt===0){
  if(status===0)return {kind:'noop'};
  if(status===3)return {kind:'ticksPerQuarter',ticks:w&0xffff};
  if(status===4)return {kind:'deltaClockstamp',ticks:w&0xfffff};
  return {kind:'unsupported',family:'utility',status};
 }
 if(mt===15){
  const form=(w>>>26)&3,streamStatus=(w>>>16)&0x3ff;
  if(form===0&&streamStatus===0x20)return {kind:'startOfClip'};
  if(form===0&&streamStatus===0x21)return {kind:'endOfClip'};
  return {kind:'unsupported',family:'stream',status:streamStatus,form};
 }
 if(mt===13){
  const form=(w>>>22)&3,address=(w>>>20)&3,bank=(w>>>8)&255,flexStatus=w&255;
  if(form===0&&address===1&&bank===0&&flexStatus===0)return {kind:'tempo',group,tenNanosecondsPerQuarter:words[1]};
  return {kind:'unsupported',family:'flex',group,form,address,bank,status:flexStatus};
 }
 if(mt!==4)return {kind:'unsupported',family:RESERVED_TYPES.has(mt)?'reserved-message-type':'message-type',messageType:mt};
 const noteNumber=(w>>>8)&127,data32=words[1],base={group,channel};
 let event;
 switch(status){
  case 8:case 9:event={type:status===9?'noteOn':'noteOff',noteNumber,velocity16:data32>>>16,attributeType8:w&255,attributeData16:data32&0xffff};break;
  case 10:event={type:'polyPressure',noteNumber,data32};break;
  case 0:event={type:'perNoteController',noteNumber,index8:w&255,data32};break;
  case 15:event={type:'perNoteManagement',noteNumber,flags:{detach:!!(w&2),reset:!!(w&1)}};break;
  case 6:event={type:'perNotePitchBend',noteNumber,data32};break;
  case 14:event={type:'pitchBend',data32};break;
  case 11:event={type:'controlChange',index8:(w>>>8)&127,data32};break;
  case 2:event={type:'registeredController',bank8:(w>>>8)&127,index8:w&127,data32};break;
  default:return {kind:'unsupported',family:'midi2-channel-voice',group,channel,status};
 }
 return {kind:'midi2',event:{...base,...event}};
}

/** Read big-endian UMPs from a Uint8Array (or a view into one). offset is relative
 * to that view, e.g.8 after a separately validated SMF2CLIP header. Complete raw
 * word copies preserve unknown messages without resynchronizing inside payloads.
 * Limits may only tighten the local resource bounds. No partial result on error.
 */
export function readUMPPackets(bytes,options={}){
 if(!(bytes instanceof Uint8Array))throw new TypeError('UMP input must be a Uint8Array.');
 if(!options||typeof options!=='object'||Array.isArray(options))throw new TypeError('UMP options must be an object.');
 for(const key of Object.keys(options))if(!['offset','maxBytes','maxPackets'].includes(key))throw new Error(`Unknown UMP option: ${key}`);
 const {offset=0,maxBytes=UMP_LIMITS.maxBytes,maxPackets=UMP_LIMITS.maxPackets}=options;
 for(const [key,value] of Object.entries({maxBytes,maxPackets}))if(!Number.isInteger(value)||value<1||value>UMP_LIMITS[key])throw new RangeError(`Invalid UMP ${key} limit.`);
 if(!Number.isInteger(offset)||offset<0||offset>bytes.byteLength)throw new RangeError('Invalid UMP offset.');
 if(bytes.byteLength>maxBytes)throw new RangeError(`UMP input exceeds ${maxBytes} bytes.`);
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),packets=[];
 for(let pos=offset;pos<bytes.byteLength;){
  if(packets.length>=maxPackets)throw new RangeError(`UMP input exceeds ${maxPackets} packets.`);
  if(bytes.byteLength-pos<4)throw new Error(`Truncated UMP word at byte ${pos}.`);
  const messageType=view.getUint32(pos,false)>>>28,count=UMP_WORD_COUNTS[messageType];
  if(bytes.byteLength-pos<count*4)throw new Error(`Truncated UMP type ${messageType} at byte ${pos}: expected ${count*4} bytes.`);
  const words=Array.from({length:count},(_,i)=>view.getUint32(pos+i*4,false));
  packets.push({byteOffset:pos,messageType,words,message:decode(words)});pos+=count*4;
 }
 return packets;
}
