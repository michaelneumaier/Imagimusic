import test from 'node:test';
import assert from 'node:assert/strict';
import {groveStrikeMarkers} from '../src/grove/strike-markers.js';
test('recorded strike cues select the latest location and reset without animation history',()=>{
 const strikes=[{body:0,age:.2,strikeU:.3},{body:0,age:.1,strikeU:1},{body:1,age:0},{body:2,age:-.1},{body:2,age:.3}];
 const cues=groveStrikeMarkers(strikes,3);assert.equal(cues[0].u,1);assert.equal(cues[1].u,.5);assert.equal(cues[2],null);assert.ok(cues[0].opacity<cues[1].opacity);assert.deepEqual(groveStrikeMarkers([],3),[null,null,null]);assert.deepEqual(groveStrikeMarkers(strikes,3),cues);
});

test('the remembered flag is carried through as a plain boolean and never invented', () => {
  const markers = groveStrikeMarkers([{ body: 0, age: 0.1, strikeU: 0.6, remembered: true }, { body: 1, age: 0.05, strikeU: 0.3 }, { body: 2, age: 0.2, strikeU: 0.5, remembered: 'yes' }], 3);
  assert.deepEqual(markers.map(m => m.remembered), [true, false, false]);
  assert.equal(markers[0].opacity, 0.8 * (1 - 0.1 / 0.3) ** 2, 'the remembered flag changes no timing or opacity');
});
