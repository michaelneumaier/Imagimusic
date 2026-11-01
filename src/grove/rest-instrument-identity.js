import {composeGrove,canonicalGrove,GROVE_SEEDS} from '../score/grove.js';
import {canonicalVoiceConfig,DEFAULT_VOICE_CONFIG} from '../score/grove-voice.js';
/** A seed identifies a generator input, not every saved structure carrying it. */
export function restInstrumentIdentity(record){
 const generated=canonicalGrove(record.grove)===canonicalGrove(composeGrove({seed:record.grove.seed}));
 const defaultVoice=canonicalVoiceConfig(record.voice)===canonicalVoiceConfig(DEFAULT_VOICE_CONFIG);
 return {generated,defaultVoice,canOpenCurated:generated&&defaultVoice&&GROVE_SEEDS.includes(record.grove.seed),label:generated?`GROVE ${record.grove.seed}`:`CHANGED STRUCTURE · SEED ${record.grove.seed}`};
}
