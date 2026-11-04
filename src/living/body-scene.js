import {STRIKER_GEOMETRY as SG,livingStrikerPose} from './striker-geometry.js';
import * as T from '../../vendor/three/build/three.module.js';

/** Renderable body geometry without a renderer. Supports are artistic staging;
 * blade width and response edges follow the admitted tine design. */
export function createLivingBody(mm,{widthMm=10,materials,responseMagnification=100000}={}){
 if(!Number.isInteger(widthMm)||widthMm<5||widthMm>20)throw Error('Body width must be 5…20 mm.');
 const {ceramic,bronze,steel,dark}=materials,bodyWidth=widthMm/10;
 const objects=new T.Group();
 function mesh(geometry,material,position,parent=objects){const m=new T.Mesh(geometry,material);m.position.fromArray(position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const chamferedBox=(w,h,d)=>{const b=.035,s=new T.Shape(),x=w/2-b,y=h/2-b;s.moveTo(-x,-y);s.lineTo(x,-y);s.lineTo(x,y);s.lineTo(-x,y);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,steps:1});g.translate(0,0,-(d-2*b)/2);return g;};
 const shape=new T.Shape();shape.moveTo(-1.7,.08);shape.bezierCurveTo(-2.2,1.8,-2.0,3.5,-.65,4.05);shape.bezierCurveTo(-.2,4.25,.05,4.15,.05,3.8);shape.lineTo(.05,3.15);shape.bezierCurveTo(-1.5,3.1,-1.55,1.0,1.15,.55);shape.lineTo(3.75,.43);shape.bezierCurveTo(4.25,.4,4.3,.1,3.8,.05);shape.closePath();
 const cradle=new T.ExtrudeGeometry(shape,{depth:bodyWidth+.8,bevelEnabled:true,bevelSegments:4,steps:1,bevelSize:.1,bevelThickness:.1,curveSegments:128});
 mesh(cradle,ceramic,[-.75,0,-(bodyWidth+.8)/2]);
 // One drawing unit = 10 mm; another .8 of blade enters the artistic clamp.
 let length=8;
 const blade=mesh(new T.BoxGeometry(8.8,.1,bodyWidth),steel,[3.6,3.5,0]);blade.name='steel-blade';
 const marker=mesh(new T.SphereGeometry(.075,20,12),new T.MeshBasicMaterial({color:0xe9b56c}),[6.8,3.64,0]);marker.visible=false;
 const veil=new T.Group();objects.add(veil);veil.visible=false;
 const veilGeometry=new T.BufferGeometry(),veilPositions=new Float32Array(81*2*3),indices=[];
 for(let i=0;i<80;i++){const a=2*i;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
 veilGeometry.setAttribute('position',new T.BufferAttribute(veilPositions,3));veilGeometry.setIndex(indices);
 const veilMaterial=new T.MeshBasicMaterial({color:0x85c6cc,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false});
 for(const z of [-(bodyWidth/2+.01),bodyWidth/2+.01]){const m=new T.Mesh(veilGeometry,veilMaterial);m.position.z=z;veil.add(m);}
 const edges=[];
 for(const sign of [-1,1])for(const z of [-(bodyWidth/2+.01),bodyWidth/2+.01]){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(81*3),3));const line=new T.Line(g,new T.LineBasicMaterial({color:sign>0?0xc1dfdf:0x73aeb9,transparent:true,opacity:.65,depthWrite:false}));line.position.z=z;veil.add(line);edges.push({line,sign});}
 function response(points,opacity=1){
  veil.visible=!!points;
  veilMaterial.opacity=.16*opacity;for(const {line} of edges)line.material.opacity=.65*opacity;
  if(points){for(let i=0;i<81;i++){const x=points[i].u*length,h=points[i].boundM*(100*responseMagnification);veilPositions.set([x,3.5-h,0,x,3.5+h,0],i*6);for(const {line,sign} of edges)line.geometry.attributes.position.array.set([x,3.5+sign*h,0],i*3);}
   veilGeometry.attributes.position.needsUpdate=true;veilGeometry.computeBoundingSphere();for(const {line} of edges){line.geometry.attributes.position.needsUpdate=true;line.geometry.computeBoundingSphere();}}
 }
 mesh(chamferedBox(.8,.32,bodyWidth+.45),bronze,[-.4,3.71,0]);
 mesh(chamferedBox(.8,.25,bodyWidth+.45),bronze,[-.4,3.325,0]);
 for(const z of [-.46*bodyWidth,.46*bodyWidth]){
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
 return {objects,blade,response,setLength,performers,acknowledgeTouch(value,activation=.85){marker.position.x=activation*length;marker.visible=value;}};
 }
