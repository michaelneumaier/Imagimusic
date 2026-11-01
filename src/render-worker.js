import { validatePatch, renderSamples, renderTineSamples, encodeWav } from './model.js';
self.onmessage = event => {
  const { patch: raw, source = 'garden' } = event.data;
  const patch = validatePatch(raw);
  const samples = source === 'tine' ? renderTineSamples(patch, 22050) : renderSamples(patch, 22050);
  const buffer = encodeWav(samples, 22050);
  self.postMessage(buffer, [buffer]);
};
