import {parseTouchRecord} from './record.js';
import {prepareTouchHistory} from './history.js';
self.onmessage=({data})=>{
 try{self.postMessage({result:prepareTouchHistory(data.text===undefined?data.record:parseTouchRecord(data.text).record,{hz:data.hz??60})});}
 catch(error){self.postMessage({error:error.message});}
};
