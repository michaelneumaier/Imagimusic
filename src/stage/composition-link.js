import {DEFAULT_COMPOSITION,validateComposition} from './composition.js';

/** A local/shareable URL carries arrangement data, independently of the instrument patch. */
export function readCompositionSearch(search){
 const query=new URLSearchParams(search),settings=query.get('loomSettings');
 let decoded;
 try{decoded=settings===null?DEFAULT_COMPOSITION.loom.settings:JSON.parse(settings);}
 catch{throw new Error('Invalid Loom settings in this link');}
 if(!decoded||typeof decoded!=='object'||Array.isArray(decoded))throw new Error('Invalid Loom settings in this link');
 return validateComposition({version:1,loom:{enabled:query.get('loom')==='1',settings:decoded}});
}
export function compositionURL(base,composition){
 const saved=validateComposition(composition),url=new URL(base);
 if(saved.loom.enabled)url.searchParams.set('loom','1');else url.searchParams.delete('loom');
 url.searchParams.set('loomSettings',JSON.stringify(saved.loom.settings));
 return url.href;
}
