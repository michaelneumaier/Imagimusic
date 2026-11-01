// Bindings as data (proposal 004 §2): the only way a StateFrame moves the scene.
//
//   binding = { id, target, param, field, inputs: [patchPath...], map?: v => v, label?: 'physical'|'interpreted'|'interpreted-physical', note? }
//   resolveField(frame, 'voices[slot=3].modules.filter.aperture01')  -> value or undefined
//   applyBindings(frame, bindings, setParam)                           -> [{ id, target, param, value, missing }]
//   explainBinding(binding, frame, patch)                              -> { ...binding, value, raw, inputs: [{ path, value }] }
//
// Stateless by decision (Astra, 2026-11-01): no springs, so any frame can be sampled at any time (seeks, offline
// renders) and the result depends only on the frame. Smoothing, if ever wanted, is a later, separate layer.

const SEGMENT = /^([A-Za-z_$][\w$]*)((?:\[[^\]]+\])*)$/;

export function parsePath(path) {
  if (typeof path !== 'string' || !path.length) throw new Error('path must be a non-empty string.');
  return path.split('.').map(part => {
    const m = SEGMENT.exec(part);
    if (!m) throw new Error(`bad path segment '${part}' in '${path}'.`);
    const selectors = [...m[2].matchAll(/\[([^\]]+)\]/g)].map(s => {
      const inner = s[1];
      if (/^\d+$/.test(inner)) return { index: Number(inner) };
      const eq = inner.indexOf('=');
      if (eq < 0) throw new Error(`selector '[${inner}]' must be [n] or [key=value] in '${path}'.`);
      return { key: inner.slice(0, eq).trim(), value: inner.slice(eq + 1).trim() };
    });
    return { key: m[1], selectors };
  });
}

export function resolveField(root, path) {
  let node = root;
  for (const { key, selectors } of parsePath(path)) {
    if (node === null || typeof node !== 'object') return undefined;
    node = node[key];
    for (const sel of selectors) {
      if (!Array.isArray(node)) return undefined;
      node = 'index' in sel ? node[sel.index] : node.find(item => item && String(item[sel.key]) === sel.value);
      if (node === undefined) return undefined;
    }
  }
  return node;
}

export const BINDING_LABELS = ['physical', 'interpreted', 'interpreted-physical'];

export function validateBinding(b) {
  if (!b || typeof b !== 'object') throw new Error('binding must be an object.');
  for (const key of ['id', 'target', 'param', 'field']) if (typeof b[key] !== 'string' || !b[key].length) throw new Error(`binding.${key} must be a non-empty string.`);
  parsePath(b.field);
  if (!Array.isArray(b.inputs)) throw new Error(`binding ${b.id}: inputs must be an array of patch/voice paths.`);
  for (const p of b.inputs) if (typeof p !== 'string' || !p.length) throw new Error(`binding ${b.id}: inputs must be non-empty strings.`);
  if (b.map !== undefined && typeof b.map !== 'function') throw new Error(`binding ${b.id}: map must be a function.`);
  if (b.label !== undefined && !BINDING_LABELS.includes(b.label)) throw new Error(`binding ${b.id}: label must be one of ${BINDING_LABELS.join(', ')}.`);
  return { ...b, map: b.map ?? (v => v), label: b.label ?? 'interpreted' };
}

export function validateBindings(list) {
  const out = list.map(validateBinding), ids = new Set();
  for (const b of out) { if (ids.has(b.id)) throw new Error(`duplicate binding id '${b.id}'.`); ids.add(b.id); }
  return out;
}

/** Evaluate every binding against the frame and hand values to setParam(target, param, value). Missing fields are reported, not applied. */
export function applyBindings(frame, bindings, setParam) {
  if (typeof setParam !== 'function') throw new Error('setParam must be a function.');
  return bindings.map(b => {
    const raw = resolveField(frame, b.field);
    if (raw === undefined) return { id: b.id, target: b.target, param: b.param, value: null, missing: true };
    const value = (b.map ?? (v => v))(raw, frame);
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`binding ${b.id} produced a non-finite value.`);
    setParam(b.target, b.param, value);
    return { id: b.id, target: b.target, param: b.param, value, missing: false };
  });
}

/** Voices a binding speaks for: the voice its field selects, or, for projected fields (stage.*), the sounding voices of the target's family/slot. */
export function voicesForBinding(binding, frame) {
  if (binding.field.startsWith('voices')) { const v = resolveField(frame, binding.field.split('.')[0]); return v ? [v] : []; }
  const m = /^([a-z]+)\/slot(\d+)/.exec(binding.target); if (!m || !Array.isArray(frame.voices)) return [];
  const family = m[1], slot = Number(m[2]);
  return frame.voices.filter(v => v.family === family && v.slot === slot && v.age >= 0);
}

/** The "why did this move?" answer: the chain part -> binding -> state field -> inputs, with live values.
 *  `voice.*` inputs resolve against the binding's voices: one value, or a de-duplicated list when several voices share the slot. */
export function explainBinding(binding, frame, patch = {}) {
  const raw = resolveField(frame, binding.field);
  const value = raw === undefined ? null : (binding.map ?? (v => v))(raw, frame);
  const voices = voicesForBinding(binding, frame);
  const inputs = binding.inputs.map(path => {
    if (!path.startsWith('voice.')) return { path, value: resolveField(patch, path) };
    const values = [...new Set(voices.map(v => resolveField(v, path.slice(6))).filter(x => x !== undefined))];
    return { path, value: values.length === 0 ? undefined : values.length === 1 ? values[0] : values };
  });
  return { id: binding.id, target: binding.target, param: binding.param, field: binding.field, label: binding.label ?? 'interpreted', note: binding.note ?? null, raw: raw ?? null, value, inputs, voices: voices.map(v => v.id) };
}
