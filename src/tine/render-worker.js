import {renderTineImpulse} from './render.js';
self.onmessage=({data})=>{try{const render=renderTineImpulse(data.geometry,data.options);self.postMessage({result:render},render.channels.map(channel=>channel.buffer));}catch(error){self.postMessage({error:error.message});}};
