import {renderLivingJourneyArtifact} from './journey-artifact.js';
import {renderLivingPersonalJourneyArtifact} from './personal-journey-artifact.js';
self.onmessage=async({data})=>{
 try{const render=data?.kind==='imagimusic-living-personal-journey-request'?renderLivingPersonalJourneyArtifact:renderLivingJourneyArtifact;const pcm=await render(data);self.postMessage({pcm},[pcm.wav]);}
 catch(error){self.postMessage({error:error.message});}
};
