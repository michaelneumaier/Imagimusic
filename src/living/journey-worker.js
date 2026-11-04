import {renderLivingJourneyArtifact} from './journey-artifact.js';
self.onmessage=async({data})=>{
 try{const pcm=await renderLivingJourneyArtifact(data);self.postMessage({pcm},[pcm.wav]);}
 catch(error){self.postMessage({error:error.message});}
};
