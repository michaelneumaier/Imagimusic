import {createLivingScene} from './scene.js';
const canvas=document.getElementById('instrument'),status=document.getElementById('scene-status'),buttons=[...document.querySelectorAll('[data-view]')];
let world=null;
try{
 world=createLivingScene(canvas);status.textContent='80 × 10 × 1 mm · still geometry · drag to look around';
 for(const button of buttons)button.addEventListener('click',()=>{world.view(button.dataset.view);for(const b of buttons)b.setAttribute('aria-pressed',String(b===button));status.textContent=button.textContent+' · still geometry';});
}catch(error){status.textContent='The 3D view could not open. The sound sketch and scene boards are available below.';for(const b of buttons)b.disabled=true;console.error(error);}
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();status.textContent='The 3D view was interrupted. Reload to restore it; the sound sketch remains available.';for(const b of buttons)b.disabled=true;world?.dispose();world=null;});
