import {STRIKER_GEOMETRY as SG,livingStrikerPose} from './striker-geometry.js';
import {LIVING_LOOKS} from './looks.js';
import * as T from '../../vendor/three/build/three.module.js';
import {OrbitControls} from '../../vendor/three/examples/jsm/controls/OrbitControls.js';
import {createSurfaceLighting} from '../stage/surface-lighting.js';

/** One drawing unit = 10 mm. The solid body stays still; the optional veil
 * shows a conservative displacement envelope at 100,000× magnification. */
export function createLivingScene(canvas,{onTouch=()=>{},width:fixedWidth,height:fixedHeight}={}){
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
 function makeBody(mm){
 const objects=new T.Group();scene.add(objects);
 function mesh(geometry,material,position,parent=objects){const m=new T.Mesh(geometry,material);m.position.fromArray(position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const chamferedBox=(w,h,d)=>{const b=.035,s=new T.Shape(),x=w/2-b,y=h/2-b;s.moveTo(-x,-y);s.lineTo(x,-y);s.lineTo(x,y);s.lineTo(-x,y);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,steps:1});g.translate(0,0,-(d-2*b)/2);return g;};
 const shape=new T.Shape();shape.moveTo(-1.7,.08);shape.bezierCurveTo(-2.2,1.8,-2.0,3.5,-.65,4.05);shape.bezierCurveTo(-.2,4.25,.05,4.15,.05,3.8);shape.lineTo(.05,3.15);shape.bezierCurveTo(-1.5,3.1,-1.55,1.0,1.15,.55);shape.lineTo(3.75,.43);shape.bezierCurveTo(4.25,.4,4.3,.1,3.8,.05);shape.closePath();
 const cradle=new T.ExtrudeGeometry(shape,{depth:1.8,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.1,bevelThickness:.1,curveSegments:128});
 mesh(cradle,ceramic,[-.75,0,-.9]);
 // Exposed span x=0…8, width1, thickness.1; another .8 enters the clamp.
 let length=8;
 const blade=mesh(new T.BoxGeometry(8.8,.1,1),steel,[3.6,3.5,0]);blade.name='steel-blade';
 const marker=mesh(new T.SphereGeometry(.075,20,12),new T.MeshBasicMaterial({color:0xe9b56c}),[6.8,3.64,0]);marker.visible=false;
 const veil=new T.Group();objects.add(veil);veil.visible=false;
 const veilGeometry=new T.BufferGeometry(),veilPositions=new Float32Array(81*2*3),indices=[];
 for(let i=0;i<80;i++){const a=2*i;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
 veilGeometry.setAttribute('position',new T.BufferAttribute(veilPositions,3));veilGeometry.setIndex(indices);
 const veilMaterial=new T.MeshBasicMaterial({color:0x85c6cc,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false});
 for(const z of [-.51,.51]){const m=new T.Mesh(veilGeometry,veilMaterial);m.position.z=z;veil.add(m);}
 const edges=[];
 for(const sign of [-1,1])for(const z of [-.51,.51]){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(81*3),3));const line=new T.Line(g,new T.LineBasicMaterial({color:sign>0?0xc1dfdf:0x73aeb9,transparent:true,opacity:.65,depthWrite:false}));line.position.z=z;veil.add(line);edges.push({line,sign});}
 function response(points){
  veil.visible=!!points;
  if(points){for(let i=0;i<81;i++){const x=points[i].u*length,h=points[i].boundM*1e7;veilPositions.set([x,3.5-h,0,x,3.5+h,0],i*6);for(const {line,sign} of edges)line.geometry.attributes.position.array.set([x,3.5+sign*h,0],i*3);}
   veilGeometry.attributes.position.needsUpdate=true;veilGeometry.computeBoundingSphere();for(const {line} of edges){line.geometry.attributes.position.needsUpdate=true;line.geometry.computeBoundingSphere();}}
 }
 mesh(chamferedBox(.8,.32,1.45),bronze,[-.4,3.71,0]);
 mesh(chamferedBox(.8,.25,1.45),bronze,[-.4,3.325,0]);
 for(const z of [-.46,.46]){
  mesh(new T.CylinderGeometry(.115,.115,.045,32),bronze,[-.4,3.892,z]);
  mesh(new T.CylinderGeometry(.058,.058,.008,6),dark,[-.4,3.918,z]);
 }
 function setLength(mm){length=mm/10;blade.scale.x=(length+.8)/8.8;blade.position.x=(length-.8)/2;marker.position.x=.85*length;marker.visible=false;veil.visible=false;}
 // Contact rig is lazy; only presentation3 or the explicit workshop enables it.
 const contactActors=new Map(),contactGroup=new T.Group();objects.add(contactGroup);contactGroup.visible=false;
 let contactSupport=null;
 function performers(poses){
  contactGroup.visible=poses.length>0;
  for(const rig of contactActors.values())rig.root.visible=false;
  if(poses.length&&!contactSupport){
    const root=new T.Group();contactGroup.add(root);contactSupport=root;
    // A tapered ceramic bow carries the axle outside the blade's width.
    // Its shape and the counterweight are art direction, not simulated mechanics.
    const bow=new T.Shape();bow.moveTo(-.7,.12);
    bow.bezierCurveTo(-1.05,1.2,-.7,3.7,-.1,SG.pivotY-.1);
    bow.quadraticCurveTo(0,SG.pivotY+.06,.08,SG.pivotY);
    bow.bezierCurveTo(-.4,3.1,-.6,1.4,-.2,.12);bow.closePath();
    const support=new T.ExtrudeGeometry(bow,{depth:.14,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:48});
    mesh(support,ceramic,[0,0,SG.postZ-.07],root);
    const foot=mesh(new T.SphereGeometry(1,32,16),ceramic,[-.45,.10,SG.postZ],root);foot.scale.set(.62,.13,.38);
    const axle=mesh(new T.CylinderGeometry(.065,.065,SG.postZ+.35,16),bronze,[0,SG.pivotY,(SG.postZ-.35)/2],root);axle.rotation.x=Math.PI/2;
  }
  if(contactSupport)contactSupport.position.x=.85*length-SG.reach;
  for(const pose of poses){
   const geometry=livingStrikerPose(length*10,pose.down,pose.lane,pose.headRadius),armLength=geometry.armLength;
   const actorKey=pose.id+':'+pose.lane+':'+pose.headRadius;
   let rig=contactActors.get(actorKey);
   if(!rig){
    const root=new T.Group();contactGroup.add(root);
    const arm=new T.Group();arm.position.set(0,SG.pivotY,pose.lane);root.add(arm);
    const shaft=mesh(new T.CylinderGeometry(.025,.025,armLength,16),steel,[armLength/2,0,0],arm);shaft.rotation.z=-Math.PI/2;
    mesh(new T.SphereGeometry(pose.headRadius,24,16),bronze,[armLength,0,0],arm);
    mesh(new T.SphereGeometry(pose.headRadius,20,12),dark,[0,0,0],arm);
    const tail=mesh(new T.CylinderGeometry(.035,.035,.38,16),steel,[-.19,0,0],arm);tail.rotation.z=-Math.PI/2;
    const counterweight=mesh(new T.SphereGeometry(1,24,16),bronze,[-.38,0,0],arm);counterweight.scale.set(.20,.09,Math.min(.12,pose.headRadius));
    rig={root,arm};contactActors.set(actorKey,rig);
   }
   rig.root.visible=true;rig.root.position.x=geometry.pivot[0];
   rig.arm.rotation.z=geometry.angle;
  }
 }
 setLength(mm);
 return {objects,blade,response,setLength,performers,acknowledgeTouch(value){marker.visible=value;}};
 }
 const bodies=[makeBody(80),makeBody(95),makeBody(65)];
 bodies[1].objects.position.set(-11,0,-4);bodies[2].objects.position.set(10,0,-4);
 bodies[1].objects.visible=bodies[2].objects.visible=false;
 const floor=new T.Mesh(new T.PlaneGeometry(2000,2000),new T.MeshStandardMaterial({color:0x03070c,roughness:.8,metalness:.12}));floor.position.y=-.07;floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
 scene.add(new T.HemisphereLight(0xa8c8db,0x1e1710,.9));
 const key=new T.DirectionalLight(0xffd5a0,3.2);key.position.set(-4,11,5);key.target.position.set(2,2,0);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:1,far:35});key.shadow.bias=-.00015;key.shadow.normalBias=.025;scene.add(key,key.target);
 const rim=new T.DirectionalLight(0xa7d1e7,2.8);rim.position.set(6,5,-7);scene.add(rim);
 const camera=new T.PerspectiveCamera(34,1,.1,220),controls=new OrbitControls(camera,canvas);
 controls.enableDamping=false;controls.enablePan=false;controls.enableZoom=false;controls.minPolarAngle=.25;controls.maxPolarAngle=Math.PI*.48;
 let cameraOpen=0,inspectContact=false,cameraShot=null;
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
 function performers(poses=[]){for(let i=0;i<3;i++)bodies[i].performers(poses.filter(p=>p.body===i));}
 function clearArrangement(){performers([]);const wasDetail=inspectContact||!!cameraShot;inspectContact=false;cameraShot=null;controls.enabled=true;for(const b of bodies){b.response(null);b.acknowledgeTouch(false);}openCamera(0);if(wasDetail)place();render();}
 const observer=fixed?null:new ResizeObserver(resize);observer?.observe(canvas);resize();
 function dispose(){disposed=true;observer?.disconnect();controls.dispose();studio.dispose();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();renderer.dispose();}
 return {view,render,setLook,response,setLength,acknowledgeTouch,arrangementFrame,clearArrangement,performers,dispose};
}
