import {composeLoomJourney,loomScoreFrom,beatSeconds,journeyDuration} from '../score/loom-journey.js';
const descriptions=[
 ['close-kin','Close kin','Matched bodies, a gentle connection. Stay with the slow movement from one side to the other.'],
 ['distant-cousins','A little distance','One body is tuned a little higher. The same gestures meet a different response.'],
 ['tight-weave','Tight weave','A stronger connection and a shorter ring. Listen for the quicker exchange between the bodies.'],
];
/** Presentation text is separate from Fable’s authored score and the physical model. */
export function getLoomJourney(id){
 const text=descriptions.find(item=>item[0]===id);if(!text)throw new Error('Unknown listening study.');
 const journey=composeLoomJourney({setting:id});
 return {id,title:text[1],description:text[2],settings:journey.settings,score:loomScoreFrom(journey),chapters:[
  {time:0,title:'Before the gesture',description:'A little space before the first touch.'},
  {time:journey.lead,title:'One gesture',description:'Only the left body is struck. The connection lets both respond.'},
  {time:beatSeconds(journey,6),title:'Room for an answer',description:'Listen for the first strike on the right.'},
  {time:beatSeconds(journey,12),title:'Intertwining',description:'The gestures draw closer. Earlier vibrations are still here.'},
  {time:beatSeconds(journey,20),title:'Letting go',description:'No more strikes. Stay with what remains.'},
  {time:journeyDuration(journey),title:'After the sound',description:'There is no hurry to begin again.'},
 ]};
}
export const LOOM_JOURNEYS=descriptions.map(([id])=>getLoomJourney(id));
