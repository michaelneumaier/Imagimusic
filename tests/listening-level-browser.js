import {createListeningLevel,listeningCeilingCurve} from '../src/grove/listening-level.js';
let report=null;
const result=document.getElementById('result'),run=document.getElementById('run'),save=document.getElementById('save');
function shaped(value,curve){const index=(Math.max(-1,Math.min(1,value))+1)*(curve.length-1)/2,lower=Math.floor(index),upper=Math.min(curve.length-1,lower+1);return curve[lower]+(curve[upper]-curve[lower])*(index-lower);}
run.onclick=async()=>{
 run.disabled=true;save.disabled=true;report=null;result.textContent='Checking the offline audio graph…';
 try{
  const cases=[],curve=listeningCeilingCurve(),levels=[-1,-.2,-.05,-.001,0,.001,.05,.2,1],length=levels.length*256;
  for(const db of [0,20]){
   const context=new OfflineAudioContext(2,length,48000),source=context.createBufferSource(),buffer=context.createBuffer(2,length,48000);
   for(let ch=0;ch<2;ch++)for(let frame=0;frame<length;frame++)buffer.getChannelData(ch)[frame]=levels[Math.floor(frame/256)]*(ch===0?1:-1);
   source.buffer=buffer;const stage=createListeningLevel(context,{db});source.connect(stage.input);stage.output.connect(context.destination);source.start();
   const rendered=await context.startRendering();let maxError=0,peak=0;
   for(let ch=0;ch<2;ch++)for(let frame=0;frame<length;frame++){const actual=rendered.getChannelData(ch)[frame],expected=shaped(Math.fround(buffer.getChannelData(ch)[frame]*10**(db/20)),curve);maxError=Math.max(maxError,Math.abs(actual-expected));peak=Math.max(peak,Math.abs(actual));}
   stage.dispose();source.disconnect();
   if(maxError>2e-6||peak>.950001)throw new Error('Unexpected graph output at '+db+' dB: error '+maxError+', peak '+peak);
   cases.push({db,frames:length,sampleRate:48000,maxError,peak});
  }
  report={kind:'imagimusic-listening-graph-check',version:1,cases,passed:true,limits:'Offline graph comparison only. No device loudness, comfort, true-peak, or realtime-performance claim.'};
  result.textContent=JSON.stringify(report,null,2);save.disabled=false;
 }catch(error){result.textContent='Failed: '+error.message;}finally{run.disabled=false;}
};
save.onclick=()=>{if(!report)return;const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='imagimusic-listening-graph.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);};
