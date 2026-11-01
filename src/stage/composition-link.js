import {DEFAULT_COMPOSITION,validateComposition} from './composition.js';
import {readTensionerSearch,tensionerURL} from '../tensioner/patch.js';

/** A local/shareable URL carries arrangement data, independently of the instrument patch. */
export function readCompositionSearch(search){
 const query=new URLSearchParams(search),settings=query.get('loomSettings');
 let decoded;
 try{decoded=settings===null?DEFAULT_COMPOSITION.loom.settings:JSON.parse(settings);}
 catch{throw new Error('Invalid Loom settings in this link');}
 if(!decoded||typeof decoded!=='object'||Array.isArray(decoded))throw new Error('Invalid Loom settings in this link');
 const saved={version:1,loom:{enabled:query.get('loom')==='1',settings:decoded}};
 if(query.has('fm')||query.has('fmEnabled')){
  saved.version=2;saved.fm={enabled:query.get('fmEnabled')==='1',settings:readTensionerSearch(search).settings};
 }
 return validateComposition(saved);
}
export function compositionURL(base,composition){
 const saved=validateComposition(composition),url=new URL(base);
 if(saved.loom.enabled)url.searchParams.set('loom','1');else url.searchParams.delete('loom');
 url.searchParams.set('loomSettings',JSON.stringify(saved.loom.settings));
 if(saved.fm){
  if(saved.fm.enabled)url.searchParams.set('fmEnabled','1');else url.searchParams.delete('fmEnabled');
  return tensionerURL(url,saved.fm.settings);
 }
 url.searchParams.delete('fmEnabled');url.searchParams.delete('fm');
 return url.href;
}
