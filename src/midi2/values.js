// MIDI 2.0 numeric boundary, independent of transport and voice allocation.
// M2-104-UM v1.1.2 §§7.4.2, 7.4.12–15. Raw integers remain in source data;
// these derived doubles are for instrument evaluation, never wire re-encoding.
export const UINT16_MAX = 0xffff;
export const UINT32_MAX = 0xffffffff;
export const BEND_CENTER = 0x80000000;

function unsigned(value, max, name) {
  if (!Number.isInteger(value) || value < 0 || value > max) {
    throw new RangeError(`${name} must be an unsigned integer in [0, ${max}]`);
  }
  return value;
}

// Linear instrument mappings, not MIDI-prescribed loudness/response curves.
// In MIDI 2.0 zero velocity does NOT change a Note On into a Note Off.
export const velocity16ToUnit = value => unsigned(value, UINT16_MAX, 'velocity16') / UINT16_MAX;
export const controller32ToUnit = value => unsigned(value, UINT32_MAX, 'controller32') / UINT32_MAX;

// HCU = 100-cent unit, with 69 corresponding to A440 for absolute pitch.
// Arithmetic division avoids JavaScript's signed 32-bit bitwise conversion.
export const pitch725ToHcu = value => unsigned(value, UINT32_MAX, 'pitch7.25') / 2 ** 25;
export const pitch79ToHcu = value => unsigned(value, UINT16_MAX, 'pitch7.9') / 2 ** 9;

// RPN 0/0 differs from per-note RPN 0/7: top 7 bits HCUs, next 7 cents,
// bottom 18 ignored (UMP v1.1.2 §7.4.7.1). Reject out-of-domain cents;
// callers report an unsupported value rather than silently wrapping/clamping.
export function channelBendSensitivityToHcu(value){
 unsigned(value,UINT32_MAX,'channel bend sensitivity');
 const semitones=Math.floor(value/2**25),cents=Math.floor(value/2**18)%128;
 if(cents>99)throw new RangeError('Channel bend sensitivity cents must be in [0, 99]');
 return semitones+cents/100;
}

// CC64 keeps MIDI's switch semantics. Default 32->7 translation discards
// the low 25 bits (§D.1.4); MIDI1 64..127 maps exactly to this upper half.
export const sustain32IsOn=value=>unsigned(value,UINT32_MAX,'sustain32')>=BEND_CENTER;

export function hcuToHz(hcu) {
  if (!Number.isFinite(hcu) || hcu < 0 || hcu >= 128) {
    throw new RangeError('absolute HCU pitch must be finite and in [0, 128)');
  }
  return 440 * 2 ** ((hcu - 69) / 12);
}

// Our receiver uses the full equal up/down sensitivity range. The unsigned
// bipolar halves have different counts, so scale each half to its endpoint.
// sensitivity725 is RPN bank 0/index 7, not channel pitch-bend sensitivity.
export function perNoteBendToHcu(value, sensitivity725) {
  unsigned(value, UINT32_MAX, 'perNoteBend');
  const range = pitch725ToHcu(sensitivity725);
  const delta = value - BEND_CENTER;
  return delta / (delta < 0 ? BEND_CENTER : UINT32_MAX - BEND_CENTER) * range;
}
