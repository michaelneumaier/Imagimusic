import * as T from '../../vendor/three/build/three.module.js';

/** Static procedural studio: broad reflected softboxes reveal curved metal/glass.
 * Baked once per world; identical lighting for preview and exported frames. */
export function createSurfaceLighting(renderer) {
 const studio=new T.Scene();studio.background=new T.Color(0x263531);
 const panels=[];
 for(const [position,size,color,intensity] of [
  [[-5,7,3],[4,7,1],0xffe5bb,3],
  [[5,4,-4],[3,6,1],0xa9e2ec,2],
  [[0,10,0],[8,1,5],0xe3eee3,2.5],
 ]){
  const material=new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(intensity)});
  const panel=new T.Mesh(new T.BoxGeometry(...size),material);panel.position.fromArray(position);panel.lookAt(0,1,0);studio.add(panel);panels.push(panel);
 }
 const generator=new T.PMREMGenerator(renderer);
 const target=generator.fromScene(studio,.12,.1,50);
 generator.dispose();for(const panel of panels){panel.geometry.dispose();panel.material.dispose();}
 // Analytic grain in a roughness map: no network asset and no random seed drift.
 const size=128,data=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const grain=.5+.22*Math.sin(x*1.7+y*.13)+.14*Math.sin(y*2.3+x*.21);
  const v=Math.round(190+50*grain),i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;
 }
 const grain=new T.DataTexture(data,size,size,T.RGBAFormat);grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(10,10);grain.magFilter=T.LinearFilter;grain.minFilter=T.LinearMipmapLinearFilter;grain.generateMipmaps=true;grain.needsUpdate=true;
 return {environment:target.texture,grain,dispose(){target.dispose();grain.dispose();}};
}
