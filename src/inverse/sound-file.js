/** Local analysis input only. RIFF chunks follow Microsoft RIFF/WAVE layout;
 * supported subset: classic or extensible PCM 16/24/32 or IEEE float32, one/two channels.
 * No resampling, mixing, gain change, playback, or interpretation of resonances.
 */
export const SOUND_FILE_MAX_BYTES=8*1024*1024;
export const SOUND_FILE_MAX_SECONDS=8;
const fail=message=>{throw new Error(message);};
export function parseInverseSound(bytes){
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength<12||bytes.byteLength>SOUND_FILE_MAX_BYTES)fail('Choose a WAV no larger than 8 MiB.');
 const view=new DataView(bytes),tag=offset=>String.fromCharCode(...new Uint8Array(bytes,offset,4));
 if(tag(0)!=='RIFF'||tag(8)!=='WAVE')fail('Use an uncompressed RIFF/WAVE file.');
 if(view.getUint32(4,true)+8!==bytes.byteLength)fail('The WAV container length does not match its bytes.');
 let format=null,data=null,fact=null;
 for(let offset=12;offset<bytes.byteLength;){
  if(offset+8>bytes.byteLength)fail('The WAV chunk header is truncated.');
  const id=tag(offset),size=view.getUint32(offset+4,true),start=offset+8,end=start+size,next=end+(size%2);
  if(next>bytes.byteLength)fail('The WAV chunk or its padding is truncated.');
  if(id==='fmt '){
   if(format||data||size<16)fail('The WAV needs one format chunk before its audio data.');
   let code=view.getUint16(start,true);const extensible=code===0xfffe;const channels=view.getUint16(start+2,true),sampleRate=view.getUint32(start+4,true),byteRate=view.getUint32(start+8,true),align=view.getUint16(start+12,true),bits=view.getUint16(start+14,true);
   let validBits=bits,channelMask=null;
   if(extensible){
    if(size!==40||view.getUint16(start+16,true)!==22)fail('Use the standard 22-byte extensible WAV extension.');
    validBits=view.getUint16(start+18,true);channelMask=view.getUint32(start+20,true);
    const guid=new Uint8Array(bytes,start+24,16),tail=[0,0,0,0,0,0,16,0,128,0,0,170,0,56,155,113];
    if(![1,3].includes(guid[0])||guid.some((v,i)=>i>0&&v!==tail[i]))fail('Use uncompressed PCM or float WAV; this subformat is unsupported.');
    code=guid[0];
    if(validBits<1||validBits>bits||(code===3&&validBits!==32))fail('The WAV valid-bit precision is unsupported.');
    if(channelMask!==0&&((channelMask&0xfffc0000)!==0||channelMask.toString(2).replaceAll('0','').length!==channels))fail('The WAV channel mask does not match its channels.');
   }
   if(!((code===1&&[16,24,32].includes(bits))||(code===3&&bits===32)))fail('Use PCM 16/24/32-bit or 32-bit float WAV; compressed formats are unsupported.');
   if(![1,2].includes(channels)||sampleRate<8000||sampleRate>96000)fail('Use mono or stereo WAV at 8–96 kHz.');
   if(align!==channels*bits/8||byteRate!==sampleRate*align)fail('The WAV sample layout is inconsistent.');
   if(!extensible&&size!==16&&(size!==18||view.getUint16(start+16,true)!==0))fail('This WAV format extension is not supported.');
   format={code,channels,sampleRate,align,bits,validBits,channelMask,extensible};
  }else if(id==='data'){
   if(!format||data)fail('The WAV needs one audio data chunk after its format.');
   data={start,size};
  }else if(id==='fact'){
   if(fact!==null||size<4)fail('The WAV sample-count chunk is invalid.');
   fact=view.getUint32(start,true);
  }
  offset=next;
 }
 if(!format||!data||!data.size||data.size%format.align)fail('The WAV has no complete audio frames.');
 const frameCount=data.size/format.align,duration=frameCount/format.sampleRate;
 if(duration>SOUND_FILE_MAX_SECONDS)fail('Choose a sound no longer than 8 seconds.');
 if(fact!==null&&fact!==frameCount)fail('The WAV declared sample count does not match its audio.');
 const channels=Array.from({length:format.channels},()=>new Float64Array(frameCount));
 let peak=0,atOrAboveUnitySamples=0;
 for(let frame=0;frame<frameCount;frame++)for(let channel=0;channel<channels.length;channel++){
  const offset=data.start+frame*format.align+channel*format.bits/8;
  let value;
  if(format.code===3)value=view.getFloat32(offset,true);
  else if(format.bits===16)value=view.getInt16(offset,true)/32768;
  else if(format.bits===32)value=view.getInt32(offset,true)/2147483648;
  else{let word=view.getUint8(offset)|(view.getUint8(offset+1)<<8)|(view.getUint8(offset+2)<<16);if(word&0x800000)word-=0x1000000;value=word/8388608;}
  // Valid PCM bits are left-aligned. Refuse nonzero padding rather than silently
  // discarding it or presenting precision that the file does not actually obey.
  if(format.code===1&&format.validBits<format.bits&&!Number.isInteger(value*2**(format.validBits-1)))fail('The WAV contains nonzero unused sample bits.');
  if(!Number.isFinite(value))fail('The WAV contains non-finite audio samples.');
  channels[channel][frame]=value;peak=Math.max(peak,Math.abs(value));if(Math.abs(value)>=1)atOrAboveUnitySamples++;
 }
 return {channels,sampleRate:format.sampleRate,frameCount,duration,containerBits:format.bits,validBits:format.validBits,channelMask:format.channelMask,extensible:format.extensible,encoding:format.code===3?'float32':`pcm${format.bits}`,peak,atOrAboveUnitySamples};
}
const check=signal=>{if(signal?.aborted)throw new DOMException('Opening sound cancelled.','AbortError');};
export async function readInverseSoundFile(file,{signal}={}){
 check(signal);
 if(!file||typeof file.arrayBuffer!=='function'||typeof file.name!=='string')fail('Choose a local WAV sound.');
 const size=file.size,name=file.name.slice(0,200);
 if(!Number.isSafeInteger(size)||size<12||size>SOUND_FILE_MAX_BYTES)fail('Choose a WAV no larger than 8 MiB.');
 const bytes=await file.arrayBuffer();check(signal);
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==size)fail('The sound file size changed while reading.');
 return {name,bytes};
}
