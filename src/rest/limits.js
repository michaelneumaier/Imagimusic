// Record and audio-thread limits shared by the Rest record layer, the worklet and the host. No imports, so any thread can load it.
export const REST_MAX_EVENTS = 128;        // admitted strikes per passage
export const REST_MAX_CONTACTS = 256;      // recorded (non-zero-length) rests per passage; the worklet counts accepted contact starts, which is conservative
export const REST_MAX_SECONDS = 120;       // passage length from the record origin (first accepted gesture); the worklet schedules its own Quiet there
export const REST_QUIET_FADE_SECONDS = 0.025;
