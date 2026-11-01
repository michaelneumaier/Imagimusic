export const CAMERA_MODES=Object.freeze(['manual','establish','follow','detail','cinematic']);

export function readCameraSearch(search){
 const mode=new URLSearchParams(search).get('camera')??'manual';
 if(!CAMERA_MODES.includes(mode))throw new Error('Unknown camera mode in this link');
 return mode;
}

/** Persist direction only; free-orbit pose remains local to the current scene. */
export function cameraURL(base,mode){
 if(!CAMERA_MODES.includes(mode))throw new Error('Unknown camera mode');
 const url=new URL(base);
 if(mode==='manual')url.searchParams.delete('camera');else url.searchParams.set('camera',mode);
 return url.href;
}
