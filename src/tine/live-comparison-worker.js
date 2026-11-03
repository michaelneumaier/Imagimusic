import {renderTineLiveComparison} from './live-comparison.js';
self.onmessage=({data})=>{try{const pcm=renderTineLiveComparison(data.source,data.dimensions);self.postMessage({pcm},[pcm.original.channels[0].buffer,pcm.candidate.channels[0].buffer]);}catch(error){self.postMessage({error:error.message});}};
