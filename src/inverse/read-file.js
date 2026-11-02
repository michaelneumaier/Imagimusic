export const INVERSE_IMPORT_MAX_BYTES=16*1024;
const check=signal=>{if(signal?.aborted)throw new DOMException('Opening cancelled.','AbortError');};
/** Selected local bytes only. Record/model validation belongs in the disposable preparation worker. */
export async function readInverseFile(file,{signal}={}){
 check(signal);
 if(!file||typeof file.arrayBuffer!=='function'||typeof file.name!=='string')throw new Error('Choose a saved inverse instrument.');
 if(!Number.isSafeInteger(file.size)||file.size<1||file.size>INVERSE_IMPORT_MAX_BYTES)throw new Error('Choose an instrument JSON file no larger than 16 KiB.');
 const bytes=await file.arrayBuffer();check(signal);
 if(!(bytes instanceof ArrayBuffer)||bytes.byteLength!==file.size)throw new Error('The file size changed while reading.');
 let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('The instrument file must contain UTF-8 JSON.');}
 return {name:file.name.slice(0,200),text};
}
