import {prepareTouchHistoryComparison} from './history-comparison.js';
self.onmessage=({data})=>{
 try{self.postMessage({result:prepareTouchHistoryComparison(data.record,data.targetId)});}
 catch(error){self.postMessage({error:error.message});}
};
