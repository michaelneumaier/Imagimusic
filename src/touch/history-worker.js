import {prepareTouchHistory} from './history.js';
self.onmessage=({data})=>{
 try{self.postMessage({result:prepareTouchHistory(data.record,{hz:data.hz??60})});}
 catch(error){self.postMessage({error:error.message});}
};
