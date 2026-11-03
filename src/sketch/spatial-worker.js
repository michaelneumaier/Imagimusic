import {createSpatialSketch} from './spatial.js';
self.onmessage=({data})=>{try{const spatial=createSpatialSketch(data.parameters),render=spatial.render(data.options);self.postMessage({result:{render,weights:spatial.weights(render.activation,render.pickup)}},render.channels.map(channel=>channel.buffer));}catch(error){self.postMessage({error:error.message});}};
