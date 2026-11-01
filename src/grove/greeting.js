import {composeGroveGreeting,greetingStrikes,greetingDuration,greetingBeatSeconds} from '../score/grove.js';
import {composeGroveVoiceGreeting,voiceGreetingStrikes,voiceGreetingDuration,voiceGreetingBeatSeconds} from '../score/grove-voice.js';
/** Adapt either authored recipe to the page's common audio-clock timeline. */
export function createGroveGreetingPlan(grove,voice=null){
 const recipe=voice?composeGroveVoiceGreeting(grove,voice):composeGroveGreeting(grove);
 const seconds=voice?voiceGreetingBeatSeconds:greetingBeatSeconds;
 return {events:(voice?voiceGreetingStrikes:greetingStrikes)(recipe),duration:(voice?voiceGreetingDuration:greetingDuration)(recipe,grove),sections:recipe.sections.map(section=>({id:section.id,start:seconds(recipe,section.beats[0]),end:seconds(recipe,section.beats[1])}))};
}
export function groveGreetingFrames(plan,sampleRate){return plan.events.map(({time,...event})=>({...event,frame:Math.round(time*sampleRate)}));}
