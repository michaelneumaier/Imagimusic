import * as T from '../../vendor/three/build/three.module.js';
import {OrbitControls} from '../../vendor/three/examples/jsm/controls/OrbitControls.js';
import {createSurfaceLighting} from '../stage/surface-lighting.js';
export function createGroveWorld(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const scene=new T.Scene();scene.background=new T.Color(0x141a22);scene.fog=new T.FogExp2(0x141a22,.025);
 const lighting=createSurfaceLighting(renderer);scene.environment=lighting.environment;scene.environmentIntensity=.65;
 const camera=new T.PerspectiveCamera(42,1,.1,100);camera.position.set(1,3.6,9.5);
 const controls=new OrbitControls(camera,canvas);controls.target.set(0,2,0);controls.enableDamping=false;controls.minDistance=6;controls.maxDistance=22;controls.maxPolarAngle=Math.PI*.48;controls.update();
 scene.add(new T.HemisphereLight(0xd8dfed,0x292126,2.3));
 const key=new T.DirectionalLight(0xffe1b9,3.5);key.position.set(-4,9,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=7;key.shadow.camera.bottom=-7;key.shadow.normalBias=.025;scene.add(key);
 const rim=new T.DirectionalLight(0xb6afe7,2.7);rim.position.set(5,5,-5);scene.add(rim);
 const ground=new T.Mesh(new T.CylinderGeometry(5.8,6,.16,96),new T.MeshStandardMaterial({color:0x282e37,roughness:.66,metalness:.18,roughnessMap:lighting.grain}));ground.position.y=-.12;ground.receiveShadow=true;scene.add(ground);
 let width=0,height=0;
 function render(){const rect=canvas.getBoundingClientRect();if(rect.width!==width||rect.height!==height){width=rect.width;height=rect.height;renderer.setSize(width,height,false);camera.aspect=width/Math.max(1,height);camera.zoom=Math.min(1,camera.aspect/1.45);camera.updateProjectionMatrix();}renderer.render(scene,camera);}
 return {scene,camera,controls,renderer,render,dispose(){controls.dispose();lighting.dispose();ground.geometry.dispose();ground.material.dispose();renderer.dispose();}};
}
