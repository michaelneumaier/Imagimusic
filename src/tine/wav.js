/** Encode the completed mono pickup without normalization or integer quantization. */
export function tineFloatWav({sampleRate,channels}){
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000||!Array.isArray(channels)||channels.length!==1||!(channels[0] instanceof Float32Array))throw Error('Expected mono float32 audio at 8–96 kHz.');
 const samples=channels[0];
 if(!samples.length||samples.length>8*sampleRate||samples.some(x=>!Number.isFinite(x)))throw Error('Expected finite audio lasting at most eight seconds.');
 const buffer=new ArrayBuffer(58+samples.length*4),view=new DataView(buffer);
 const tag=(at,s)=>{for(let i=0;i<s.length;i++)view.setUint8(at+i,s.charCodeAt(i));};
 tag(0,'RIFF');view.setUint32(4,buffer.byteLength-8,true);tag(8,'WAVE');
 tag(12,'fmt ');view.setUint32(16,18,true);view.setUint16(20,3,true);view.setUint16(22,1,true);
 view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*4,true);view.setUint16(32,4,true);view.setUint16(34,32,true);view.setUint16(36,0,true);
 tag(38,'fact');view.setUint32(42,4,true);view.setUint32(46,samples.length,true);
 tag(50,'data');view.setUint32(54,samples.length*4,true);
 for(let i=0;i<samples.length;i++)view.setFloat32(58+i*4,samples[i],true);
 return buffer;
}
