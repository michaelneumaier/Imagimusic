/** Offline artistic reflections. These delays do not simulate the drawn room. */
export const LIVING_SPACES=Object.freeze([
 {id:'dry',name:'The body alone',cutoffHz:6000,taps:[]},
 {id:'close',name:'A little air',cutoffHz:6000,taps:[[.017,.12,false],[.029,.09,true],[.043,.065,false],[.061,.045,true]]},
 {id:'wide',name:'A wider place',cutoffHz:2300,taps:[[.067,.16,true],[.113,.14,false],[.181,.12,true],[.269,.105,false],[.389,.09,true],[.521,.075,false],[.683,.06,true],[.863,.05,false],[1.061,.04,true],[1.283,.03,false],[1.531,.02,true],[1.807,.012,false]]},
].map(s=>Object.freeze({...s,taps:Object.freeze(s.taps.map(t=>Object.freeze(t)))})));
export function renderLivingSpace(pcm,id){
 const treatment=LIVING_SPACES.find(s=>s.id===id);
 if(!treatment)throw Error('Unknown sound-space treatment.');
 const {sampleRate,channels}=pcm;
 if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>96000||!Array.isArray(channels)||channels.length!==2||!channels.every(c=>c instanceof Float32Array&&c.length===channels[0].length)||!channels[0].length)throw Error('Use a finite stereo source at 8–96 kHz.');
 if(channels[0].length>sampleRate*32)throw Error('The sound-space study is limited to 32 seconds.');
 for(const c of channels)for(const v of c)if(!Number.isFinite(v)||Math.abs(v)>1)throw Error('Invalid source sample.');
 const sourceFrames=channels[0].length,tailFrames=Math.round(2*sampleRate),frames=sourceFrames+tailFrames;
 const sum=channels.map(c=>{const out=new Float64Array(frames);out.set(c);return out;});
 const alpha=1-Math.exp(-2*Math.PI*treatment.cutoffHz/sampleRate),filterFrames=sourceFrames+Math.round(.05*sampleRate);
 const filtered=channels.map(c=>{const out=new Float64Array(filterFrames);let state=0;for(let i=0;i<out.length;i++){state+=alpha*((c[i]??0)-state);out[i]=state;}return out;});
 for(const [seconds,gain,cross] of treatment.taps){const delay=Math.round(seconds*sampleRate);for(let ch=0;ch<2;ch++){const wet=filtered[cross?1-ch:ch];for(let i=0;i<wet.length&&i+delay<frames;i++)sum[ch][i+delay]+=gain*wet[i];}}
 // Complete the finite study at a shared length; the final50ms fade affects only
 // the added tail, never any direct source sample. Earlier echoes are unaltered.
 const fade=Math.round(.05*sampleRate);for(const c of sum)for(let i=0;i<fade;i++)c[frames-fade+i]*=(fade-1-i)/(fade-1);
 const output=sum.map(c=>Float32Array.from(c));let peak=0;
 for(const c of output)for(const v of c)peak=Math.max(peak,Math.abs(v));
 if(peak>1||!Number.isFinite(peak))throw Error('Treatment exceeds source headroom; no normalization applied.');
 return {sampleRate,channels:output,frames,sourceFrames,seconds:frames/sampleRate,peak,treatment};
}
