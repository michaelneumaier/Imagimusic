import {createGroveMoviePlan} from './movie-plan.js';
self.onmessage=({data})=>{try{const plan=createGroveMoviePlan(data.recording,data.camera);self.postMessage({manifest:plan.manifest,times:plan.times,frames:plan.times.map(time=>plan.sample(time))});}catch(error){self.postMessage({error:error.message});}};
