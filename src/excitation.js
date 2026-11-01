// Performance gestures on the same seconds timeline as audio.
export const ATTACK_SECONDS = 0.004;
export const DECAY_TAUS = 9;
export const APPROACH_SECONDS = 0.18;
export const RECOVERY_SECONDS = 0.28; // Deliberately slower recovery makes quick live contacts readable.
export const LIVE_APPROACH_SECONDS = 0.025;
export const clamp01 = value => Math.max(0, Math.min(1, value));

/** Interpreted garden basis. Geometry voices supply their actual mode shapes. */
export function excitationWeight(modeIndex, position, velocity, shape) {
  const spatial = Math.abs(shape ? shape(clamp01(position)) : Math.sin((modeIndex + 1) * Math.PI * clamp01(position)));
  const hardness = (0.28 + 0.72 * clamp01(velocity)) ** (modeIndex * 0.45);
  return spatial * hardness;
}

/** A planned approach reaches contact exactly at the audible onset. */
export function strikerPose(time, contactTime, approach = APPROACH_SECONDS) {
  const age = time - contactTime;
  if (age < -approach || age > RECOVERY_SECONDS) return { visible: false, reach: 0, contact: 0 };
  const reach = age < 0 ? ((age + approach) / approach) ** 2 : (1 - clamp01(age / RECOVERY_SECONDS)) ** 2;
  return { visible: true, reach, contact: Math.max(0, 1 - Math.abs(age) / 0.035) };
}

/** Fade metadata is shared by live sound and the visible modal envelopes. */
export function releaseLevel(voice, time) {
  if (voice.fadeAt === undefined) return 1;
  return clamp01(1 - (time - voice.fadeAt) / voice.fadeDuration) * (voice.fadeFrom ?? 1);
}
