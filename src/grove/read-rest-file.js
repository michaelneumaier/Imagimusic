export const REST_IMPORT_MAX_BYTES=256*1024;
const check=signal=>{if(signal?.aborted)throw new DOMException('Opening cancelled.','AbortError');};
/** Read only the selected local bytes. Model parsing and reconstruction happen in a cancellable worker. */
export async function readRestFile(file,{signal}={}){
 check(signal);
 if(!file||typeof file.arrayBuffer!=='function'||typeof file.name!=='string')throw new Error('Choose a saved Rest gesture file.');
 if(!Number.isSafeInteger(file.size)||file.size<1||file.size>REST_IMPORT_MAX_BYTES)throw new Error('Choose a gesture JSON file no larger than 256 KiB.');
 const bytes=await file.arrayBuffer();check(signal);
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==file.size)throw new Error('The file size changed while reading.');
 let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('The gesture file must contain UTF-8 JSON.');}
 return {name:file.name.slice(0,200),text};
}
