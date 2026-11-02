import test from 'node:test';
import assert from 'node:assert/strict';
import {readUMPPackets} from '../src/midi2/ump.js';
// Literal bytes transcribed from diagram field positions, not a production encoder.
const hex=s=>Uint8Array.from(s.replaceAll(/\s/g,'').match(/../g)??[],h=>parseInt(h,16));
const one=s=>readUMPPackets(hex(s))[0].message;
test('native note fields, unsigned32 precision and full group/channel address survive decoding',()=>{
 assert.deepEqual(one('4b 95 3c 03 fe dc 80 01'),{kind:'midi2',event:{group:11,channel:5,type:'noteOn',noteNumber:60,velocity16:65244,attributeType8:3,attributeData16:32769}});
 assert.equal(one('40 90 3c 00 00 00 00 00').event.type,'noteOn','zero velocity remains NoteOn');
 assert.equal(one('40 80 3c 01 ff ff 12 34').event.velocity16,65535);
 const pair=readUMPPackets(hex('40 00 40 4a 40 00 00 00 40 00 40 4a 40 00 00 01'));
 assert.equal(pair[1].message.event.data32-pair[0].message.event.data32,1);
 assert.deepEqual(one('4f af 7f 00 ff ff ff ff').event,{group:15,channel:15,type:'polyPressure',noteNumber:127,data32:4294967295});
});
test('supported expression opcodes decode without confusing per-note indices, CC indices or flags',()=>{
 const cases=[['42 03 45 ff 12 34 56 78',{type:'perNoteController',noteNumber:69,index8:255,data32:0x12345678}],['42 23 01 07 80 00 00 00',{type:'registeredController',bank8:1,index8:7,data32:0x80000000}],['42 b3 40 00 c0 00 00 00',{type:'controlChange',index8:64,data32:0xc0000000}],['42 63 45 00 80 00 00 01',{type:'perNotePitchBend',noteNumber:69,data32:0x80000001}],['42 e3 00 00 ff ff ff ff',{type:'pitchBend',data32:0xffffffff}]];
 for(const [bytes,event]of cases)assert.deepEqual(one(bytes),{kind:'midi2',event:{group:2,channel:3,...event}});
 for(let flags=0;flags<4;flags++)assert.deepEqual(one(`42 f3 45 0${flags} 00 00 00 00`).event.flags,{detach:!!(flags&2),reset:!!(flags&1)});
});
test('timing and stream fields use their own widths; tempo stays in ten-nanosecond units',()=>{
 assert.deepEqual(one('00 30 01 e0'),{kind:'ticksPerQuarter',ticks:480});
 assert.deepEqual(one('00 4f ff ff'),{kind:'deltaClockstamp',ticks:1048575});
 assert.deepEqual(one('00 00 00 00'),{kind:'noop'});
 assert.deepEqual(one('f0 20 00 00 00 00 00 00 00 00 00 00 00 00 00 00'),{kind:'startOfClip'});
 assert.deepEqual(one('f0 21 00 00 00 00 00 00 00 00 00 00 00 00 00 00'),{kind:'endOfClip'});
 assert.deepEqual(one('d7 10 00 00 02 fa f0 80 00 00 00 00 00 00 00 00'),{kind:'tempo',group:7,tenNanosecondsPerQuarter:50000000});
 assert.equal(one('d7 00 00 00 02 fa f0 80 00 00 00 00 00 00 00 00').kind,'unsupported','channel-address tempo not interpreted as group tempo');
 assert.equal(one('f4 20 00 00 00 00 00 00 00 00 00 00 00 00 00 00').kind,'unsupported','wrong stream form not accepted as a marker');
});
test('all16 message types retain packet boundaries, including reserved96-bit types',()=>{
 const lengths=[4,4,4,8,8,16,4,4,8,8,8,12,12,16,16,16],bytes=[];let position=0;
 for(let mt=0;mt<16;mt++)bytes.push(mt*16,...Array(lengths[mt]-1).fill(0x90));
 const packets=readUMPPackets(Uint8Array.from(bytes));assert.equal(packets.length,16);
 for(let mt=0;mt<16;mt++){assert.equal(packets[mt].byteOffset,position);assert.equal(packets[mt].words.length,lengths[mt]/4);position+=lengths[mt];}
 for(const mt of [6,7,8,9,10,11,12,14])assert.equal(packets[mt].message.family,'reserved-message-type');
 assert.equal(one('40 c0 00 00 00 00 00 00').kind,'unsupported');
});
test('reserved fields do not change known decoding; exact raw words remain available',()=>{
 assert.deepEqual(one('4b 95 bc 03 fe dc 80 01'),one('4b 95 3c 03 fe dc 80 01'));
 assert.deepEqual(one('42 f3 c5 ff ff ff ff ff').event.flags,{detach:true,reset:true});
 assert.deepEqual(one('42 23 81 87 80 00 00 00').event,{group:2,channel:3,type:'registeredController',bank8:1,index8:7,data32:0x80000000});
 const bytes=hex('00 00 00 00 4b 95 bc 03 fe dc 80 01 00 00 00 00'),sub=bytes.subarray(4,12),packet=readUMPPackets(sub)[0];
 assert.equal(packet.words[0],0x4b95bc03);sub.fill(0);assert.equal(packet.words[0],0x4b95bc03,'raw words are owned copies');
 assert.equal(readUMPPackets(hex('53 4d 46 32 43 4c 49 50 00 30 01 e0'),{offset:8})[0].byteOffset,8);
});
test('truncation and resource limits fail without guessing a new packet boundary',()=>{
 for(const mt of [0,4,11,13]){const size={0:4,4:8,11:12,13:16}[mt];for(let length=1;length<size;length++){const b=new Uint8Array(length);b[0]=mt*16;assert.throws(()=>readUMPPackets(b),/Truncated/);}}
 assert.throws(()=>readUMPPackets(hex('00 00 00 00 00 00 00 00'),{maxPackets:1}),/packets/);
 assert.throws(()=>readUMPPackets(hex('00 00 00 00'),{maxBytes:3}),/bytes/);
 for(const options of [{offset:-1},{offset:1.5},{maxPackets:0},{maxBytes:Infinity},{typo:1}])assert.throws(()=>readUMPPackets(new Uint8Array(),options));
 assert.throws(()=>readUMPPackets(new ArrayBuffer(4)),/Uint8Array/);assert.deepEqual(readUMPPackets(new Uint8Array()),[]);
});
