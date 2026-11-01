import {createAudioRenderJob} from '../audio-render-job.js';
export const createGroveBankJob=(grove,sampleRate)=>createAudioRenderJob(new URL('./render-worker.js',import.meta.url),{grove,sampleRate});

export const createGroveStudyJob=(settings,sampleRate)=>createAudioRenderJob(new URL('./render-worker.js',import.meta.url),{...settings,sampleRate});
