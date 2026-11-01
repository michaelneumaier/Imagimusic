import {restRecordVisual} from '../score/grove-rest.js';
/** Offline sampled picture. No interpolated physics; last frame is the exact ending. */
export function createRestReplayPicture(record,recipe,{fps=60}={}){
 if(!Number.isInteger(fps)||fps<1||fps>60)throw new Error('Invalid replay picture rate');
 const source=restRecordVisual(record,recipe),duration=source.frames/recipe.sampleRate,frames=[];
 for(let i=0;i<Math.ceil(duration*fps);i++)frames.push(source.visual(i/fps));
 frames.push(source.visual(duration));return {fps,duration,frames};
}
export function restReplayFrame(picture,time){
 if(!Number.isFinite(time)||time<0)throw new Error('Invalid replay time');
 return picture.frames[time>=picture.duration?picture.frames.length-1:Math.min(picture.frames.length-1,Math.floor(time*picture.fps))];
}
