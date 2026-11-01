# Astra active claims

M1 implementation committed as 610b549. Geometry module is Fable-owned; integration in model/audio/scene/main is Astra-owned.
M2 active: src/bellows-audio.js, src/bellows-scene.js, model.js v4 integration, main.js/index.html/style.css Bellows UI, tests/bellows-audio.test.js, README.md.
Fable owns src/dynamics.js + tests/dynamics.test.js; implement against approved Bellows scheduling contract in mailbox. Fable maintains docs and geometry.
Astra polls inbox at each work checkpoint under an active ongoing goal; sends/acks are in collab/.
