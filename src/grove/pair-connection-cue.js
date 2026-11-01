import {canonicalGrove} from '../score/grove.js';
import {mostChangedBridge} from '../score/grove-rest.js';
/** Fixed bodies and one shared voice make the per-edge coupling ratio the
 * physical stiffness ratio. Never apply a pair's cue to a third instrument. */
export function pairConnectionCue(pair,current){
 const original=canonicalGrove(pair.original),changed=canonicalGrove(pair.changed),identity=canonicalGrove(current);
 if(identity!==original&&identity!==changed)return null;
 const edge=mostChangedBridge(pair.changed,pair.original);if(!edge.changed)return null;
 const before=pair.original.bridges[edge.index],now=current.bridges[edge.index],ratio=now.coupling/before.coupling;
 const others=current.bridges.filter((e,i)=>i!==edge.index).map(e=>({a:e.a,b:e.b,ratio:e.coupling/pair.original.bridges.find(o=>o.a===e.a&&o.b===e.b).coupling}));
 return {a:edge.a,b:edge.b,ratio,others,label:`Focus: bodies ${edge.a+1} ↔ ${edge.b+1} · ${ratio.toFixed(2)}× Original stiffness.`};
}
