// A portable passage: a kept anatomy and the visitor's phrase made on it, in one file. The phrase's anatomySha256 is a declared origin and a
// compatibility check, not an authenticity proof (anyone with the file can recompute it). Originals only: a passage always embeds the
// anatomy the phrase was captured on, even if it was last replayed elsewhere; nothing records how the visitor stopped; no audio, gain, Quiet
// or view state. Reopening recomputes the anatomy's fit; nothing in the file can assert it.
import { validateInverseCandidate, reopenInverseCandidate } from './grove-inverse-kept.js';
import { validateInversePhrase, inverseAnatomySha256 } from './grove-inverse-phrase.js';
import { sha256Hex } from './grove-ensemble-derived.js';

export const INVERSE_PASSAGE_KIND = 'imagimusic-inverse-passage';
export const INVERSE_PASSAGE_VERSION = 1;
export const INVERSE_PASSAGE_TITLE_MAX = 80;

const fail = m => { throw new Error(`Inverse passage: ${m}`); };
const isoTime = v => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString() === v;
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
const deepFreeze = v => { if (v && typeof v === 'object') { for (const k of Object.keys(v)) deepFreeze(v[k]); Object.freeze(v); } return v; };
const copy = v => JSON.parse(JSON.stringify(v));

/** Synchronous shape checks on an object as given: exactly kind, version, anatomy (a valid kept candidate), phrase (a valid visitor phrase), kept. */
function checkShape(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) fail('must be an object.');
  const keys = Object.keys(r).sort().join();
  if (keys !== ['kind', 'version', 'anatomy', 'phrase', 'kept'].sort().join()) fail(`must have exactly the fields anatomy, kept, kind, phrase, version (got ${keys || 'none'}).`);
  if (r.kind !== INVERSE_PASSAGE_KIND || r.version !== INVERSE_PASSAGE_VERSION) fail(`kind must be ${INVERSE_PASSAGE_KIND} v${INVERSE_PASSAGE_VERSION}.`);
  validateInverseCandidate(r.anatomy);
  validateInversePhrase(r.phrase);
  const keptKeys = Object.keys(r.kept ?? {}).sort().join();
  if (keptKeys !== 'at' && keptKeys !== 'at,title') fail('kept must have at, and optionally title.');
  if (!isoTime(r.kept.at)) fail('kept.at must be an ISO-8601 UTC time of the form YYYY-MM-DDTHH:MM:SS.sssZ.');
  if ('title' in r.kept && (typeof r.kept.title !== 'string' || !r.kept.title.length || r.kept.title.length > INVERSE_PASSAGE_TITLE_MAX)) fail(`kept.title must be 1..${INVERSE_PASSAGE_TITLE_MAX} characters.`);
  return r;
}

/** Shape and binding. The given object is checked synchronously, then a frozen snapshot copy is taken BEFORE the first await (Astra's review:
 * a caller could otherwise mutate the object across the hash), the binding is checked on the snapshot, and the snapshot is returned. */
export async function validateInversePassage(input) {
  checkShape(input);                                     // before any copy, so NaN, Infinity or undefined extras cannot be laundered
  const snapshot = deepFreeze(checkShape(copy(input)));  // the only object the rest of this function and its callers look at
  const digest = await inverseAnatomySha256(snapshot.anatomy.grove);
  if (digest !== snapshot.phrase.anatomySha256) fail('the phrase declares a different anatomy than the one embedded; a passage keeps a phrase only with the anatomy it was captured on.');
  return snapshot;
}

/** Keep the retained original kept-candidate record with the phrase made on it (even if the phrase was last replayed on another anatomy). */
export async function keepInversePassage(anatomyRecord, phrase, { at, title } = {}) {
  if (!isoTime(at)) fail('kept.at must be an ISO-8601 UTC time of the form YYYY-MM-DDTHH:MM:SS.sssZ.');
  const kept = { at };
  if (title !== undefined) { if (typeof title !== 'string' || !title.length || title.length > INVERSE_PASSAGE_TITLE_MAX) fail(`kept.title must be 1..${INVERSE_PASSAGE_TITLE_MAX} characters.`); kept.title = title; }
  validateInverseCandidate(anatomyRecord); validateInversePhrase(phrase);           // validate the given objects before any copy can hide a NaN or an undefined
  const record = { kind: INVERSE_PASSAGE_KIND, version: INVERSE_PASSAGE_VERSION, anatomy: copy(anatomyRecord), phrase: copy(phrase), kept };
  return validateInversePassage(record);                 // returns the frozen snapshot
}

export async function canonicalInversePassage(record) { const snapshot = await validateInversePassage(record); return JSON.stringify(sortKeys(snapshot)); }
export async function inversePassageSha256(record) { return sha256Hex(await canonicalInversePassage(record)); }

/** Validate, then recompute the anatomy's fit through reopenInverseCandidate. Returns frozen { record, candidate, bound, phrase } or throws, so a
 * page replaces nothing until it has a result. */
export async function reopenInversePassage(input) {
  const record = await validateInversePassage(input);   // a frozen snapshot taken before the await
  const opened = reopenInverseCandidate(record.anatomy);
  return deepFreeze({ record, candidate: opened.candidate, bound: opened.bound, phrase: record.phrase });
}
