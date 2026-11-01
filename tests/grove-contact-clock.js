const $=id=>document.getElementById(id),report={version:1,generated:new Date().toISOString(),userAgent:navigator.userAgent,results:[]};
try{
 for(const sampleRate of [44100,48000]){
  const context=new OfflineAudioContext(2,1024,sampleRate);await context.audioWorklet.addModule('./grove-contact-clock-worklet.js');
  const node=new AudioWorkletNode(context,'grove-contact-clock-probe',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2]}),acks=[];
  let timeout;const messages=new Promise((resolve,reject)=>{timeout=setTimeout(()=>reject(new Error('Missing worklet acknowledgements')),5000);node.port.onmessage=event=>{acks.push(...event.data);if(acks.length===6)resolve();};});node.connect(context.destination);
  const [buffer]=await Promise.all([context.startRendering(),messages]).finally(()=>clearTimeout(timeout));node.disconnect();node.port.close();
  const expected=new Float32Array(1024);for(const [frame,value] of [[0,.25],[127,.5],[128,.75],[256,.125],[257,-.25]])expected[frame]=value;
  let difference=0;for(let c=0;c<2;c++)for(let i=0;i<1024;i++)difference=Math.max(difference,Math.abs(buffer.getChannelData(c)[i]-expected[i]));
  const late=acks.find(e=>e.id==='late'),order=acks.filter(e=>e.appliedFrame===127).map(e=>e.id).join(',');
  if(acks.some((event,index)=>event.order!==index)||difference!==0||late.appliedFrame!==256||late.lateByFrames!==255||order!=='beforeA,beforeB')throw new Error('Sample placement or acknowledgement mismatch');
  report.results.push({sampleRate,maxDifference:difference,acknowledgements:acks});$('report').textContent=JSON.stringify(report,null,2);
 }
 report.passed=true;$('status').textContent='2/2 AudioWorklet sample-clock checks passed.';
}catch(error){report.passed=false;report.error=error.message;$('status').textContent='FAILED · '+error.message;}
$('report').textContent=JSON.stringify(report,null,2);$('save').disabled=false;$('save').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='grove-contact-clock-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
