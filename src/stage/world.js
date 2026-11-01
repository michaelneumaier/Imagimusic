import * as T from '../../vendor/three/build/three.module.js';
import { OrbitControls } from '../../vendor/three/examples/jsm/controls/OrbitControls.js';
import { gardenBody, choirBody, tineBody, mesh, palette } from './bodies.js';

/** Scene construction only. Musical motion is applied through frame bindings. */
export function createWorld(canvas, fixedSize = null) {
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:!!fixedSize});
  renderer.setPixelRatio(fixedSize ? 1 : Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const scene=new T.Scene();scene.background=new T.Color(0x101c20);scene.fog=new T.FogExp2(0x101c20,.026);
  const camera=new T.PerspectiveCamera(42,1,.1,100);camera.position.set(9,6.5,12);
  const controls=new OrbitControls(camera,canvas);controls.target.set(0,1,0);controls.enableDamping=false;controls.minDistance=5;controls.maxDistance=28;controls.maxPolarAngle=Math.PI*.48;controls.update();
  scene.add(new T.HemisphereLight(0xd5e9dc,0x192119,2.2));
  const key=new T.DirectionalLight(0xffe5b6,4);key.position.set(-3,12,6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-12;key.shadow.camera.right=12;key.shadow.camera.top=12;key.shadow.camera.bottom=-12;key.shadow.normalBias=.035;scene.add(key);
  const rim=new T.DirectionalLight(0x7cc8c3,3);rim.position.set(2,7,-8);scene.add(rim);
  const floor=mesh(new T.CylinderGeometry(10,10,.25,96),new T.MeshStandardMaterial({color:0x223530,metalness:.25,roughness:.7}),scene,[0,-.15,0]);
  const rings=new T.Group();scene.add(rings);
  for(let r=3;r<=9;r+=2){const ring=mesh(new T.TorusGeometry(r,.012,6,96),new T.MeshStandardMaterial({color:0x58675a,metalness:.5,roughness:.7}),rings,[0,-.015,0]);ring.rotation.x=Math.PI/2;}
  const garden=Array.from({length:8},(_,i)=>{const body=gardenBody(i);body.root.position.set((i-3.5)*1.15,0,1.1+Math.abs(i-3.5)*.12);scene.add(body.root);return body;});
  const choir=Array.from({length:6},(_,i)=>{const body=choirBody(i);body.root.position.set((i-2.5)*1.6,0,-2.4-Math.cos(i*.7)*.25);scene.add(body.root);return body;});
  const tine=tineBody();tine.root.position.set(-1.6,0,4.1);scene.add(tine.root);
  const rail=mesh(new T.CylinderGeometry(.055,.055,9.2,16),new T.MeshStandardMaterial({color:palette.brass,metalness:.8,roughness:.3}),scene,[0,.2,-1.2]);rail.rotation.z=Math.PI/2;
  const paths=new Map();
  garden.forEach((b,i)=>paths.set(`garden/${i}`,b));choir.forEach((b,i)=>paths.set(`choir/${i}`,b));paths.set('tine/0',tine);
  let sizeW=0,sizeH=0;
  function resize(){const rect=fixedSize ?? canvas.getBoundingClientRect();if(rect.width===sizeW&&rect.height===sizeH)return;sizeW=rect.width;sizeH=rect.height;renderer.setSize(sizeW,sizeH,false);camera.aspect=sizeW/Math.max(1,sizeH);camera.updateProjectionMatrix();}
  function render(){resize();renderer.render(scene,camera);}
  function view(name){
    if(name==='choir'){camera.position.set(7,5,6);controls.target.set(0,1.3,-2.4);}
    else if(name==='tine'){camera.position.set(3,3,8);controls.target.set(0,.7,4.1);}
    else {camera.position.set(9,6.5,12);controls.target.set(0,1,0);}
    controls.update();render();
  }
  function dispose(){controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});renderer.dispose();}
  return {scene,camera,renderer,controls,garden,choir,tine,paths,render,view,dispose};
}
