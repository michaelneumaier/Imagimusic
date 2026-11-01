import * as T from '../../vendor/three/build/three.module.js';

export const palette = { brass:0xb89c65, dark:0x203632, green:0xb8d69a, glass:0x83cabb, steel:0xa5bac0 };
const material = (color, metalness=.65, roughness=.35) => new T.MeshStandardMaterial({color,metalness,roughness});
export function mesh(geometry, surface, parent, position=[0,0,0]) {
  const object=new T.Mesh(geometry,surface);object.position.set(...position);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;
}
function cylinder(radius,height,surface,parent,position) {return mesh(new T.CylinderGeometry(radius,radius,height,24),surface,parent,position);}
function rod(a,b,radius,surface,parent) {
  const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
  const object=cylinder(radius,delta.length(),surface,parent,start.clone().add(end).multiplyScalar(.5).toArray());
  object.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return object;
}
export function gardenBody(index) {
  const root=new T.Group(), brass=material(palette.brass), dark=material(palette.dark);
  const height=3.35-index*.21;
  cylinder(.44,.16,dark,root,[0,.08,0]);cylinder(.065,height+.35,brass,root,[0,height/2+.18,0]);
  const layers=[];
  for(let n=0;n<5;n++) {
    const surface=new T.MeshPhysicalMaterial({color:palette.glass,metalness:.25,roughness:.21,transparent:true,opacity:.62,side:T.DoubleSide,emissive:palette.glass,emissiveIntensity:0});
    const shell=mesh(new T.SphereGeometry(.28+n*.035,24,12,0,Math.PI*2,0,Math.PI*.74),surface,root,[0,height-n*height*.145,0]);
    shell.scale.y=.65;layers.push(shell);
    const rim=mesh(new T.TorusGeometry(.28+n*.035,.012,6,32),brass,shell);rim.rotation.x=Math.PI/2;rim.position.y=-.04;
  }
  const striker=new T.Group();root.add(striker);striker.position.set(-.68,1,0);
  rod([0,-.6,0],[0,0,0],.025,brass,striker);mesh(new T.SphereGeometry(.115,16,12),material(0xe6d3a5,.2),striker);
  const damper=mesh(new T.BoxGeometry(.12,.3,.26),material(0x667856,.05,.9),root,[.63,height*.4,0]);
  return {root,layers,striker,damper,height};
}
export function choirBody(slot) {
  const root=new T.Group(),brass=material(palette.brass),dark=material(palette.dark), leather=material(0x6d5943,.1,.8);
  cylinder(.5,.18,dark,root,[0,.09,0]);rod([0,.15,0],[0,1.1,0],.06,brass,root);
  const bellows=new T.Group();bellows.position.y=.65;root.add(bellows);
  for(let i=0;i<9;i++) {
    const ring=cylinder(i%2?.34:.29,.07,i%2?brass:leather,bellows,[0,i*.075,0]);ring.scale.z=.75;
  }
  const chamber=new T.Group();chamber.position.y=1.75;root.add(chamber);
  const outer=mesh(new T.TorusGeometry(.43,.075,12,40),brass,chamber);
  const back=mesh(new T.CylinderGeometry(.44,.44,.3,32),dark,chamber,[0,0,-.18]);back.rotation.x=Math.PI/2;
  const blades=[];
  for(let i=0;i<8;i++){
    const pivot=new T.Group();pivot.rotation.z=i*Math.PI/4;chamber.add(pivot);
    const blade=mesh(new T.BoxGeometry(.22,.32,.018),material(0x75876a,.8,.3),pivot,[.23,0,.02+i*.001]);blades.push({pivot,blade});
  }
  const horn=mesh(new T.CylinderGeometry(.36,.08,.6,32,1,true),brass.clone(),root,[.69,1.75,0]);horn.rotation.z=-Math.PI/2;
  const source=mesh(new T.TorusGeometry(.13,.035,8,16),brass,root,[-.65,1.75,0]);
  rod([-.65,1.75,0],[-.43,1.75,0],.035,brass,root);
  const pendulum=new T.Group();pendulum.position.set(-.4,2.48,.1);root.add(pendulum);
  rod([0,0,0],[0,-.55,0],.018,brass,pendulum);mesh(new T.SphereGeometry(.065,12,10),material(palette.green,.3),pendulum,[0,-.55,0]);
  const arcPoints=Array.from({length:33},(_,i)=>{const angle=-.65+i/32*1.3;return new T.Vector3(Math.sin(angle)*.55,-Math.cos(angle)*.55,0);});
  const fastArc=new T.Line(new T.BufferGeometry().setFromPoints(arcPoints),new T.LineBasicMaterial({color:palette.green,transparent:true,opacity:.65}));
  fastArc.position.copy(pendulum.position);fastArc.visible=false;root.add(fastArc);
  const glow=mesh(new T.CircleGeometry(.32,32),new T.MeshBasicMaterial({color:palette.green,transparent:true,opacity:0,depthWrite:false}),chamber,[0,0,.06]);
  return {root,bellows,chamber,blades,horn,pendulum,fastArc,source,glow,slot};
}
export function tineBody() {
  const root=new T.Group(),brass=material(palette.brass),steel=material(palette.steel,.85,.24);
  mesh(new T.BoxGeometry(.4,.6,.7),brass,root,[0,.55,0]);
  const geometry=new T.BoxGeometry(1,.03,.22,64,1,1);geometry.translate(.5,0,0);
  const beam=mesh(geometry,steel,root,[.2,.65,0]);
  const base=geometry.attributes.position.array.slice();
  const striker=mesh(new T.SphereGeometry(.1,16,12),material(0xe6d3a5),root,[1,.95,0]);
  const damper=mesh(new T.BoxGeometry(.2,.12,.3),material(0x667856,.05,.9),root,[1.5,.4,0]);
  return {root,beam,base,striker,damper};
}
