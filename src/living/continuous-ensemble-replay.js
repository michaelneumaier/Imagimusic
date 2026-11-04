import {setupContinuousReturnReplay} from './continuous-return-replay.js';
import {createAudioRenderJob} from '../audio-render-job.js';
import {createTineStudyPlayer} from '../tine/study-player.js';
import {createContinuousEnsembleListeningStage} from './continuous-ensemble-session.js';
import {CONTINUOUS_ENSEMBLE_RECORD_LIMIT} from './continuous-ensemble-record.js';
const format={audioKind:'imagimusic-continuous-ensemble-audio',limit:CONTINUOUS_ENSEMBLE_RECORD_LIMIT,limitLabel:'1,537 KiB',
 validRecord:(record,rate,frames)=>record?.kind==='imagimusic-continuous-ensemble-record'&&record.version===1&&record.mixGain===1/3&&Array.isArray(record.records)&&record.records.length===3&&record.records.every(body=>body?.kind==='imagimusic-continuous-tine-record'&&body.version===1&&body.sampleRate===rate&&body.fadeStart+Math.round(.025*rate)===frames&&Array.isArray(body.events)&&body.events.length<=4096),
 notes:record=>record.records.reduce((sum,body)=>sum+body.events.length,0),
};
export function setupContinuousEnsembleReplay(options){
 return setupContinuousReturnReplay({createPlayer:settings=>createTineStudyPlayer({...settings,createStage:createContinuousEnsembleListeningStage}),createJob:text=>createAudioRenderJob(new URL('./continuous-ensemble-audio-worker.js',import.meta.url),text),...options,format});
}
