import { validatePatch, renderSamples, encodeWav } from './model.js';
self.onmessage = event => {
  const patch = validatePatch(event.data);
  const buffer = encodeWav(renderSamples(patch, 22050), 22050);
  self.postMessage(buffer, [buffer]);
};
