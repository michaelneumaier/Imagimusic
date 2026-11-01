import {forceRotation} from '../rest/powered-engine.js';
import {createGroveRestRecipe} from '../score/grove-rest.js';
import {createPoweredRecipe,poweredAmplitudeLimit} from '../score/grove-powered.js';
/** The first encounter has two c=1 contact zones and one fixed source.
 * All operator construction stays outside the audio callback. */
self.onmessage=({data})=>{
 try{
  const base=createGroveRestRecipe(data.grove,data.voice,{sampleRate:data.sampleRate,zones:[.3,1],strengths:{c1:1}});
  const recipe=createPoweredRecipe(base,{body:0,position:1}),sr=recipe.sampleRate;
  const driver={body:0,position:1,startFrame:0,frequencyHz:recipe.grove.bodies[0].hz,forcedFrames:Math.round(2*sr)};
  driver.rotation=forceRotation(driver.frequencyHz,sr);
  driver.amplitude=poweredAmplitudeLimit(recipe,driver);
  const quietFrame=Math.round(5*sr),fadeFrames=Math.round(.025*sr);
  self.postMessage({recipe,driver,releaseFrame:driver.forcedFrames,quietFrame,fadeFrames,totalFrames:quietFrame+fadeFrames});
 }catch(error){self.postMessage({error:error.message});}
};
