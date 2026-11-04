import {createLivingBody} from './body-scene.js';
import {LIVING_LOOKS} from './looks.js';
import * as T from '../../vendor/three/build/three.module.js';
import {OrbitControls} from '../../vendor/three/examples/jsm/controls/OrbitControls.js';
import {createSurfaceLighting} from '../stage/surface-lighting.js';

/** One drawing unit = 10 mm. The solid body stays still; the optional veil
 * shows a conservative displacement envelope, defaulting to 100,000× magnification. */
export function createLivingScene(canvas,{onTouch=()=>{},width:fixedWidth,height:fixedHeight,ensemble=null,responseMagnification=100000}={}){
 if(!Number.isFinite(responseMagnification)||responseMagnification<=0||responseMagnification>100000)throw Error('Invalid response magnification.');
 const fixed=fixedWidth!==undefined||fixedHeight!==undefined;
 if(fixed&&(!Number.isInteger(fixedWidth)||fixedWidth<1||!Number.isInteger(fixedHeight)||fixedHeight<1))throw Error('Fixed scene dimensions must be positive integers.');
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:fixed});
 renderer.setPixelRatio(fixed?1:Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color(0x0c141a);scene.fog=new T.Fog(0x0c141a,30,65);
 const studio=createSurfaceLighting(renderer);scene.environment=studio.environment;scene.environmentIntensity=1.8;
 const ceramic=new T.MeshStandardMaterial({color:0x20292b,roughness:.78,metalness:.08,roughnessMap:studio.grain});
 const bronze=new T.MeshStandardMaterial({color:0x9e693b,roughness:.31,metalness:.86,roughnessMap:studio.grain});
 const steel=new T.MeshStandardMaterial({color:0xc4c9c9,roughness:.28,metalness:.93,roughnessMap:studio.grain});
 const dark=new T.MeshStandardMaterial({color:0x25221e,roughness:.4,metalness:.7});
 function makeBody(mm,widthMm=10){const body=createLivingBody(mm,{widthMm,materials:{ceramic,bronze,steel,dark},responseMagnification});scene.add(body.objects);return body;}
 const bodies=ensemble?ensemble.instances.map(instance=>{const body=makeBody(instance.bodyMm,instance.bodyWidthMm??10);body.objects.position.fromArray(instance.position);return body;}):[makeBody(80),makeBody(95),makeBody(65)];
 if(!ensemble){bodies[1].objects.position.set(-11,0,-4);bodies[2].objects.position.set(10,0,-4);bodies[1].objects.visible=bodies[2].objects.visible=false;}
 const floor=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.MeshStandardMaterial({color:0x03070c,roughness:.8,metalness:.12}));floor.position.y=-.07;floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 scene.add(new T.HemisphereLight(0xa8c8db,0x1e1710,.9));
 const key=new T.DirectionalLight(0xffd5a0,3.2);key.position.set(-4,11,5);key.target.position.set(2,2,0);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:35});key.shadow.bias=-.00015;key.shadow.normalBias=.025;scene.add(key,key.target);
 const rim=new T.DirectionalLight(0xa7d1e7,2.8);rim.position.set(6,5,-7);scene.add(rim);
 const camera=new T.PerspectiveCamera(34,1,.1,220),controls=new OrbitControls(camera,canvas);
 controls.enableDamping=false;controls.enablePan=false;controls.enableZoom=false;controls.minPolarAngle=.25;controls.maxPolarAngle=Math.PI*.48;
 let cameraOpen=0,inspectContact=false,cameraShot=ensemble?ensemble.camera:null;
 if(ensemble){scene.fog.near=100;scene.fog.far=220;key.shadow.camera.left=-25;key.shadow.camera.right=25;key.shadow.camera.top=25;key.shadow.camera.bottom=-25;key.shadow.camera.far=65;key.shadow.camera.updateProjectionMatrix();}
 let selected='opening',width=0,height=0,disposed=false;
 const poses={opening:{target:[3.5,2,0],direction:[10,6.5,14],radius:6.6},root:{target:[-.45,3.4,0],direction:[4,3,7],radius:2.1},end:{target:[5.8,3.2,0],direction:[7,4,10],radius:3.2}};
 function place(){
  const solo=inspectContact?{target:[6.3,4.2,0],direction:[3,2,8],radius:1.3}:poses[selected],wide={target:[3,2,-2],direction:[5,9,19],radius:16};
  const target=new T.Vector3(...solo.target).lerp(new T.Vector3(...wide.target),cameraOpen);
  const direction=new T.Vector3(...solo.direction).normalize().lerp(new T.Vector3(...wide.direction).normalize(),cameraOpen).normalize();
  if(cameraShot){target.set(...cameraShot.target);direction.set(...cameraShot.direction).normalize();}
  const radius=cameraShot?cameraShot.radius:T.MathUtils.lerp(solo.radius,wide.radius,cameraOpen),vertical=T.MathUtils.degToRad(camera.fov/2),horizontal=Math.atan(Math.tan(vertical)*camera.aspect),distance=radius/Math.sin(Math.min(vertical,horizontal));
  controls.target.copy(target);camera.position.copy(target).add(direction.multiplyScalar(distance));controls.update();
 }
 function render(){if(!disposed)renderer.render(scene,camera);}
 function resize(){const r=fixed?{width:fixedWidth,height:fixedHeight}:canvas.getBoundingClientRect();if(r.width===width&&r.height===height)return;width=r.width;height=r.height;renderer.setSize(Math.max(1,width),Math.max(1,height),false);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();place();render();}
 function view(name){if(!poses[name])throw Error('Unknown instrument view.');selected=name;place();render();}
 controls.addEventListener('change',render);
 const raycaster=new T.Raycaster();let pointer=null;
 function down(event){if(event.isPrimary&&event.button===0)pointer={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};else pointer=null;}
 function move(event){if(pointer&&event.pointerId===pointer.id&&Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>6)pointer.moved=true;}
 function up(event){const p=pointer;pointer=null;if(!p||p.id!==event.pointerId||p.moved)return;const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2(2*(event.clientX-r.left)/r.width-1,1-2*(event.clientY-r.top)/r.height),camera);if(raycaster.intersectObject(bodies[0].blade).length)onTouch();}
 function cancel(){pointer=null;}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);
 function setLength(mm){
  if(![65,80,95].includes(mm))throw Error('Unknown opening body length.');
  bodies[0].setLength(mm);poses.end.target[0]=mm/10-2.2;if(selected==='end')place();render();
 }
 function acknowledgeTouch(value=true){bodies[0].acknowledgeTouch(value);render();}
 function response(points){bodies[0].response(points);render();}
 function openCamera(value){
  if(cameraOpen===value)return;cameraOpen=value;scene.fog.near=T.MathUtils.lerp(30,80,value);scene.fog.far=T.MathUtils.lerp(65,180,value);bodies[1].objects.visible=bodies[2].objects.visible=value>0;place();
 }
 function arrangementFrame(frame,reveal,cameraMotion=true,contactDetail=false){
  if(frame.performers)performers(frame.performers);
  const nextShot=cameraMotion&&!contactDetail?frame.cameraShot??null:null;
  const framingChanged=inspectContact!==contactDetail||cameraShot!==nextShot;inspectContact=contactDetail;cameraShot=nextShot;
  controls.enabled=inspectContact||!cameraMotion;openCamera(inspectContact?0:cameraMotion?frame.cameraOpen:1);if(framingChanged)place();
  for(let i=0;i<3;i++){bodies[i].response(reveal?frame.bodies[i].points:null);bodies[i].acknowledgeTouch(frame.bodies[i].touched);}
  render();
 }
 function setLook(name){
  const look=LIVING_LOOKS[name];if(!look)throw Error('Unknown visual treatment.');
  scene.background.setHex(look.background);scene.fog.color.setHex(look.background);floor.material.color.setHex(look.floor);
  ceramic.color.setHex(look.ceramic);bronze.color.setHex(look.bronze);steel.color.setHex(look.steel);steel.roughness=look.steelRoughness??.28;steel.envMapIntensity=look.steelEnvironment??1;
  renderer.toneMappingExposure=look.exposure;scene.environmentIntensity=look.environment;
  key.color.setHex(look.key);key.intensity=look.keyPower;rim.color.setHex(look.rim);rim.intensity=look.rimPower;render();
 }
 function performers(poses=[]){for(let i=0;i<bodies.length;i++)bodies[i].performers(poses.filter(p=>p.body===i));}
 function instanceFrame(frame,reveal=true){
  if(!ensemble||frame.instances.length!==bodies.length)throw Error('Frame does not match the journey ensemble.');
  performers(frame.performers);
  for(let i=0;i<bodies.length;i++){const state=frame.instances[i];bodies[i].response(reveal?state.points:null,state.endingOpacity);bodies[i].acknowledgeTouch(!!state.touchMarker,state.touchMarker?.activation);}
  render();
 }
 function clearArrangement(){performers([]);const wasDetail=inspectContact||!!cameraShot;inspectContact=false;cameraShot=null;controls.enabled=true;for(const b of bodies){b.response(null);b.acknowledgeTouch(false);}openCamera(0);if(wasDetail)place();render();}
 const observer=fixed?null:new ResizeObserver(resize);observer?.observe(canvas);resize();
 function dispose(){disposed=true;observer?.disconnect();controls.dispose();studio.dispose();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();renderer.dispose();}
 return {view,render,setLook,response,setLength,acknowledgeTouch,arrangementFrame,instanceFrame,clearArrangement,performers,dispose};
}
