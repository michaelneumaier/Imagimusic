import {validateNoteList} from './smf.js';

/** Source facts only. Instrument assignment and fidelity belong to mapping.js. */
export function summarizeMidi(notes) {
  validateNoteList(notes);
  const groups = new Map();
  for (const note of notes.notes) {
    const key = `${note.track}:${note.channel}`;
    let group = groups.get(key);
    if (!group) {
      group = {track: note.track, channel: note.channel, name: notes.tracks[note.track].name,
        count: 0, low: note.pitch, high: note.pitch, first: note.onSeconds, last: note.offSeconds};
      groups.set(key, group);
    }
    group.count++;
    group.low = Math.min(group.low, note.pitch); group.high = Math.max(group.high, note.pitch);
    group.first = Math.min(group.first, note.onSeconds); group.last = Math.max(group.last, note.offSeconds);
  }
  const ignored = [];
  for (const [kind, value] of Object.entries(notes.ignored)) {
    if (typeof value === 'number') { if (value) ignored.push({kind, count: value}); }
    else for (const [number, count] of Object.entries(value)) if (count) ignored.push({kind: `${kind} ${number}`, count});
  }
  return {groups: [...groups.values()].sort((a,b) => a.track-b.track || a.channel-b.channel), ignored};
}

export function midiPitchLabel(pitch) {
  if (!Number.isInteger(pitch) || pitch < 0 || pitch > 127) throw new RangeError('MIDI pitch must be 0–127.');
  return `${['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][pitch % 12]}${Math.floor(pitch / 12)-1} (${pitch})`;
}

// A quarter-note triad followed by a short breath, 96 PPQ, default 120 BPM.
// This is ordinary MIDI 1.0 SMF data, not a MIDI 2.0 fixture.
export function exampleMidiBytes() {
  const track = [0,0xc0,0,0,0x90,60,90,0,0x90,64,75,0,0x90,67,82,
    96,0x80,60,0,0,0x80,64,0,0,0x80,67,0,48,0xff,0x2f,0];
  return Uint8Array.from([77,84,104,100,0,0,0,6,0,0,0,1,0,96,
    77,84,114,107,0,0,0,track.length,...track]);
}
