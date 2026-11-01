import {createAudioRenderJob} from '../audio-render-job.js';
export function createTensionerRenderJob(input,options){return createAudioRenderJob(new URL('./render-worker.js',import.meta.url),input,options);}
