import * as THREE from './lib/three.module.js';

// Drawing coordinates are feet. X follows AB; Z points into the plot; Y is height.
export const P = [[0,0],[56.67888,0],[90.42987,-4.11816],[112.56747,16.85177],[70.35568,45.46508],[62.56395,47.31187],[52.24337,43.54375]];
export const LEVELS = [-10,0,12.5,23];
export const roadZ = x => x <= P[1][0] ? 0 : (x-P[1][0])*P[2][1]/(P[2][0]-P[1][0]);
export function clip(poly,x0=-1e5,x1=1e5,z0=-1e5,z1=1e5){
 let a=poly.map(p=>[...p]);
 for(const [axis,bound,side] of [[0,x0,1],[0,x1,-1],[1,z0,1],[1,z1,-1]]){
  const out=[];
  a.forEach((q,i)=>{const p=a[(i+a.length-1)%a.length],ip=(p[axis]-bound)*side>=-1e-8,iq=(q[axis]-bound)*side>=-1e-8;
   if(ip!==iq){const t=(bound-p[axis])/(q[axis]-p[axis]);out.push([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])]);}if(iq)out.push(q);});a=out;
 }return a;
}
export function inside(x,z,poly=P){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if(((poly[i][1]>z)!==(poly[j][1]>z))&&(x<(poly[j][0]-poly[i][0])*(z-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0]))c=!c;return c;}
const rect=(x,z,w,d)=>[[x,z],[x+w,z],[x+w,z+d],[x,z+d]];
const mats={};let serial=0;
function mat(color,roughness=.75,extra={}){const key=JSON.stringify([color,roughness,extra]);return mats[key]??=new THREE.MeshStandardMaterial({color,roughness,...extra});}
function texture(type){
 if(typeof document==='undefined')return null;
 const cv=document.createElement('canvas');cv.width=cv.height=512;const c=cv.getContext('2d');
 let seed=91;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
 if(type==='wood'){
  c.fillStyle='#cbb394';c.fillRect(0,0,512,512);
  for(let y=0;y<512;y+=64){c.fillStyle=y%128?'#c4aa86':'#d1b998';c.fillRect(0,y,512,63);for(let i=0;i<95;i++){c.strokeStyle=`rgba(84,59,34,${rand()*.12})`;c.lineWidth=rand()*1.6;c.beginPath();const yy=y+rand()*63;c.moveTo(0,yy);c.bezierCurveTo(150,yy+rand()*4,300,yy-3,512,yy+2);c.stroke();}c.fillStyle='#897459';c.fillRect((y%192)*2, y, 1,63);}
 } else if(type==='stone'){
  c.fillStyle='#b1aea5';c.fillRect(0,0,512,512);for(let y=0;y<512;y+=64)for(let x=-100;x<512;x+=120){c.fillStyle=['#8b8e83','#a5a496','#92968d','#b3b0a2'][Math.floor(rand()*4)];c.fillRect(x+(y%128?60:0)+3,y+3,114,58);}
 } else {
  c.fillStyle='#e4e0d8';c.fillRect(0,0,512,512);c.strokeStyle='#cbc8be';c.lineWidth=2;for(let n=0;n<=512;n+=128){c.beginPath();c.moveTo(n,0);c.lineTo(n,512);c.moveTo(0,n);c.lineTo(512,n);c.stroke();}
 }
 const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(type==='wood'?1:.5,type==='wood'?1:.5);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
export function buildModel(){
 const root=new THREE.Group();root.name='Bhaderwah concept R02';
 const context=new THREE.Group(),levels=LEVELS.map((y,i)=>{const g=new THREE.Group();g.position.y=y;g.name=['Lower parking','Road retail','First floor','Second floor'][i];root.add(g);return g;}),roof=new THREE.Group();root.add(context,roof);
 const walls=LEVELS.map(()=>[]),solids=LEVELS.map(()=>[]),doors=[];
 const ivory=mat('#e7e0d2'),plaster=mat('#f5f0e6'),oak=mat('#b48b58'),bronze=mat('#414f49',.36,{metalness:.5}),roofmat=mat('#3d4749',.46,{metalness:.65}),stone=mat('#a7a69a'),tile=mat('#e2e0d8'),concrete=mat('#b8b9b4'),fabric=mat('#c9bba7'),white=mat('#f7f4ed'),dark=mat('#353c3b'),green=mat('#6a7b60'),brass=mat('#aa8954',.35,{metalness:.7});
 const woodfloor=mat('#ffffff',.65),tilefloor=mat('#ffffff');woodfloor.map=texture('wood');tilefloor.map=texture('tile');stone.map=texture('stone');
 const glass=new THREE.MeshPhysicalMaterial({color:'#c5dad9',roughness:.12,metalness:.05,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false});
 const mirror=mat('#bdcccc',.1,{metalness:.9});const glow=mat('#fff0cb',.4,{emissive:'#ffe5ab',emissiveIntensity:1.1});
 const boxGeo=new THREE.BoxGeometry(1,1,1),cylGeo=new THREE.CylinderGeometry(1,1,1,20),sphereGeo=new THREE.SphereGeometry(1,16,10);
 function mesh(g,geo,m,x,y,z,sx=1,sy=1,sz=1){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
 function box(g,x,y,z,w,h,d,m=plaster){return mesh(g,boxGeo,m,x+w/2,y+h/2,z+d/2,w,h,d);}
 function cyl(g,x,y,z,r,h,m){return mesh(g,cylGeo,m,x,y+h/2,z,r,h,r);}
 function orb(g,x,y,z,r,m,sy=1){return mesh(g,sphereGeo,m,x,y,z,r,r*sy,r);}
 function slab(g,poly,y,t,m){if(poly.length<3)return;const shape=new THREE.Shape(poly.map(([x,z])=>new THREE.Vector2(x,-z)));const geo=new THREE.ExtrudeGeometry(shape,{depth:t,bevelEnabled:false});geo.rotateX(-Math.PI/2);const o=new THREE.Mesh(geo,m);o.position.y=y-t;o.receiveShadow=true;o.castShadow=true;g.add(o);return o;}
 function beam(g,a,b,y,h,t,m=plaster){const len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.01)return;const o=mesh(g,boxGeo,m,(a[0]+b[0])/2,y+h/2,(a[1]+b[1])/2,len,h,t);o.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);return o;}
 function rail(g,a,b,y){beam(g,a,b,y+3.3,.12,.13,bronze);beam(g,a,b,y+.35,.09,.1,bronze);const L=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let s=0;s<=L;s+=2){const f=s/L;box(g,a[0]+(b[0]-a[0])*f-.055,y,a[1]+(b[1]-a[1])*f-.055,.11,3.4,.11,bronze);}}
 // Each opening is [distance from wall start, width, sill, height, type]. Open doors remain passable.
 function wall(g,idx,a,b,h=9,t=.42,m=plaster,opens=[]){
  const len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.05)return;const at=s=>[a[0]+(b[0]-a[0])*s/len,a[1]+(b[1]-a[1])*s/len];let cursor=0;
  const part=(s,e,y,hh,col=m)=>{if(e-s>.01&&hh>.01)beam(g,at(s),at(e),y,hh,t,col);};
  for(const [s,w,sill,oh,type='window'] of [...opens].sort((a,b)=>a[0]-b[0])){
   const e=Math.min(s+w,len);if(s<cursor||e<=s)continue;part(cursor,s,0,h);if(idx>=0&&s>cursor)walls[idx].push([at(cursor),at(s)]);
   part(s,e,0,sill);part(s,e,sill+oh,h-sill-oh);if(sill>.3&&idx>=0)walls[idx].push([at(s),at(e)]);
   const frame=(ss,ee,yy,hh)=>beam(g,at(ss),at(ee),yy,hh,.16,bronze);
   frame(s,s+.1,sill,oh);frame(e-.1,e,sill,oh);frame(s,e,sill+oh-.1,.1);
   if(type==='window'){
    frame(s,e,sill,.1);beam(g,at(s+.1),at(e-.1),sill+.1,oh-.2,.055,glass);
    frame((s+e)/2-.04,(s+e)/2+.04,sill,oh);
    // Deep reveals and a slim Juliet guard give the road elevation depth.
    if(sill>1.5){beam(g,at(s-.12),at(e+.12),sill-.2,.16,.9,ivory);rail(g,at(s),at(e),.15);}
   }else if(type==='door'){
    // Represent an open leaf recessed inside the room, leaving the walk path clear.
    const hinge=at(e),ang=-Math.atan2(b[1]-a[1],b[0]-a[0]);const leaf=box(g,0,0,0,.12,oh-.12,Math.min(w,3),oak);leaf.position.set(hinge[0],(oh-.12)/2,hinge[1]+Math.min(w,3)/2);leaf.rotation.y=ang;
   }
   cursor=e;
  }part(cursor,len,0,h);if(idx>=0&&cursor<len)walls[idx].push([at(cursor),at(len)]);
 }
 const projectOpening=(a,b,x,width,sill,height,type)=>{const dx=b[0]-a[0],scale=Math.hypot(dx,b[1]-a[1])/dx;return[(x-a[0])*scale,width*scale,sill,height,type];};
 function outline(g,idx,poly,h,openingFn){poly.forEach((a,i)=>{const b=poly[(i+1)%poly.length];wall(g,idx,a,b,h,.42,ivory,openingFn?.(a,b)||[]);});}
 function floorpatch(g,x,z,w,d,m=woodfloor){slab(g,clip(P,x,x+w,z,z+d),.035,.04,m);}
 function rug(g,x,z,w,d,color='#b9afa0'){box(g,x,.045,z,w,.025,d,mat(color));for(let i=0;i<4;i++)box(g,x+.15+i*.12,.073,z+.15,w-.3-i*.24,.002,.045,mat('#ded2bc'));}
 function plant(g,x,z,y=0,size=1){cyl(g,x,y,z,.52*size,.95*size,mat('#a18e74'));cyl(g,x,y+.85*size,z,.4*size,.06,mat('#5e5240'));for(let i=0;i<5;i++){const aa=i*2.4;const leaf=orb(g,x+Math.cos(aa)*.3*size,y+(1.2+i*.16)*size,z+Math.sin(aa)*.3*size,.48*size,green,1.7);leaf.rotation.z=Math.sin(aa)*.5;}}
 function art(g,x,y,z,w=3,h=2){box(g,x,y,z,w,h,.1,oak);box(g,x+.1,y+.1,z-.055,w-.2,h-.2,.05,mat('#e0d8c4'));box(g,x+.3,y+.35,z-.09,w*.34,h*.42,.035,green);orb(g,x+w*.7,y+h*.66,z-.12,.25,mat('#b18258'),1);}
 function pendant(g,x,z,y=8.2){cyl(g,x,y,z,.025,1.5,bronze);const geo=new THREE.ConeGeometry(.65,.45,24,1,true);mesh(g,geo,brass,x,y-.12,z);cyl(g,x,y-.4,z,.5,.07,glow);}
 function sofa(g,x,z,w=6.1,col=fabric,turn=0){const s=new THREE.Group();g.add(s);s.position.set(x,0,z);s.rotation.y=turn;box(s,0,.32,0,w,.65,2.8,oak);box(s,.1,.85,.2,w-.2,.58,2.4,col);box(s,0,1.2,0,w,1.3,.45,col);box(s,0,.8,.1,.42,1.2,2.65,col);box(s,w-.42,.8,.1,.42,1.2,2.65,col);for(let n=0;n<3;n++)box(s,.52+n*(w-.95)/3,1.43,.55,(w-1.2)/3,.18,1.9,col);for(let n=0;n<2;n++){const p=box(s,.65+n*(w-1.9),1.6,.5,.75,.8,.32,mat(n?'#819083':'#bc9269'));p.rotation.x=-.2;}return s;}
 function table(g,x,z,w=3,d=2.5,h=1.55,m=oak){box(g,x,h-.15,z,w,.15,d,m);for(const xx of [x+.15,x+w-.32])for(const zz of [z+.15,z+d-.32])box(g,xx,.05,zz,.16,h-.2,.16,bronze);}
 function chair(g,x,z,turn=0){const g2=new THREE.Group();g.add(g2);g2.position.set(x,0,z);g2.rotation.y=turn;box(g2,-.8,1.4,-.75,1.6,.23,1.5,oak);box(g2,-.8,1.63,-.75,1.6,1.45,.16,oak);for(const xx of [-.68,.58])for(const zz of [-.63,.52])box(g2,xx,.05,zz,.13,1.38,.13,bronze);}
 function dining(g,x,z){table(g,x,z,3.2,3.2,2.55);chair(g,x+1.6,z-.9,Math.PI);chair(g,x+1.6,z+4.1,0);cyl(g,x+1.6,2.55,z+1.6,.3,.4,white);plant(g,x+1.6,z+1.6,2.8,.22);pendant(g,x+1.6,z+1.6);}
 function coffee(g,x,z){table(g,x,z,3.3,2.1,1.5);box(g,x+.4,1.51,z+.4,1.1,.08,.75,green);cyl(g,x+2.45,1.5,z+1.1,.22,.32,white);}
 function bed(g,x,z){box(g,x-.12,.25,z-.15,5.24,1,6.8,oak);box(g,x-.18,.1,z-.25,5.36,3.5,.2,fabric);box(g,x,1.2,z,5,.65,6.5,white);box(g,x-.04,1.82,z+1.45,5.08,.17,5.1,mat('#e7e1d4'));for(let n=0;n<2;n++)box(g,x+.25+n*2.55,1.84,z+.25,1.95,.27,1.2,white);box(g,x-.08,2,z+4.8,5.16,.1,1.25,green);for(const xx of [x-1.5,x+5.5]){table(g,xx,z+.3,1.05,1.15,1.8);cyl(g,xx+.5,1.8,z+.82,.14,.45,brass);cyl(g,xx+.5,2.25,z+.82,.4,.7,white);}rug(g,x-.6,z+3,6.2,4,'#c2b096');}
 function kitchen(g,x,z,w){box(g,x,.08,z,w,2.65,2.2,green);box(g,x-.06,2.73,z-.06,w+.12,.16,2.32,mat('#eeece5'));for(let n=0;n<Math.floor(w/1.5);n++){const xx=x+n*w/Math.floor(w/1.5);box(g,xx+.05,.2,z+2.21,w/Math.floor(w/1.5)-.1,2.4,.055,oak);box(g,xx+.25,2.23,z+2.29,.58,.04,.04,brass);}box(g,x+.3,2.9,z+.45,1.1,.02,1.1,dark);for(let j=0;j<2;j++)cyl(g,x+.57+j*.5,2.91,z+.75,.18,.02,bronze);box(g,x+w-1.8,2.9,z+.45,1.3,.02,1.05,mirror);cyl(g,x+w-1.05,2.9,z+.3,.04,.8,bronze);box(g,x+w-1.05,3.65,z+.3,.05,.05,.6,bronze);box(g,x,4.9,z,w,2,1,white);for(let n=0;n<Math.floor(w/2);n++)box(g,x+n*2+.08,5,z+1.01,1.85,1.75,.05,oak);box(g,x,4.83,z+1,w,.035,.04,glow);}
 function bathroom(g,idx,x,z,w,d,door='north'){
  const a=[x,z],b=[x+w,z],c=[x+w,z+d],dd=[x,z+d];
  wall(g,idx,a,b,9,.3,plaster,door==='north'?[[Math.min(1.1,w-3.2),3,0,7,'door']]:[]);wall(g,idx,b,c,9,.3,plaster);wall(g,idx,c,dd,9,.3,plaster);wall(g,idx,dd,a,9,.3,plaster,door==='west'?[[.8,3,0,7,'door']]:[]);
  floorpatch(g,x,z,w,d,tilefloor);box(g,x+.2,.06,z+.2,2.65,.16,2.75,white);beam(g,[x+.2,z+3],[x+2.85,z+3],.25,6.8,.035,glass);box(g,x+.3,5.8,z+.4,.12,1.2,.1,bronze);cyl(g,x+.35,7,z+.8,.28,.04,bronze);box(g,x+w-2,.15,z+.45,1.65,2.55,1.55,oak);box(g,x+w-2.05,2.7,z+.4,1.75,.15,1.65,white);orb(g,x+w-1.2,2.95,z+1.2,.5,white,.25);box(g,x+w-2,4,z+.16,1.65,2.5,.04,mirror);
  // A compact closed cistern and oval pan.
  box(g,x+w-2.1,.05,z+d-1.4,1.35,2.8,.65,white);const pan=orb(g,x+w-1.42,.95,z+d-1.75,.72,white,.65);pan.scale.z=1.0;cyl(g,x+w-1.42,1.33,z+d-1.75,.59,.1,white);pendant(g,x+w-1.2,z+1,7.8);
 }
 function doorWallX(g,idx,x,z0,z1,from,width=3){wall(g,idx,[x,z0],[x,z1],9,.3,plaster,[[from-z0,width,0,7,'door']]);}
 function doorWallZ(g,idx,z,x0,x1,from,width=3){wall(g,idx,[x0,z],[x1,z],9,.3,plaster,[[from-x0,width,0,7,'door']]);}
 function homeA(g,idx){
  const poly=clip(P,18,46,-10,26);slab(g,poly,.03,.03,woodfloor);
  outline(g,idx,poly,9,(a,b)=>{
   if(Math.abs(a[1])<.01&&Math.abs(b[1])<.01)return[projectOpening(a,b,21,8,2.2,6,'window'),projectOpening(a,b,34,9,2.2,6,'window')];
   if(Math.abs(a[1]-26)<.01&&Math.abs(b[1]-26)<.01){const low=Math.min(a[0],b[0]);return[[Math.min(Math.abs(42-a[0]),Math.abs(45-a[0])),3,0,7,'door']];}
   if(Math.abs(a[0]-18)<.01&&Math.abs(b[0]-18)<.01)return[[Math.min(Math.abs(5-a[1]),Math.abs(8-a[1])),3,0,7,'door']];return[];
  });
  doorWallX(g,idx,32,0,18,13.4);bed(g,23,2.2);sofa(g,33,2,6);rug(g,32.8,4.7,11.4,7.5);coffee(g,35,6.3);box(g,43.8,.1,7,1.6,1.8,5.3,oak);box(g,43.9,2,8,.12,3,3.3,dark);dining(g,35.5,10.4);kitchen(g,40.5,16,5);bathroom(g,idx,35,18,5,7);art(g,34.5,4.2,.28);plant(g,44,2);plant(g,33,21);
  box(g,28.4,.1,14,3.1,7.4,1.6,oak);for(let n=0;n<3;n++)box(g,28.5+n,3,15.63,.03,1.2,.05,brass);
  pendant(g,37.7,5.4);pendant(g,25.5,9.5);
 }
 function homeB(g,idx){
  const poly=clip(P,65,79,-10,27);slab(g,poly,.03,.03,woodfloor);
  outline(g,idx,poly,9,(a,b)=>{
   if(Math.abs(a[1]-roadZ(a[0]))<.02&&Math.abs(b[1]-roadZ(b[0]))<.02)return[projectOpening(a,b,66,11,2.2,6,'window')];
   if(a[1]===27&&b[1]===27)return[[Math.min(Math.abs(73-a[0]),Math.abs(76-a[0])),3,0,7,'door']];return[];
  });
  bed(g,66.5,1.5);sofa(g,73,1.5,5);rug(g,72,5.3,6,8,'#b6b9a7');coffee(g,74,7.3);table(g,74.7,12.3,2.5,2.5,2.55);chair(g,76,15.5);bathroom(g,idx,65,18,6,8);kitchen(g,72,21.5,6);box(g,65.3,.1,13.5,2,3.3,3.5,oak);plant(g,77.5,18);pendant(g,75,9);art(g,73.2,4.8,roadZ(73)+.3,3.5,2.3);
 }
 function homeC(g,idx){
  const poly=clip(P,79,120,-10,27);slab(g,poly,.03,.03,woodfloor);
  outline(g,idx,poly,9,(a,b)=>{
   if(Math.abs(a[1]-roadZ(a[0]))<.02&&Math.abs(b[1]-roadZ(b[0]))<.02)return[projectOpening(a,b,80,9,2.2,6,'window')];
   if(a[1]===27&&b[1]===27)return[[Math.min(Math.abs(81.5-a[0]),Math.abs(84.5-a[0])),3,0,7,'door']];return[];
  });
  bed(g,81.5,1);doorWallZ(g,idx,12,79,97,83);bathroom(g,idx,91,4,6,8,'west');sofa(g,81,14,6);rug(g,80.3,17,10.8,7);coffee(g,83,18);dining(g,91,18.2);kitchen(g,97,13,6.5);box(g,97,.15,21,3,1.6,2.1,oak);box(g,98,2,21,.18,3,3.5,dark);box(g,87.5,.1,1,2.5,7.2,1.7,oak);plant(g,100,18);pendant(g,85,19);pendant(g,84,7);art(g,81,4.4,12.22,3.5,2.2);
 }
 function core(g,idx,rise){
  floorpatch(g,46,0,19,29.25,tilefloor);floorpatch(g,41,27,45,8.25,tilefloor);
  wall(g,idx,[46,0],[53,0],idx===1?11:9,.45,ivory,[[1,4.5,0,8,'open']]);
  wall(g,idx,[53,0],[65,roadZ(65)],idx===1?11:9,.45,bronze,[[.6,10.5,1.5,6.5,'window']]);
  // Independent seven-foot spine and passenger lift; no vehicle platform.
  wall(g,idx,[53,0],[53,27],9,.35,plaster,[[1,4,0,7,'door'],[21.25,3.5,0,7,'open']]);
  wall(g,idx,[65,0],[65,27],9,.4,plaster);
  wall(g,idx,[53,19],[65,19],9,.35,plaster);wall(g,idx,[60,19],[60,27],9,.35,plaster);wall(g,idx,[53,27],[65,27],9,.35,plaster);
  floorpatch(g,53,19,7,8,tilefloor);box(g,59.76,.1,19.3,.05,7.2,7.3,mirror);box(g,53.3,7.25,21.2,.1,.1,3.5,glow);box(g,53.24,3.6,25,.08,.65,.35,bronze);
  // Dogleg stairs rise to the next level. Vertical travel is provided by the floor selector.
  if(idx<3){const n=11,stepD=1.03,riseHalf=rise/2;for(let i=0;i<n;i++){box(g,53.5,i*riseHalf/n,2.5+i*stepD,5,riseHalf/n,stepD,concrete);box(g,59.5,riseHalf+(n-1-i)*riseHalf/n,2.5+i*stepD,5,riseHalf/n,stepD,concrete);}box(g,53.5,riseHalf-.5,13.8,11,.5,4.7,concrete);rail(g,[59,2.5],[59,13.8],0);rail(g,[64.65,2.5],[64.65,13.8],riseHalf);}
  for(let x=53.3;x<65;x+=.85)box(g,x,.15,roadZ(x)-.5,.18,idx===1?12.1:10.25,.4,oak);
  for(const [a,b] of [[[41,35.25],[53,35.25]],[[74,35.25],[84,35.25]]])rail(g,a,b,0);
  plant(g,50.5,27.5,0,.9);pendant(g,49.5,10,idx===1?9.8:8);
 }
 function shelves(g,x,z,w=6,d=.9){box(g,x,0,z,w,6.5,.16,oak);for(let j=0;j<4;j++){box(g,x,.8+j*1.45,z,w,.1,d,oak);for(let n=0;n<Math.floor(w/.65);n++){const m=mat(['#b4a68d','#d9d3bd','#778c7e','#b79470'][n%4]);box(g,x+.15+n*.65,.92+j*1.45,z+.13,.42,.7+(n%3)*.12,.45,m);}}}
 function shop(g,idx,x0,x1,z1,num){
  const poly=clip(P,x0,x1,-10,z1);slab(g,poly,.035,.035,tilefloor);
  outline(g,idx,poly,11,(a,b)=>{
   const onRoad=Math.abs(a[1]-roadZ(a[0]))<.02&&Math.abs(b[1]-roadZ(b[0]))<.02;
   if(onRoad){const len=Math.hypot(b[0]-a[0],b[1]-a[1]);return[[.7,Math.max(1,len-5.1),.15,8.7,'window'],[Math.max(2,len-4.15),3.3,0,8.8,'open']];}
   if(a[1]===z1&&b[1]===z1&&num>1){return[[1.2,3,0,7,'door']];}return[];
  });
  if(num===1){kitchen(g,25,18,6);table(g,22,5,2.4,2.4,2.55);chair(g,23.2,8.3);chair(g,23.2,3.9,Math.PI);table(g,27.5,10,2.4,2.4,2.55);chair(g,28.7,13.3);chair(g,28.7,8.9,Math.PI);pendant(g,23.2,6.2,9.4);pendant(g,28.7,11.2,9.4);plant(g,28,2);shelves(g,30.5,15,1,.8);}
  else if(num===2){shelves(g,33,20.5,10);shelves(g,32.5,6,1,5);table(g,36,10,4,5,2.8);box(g,41,1.7,18,3.7,1.4,2.4,green);plant(g,34,2);pendant(g,39,10,9.5);}
  else if(num===3){shelves(g,65.6,22.3,12);shelves(g,65.5,6,1,5.5);table(g,69,9,5,4,2.8);box(g,74,0,18,4,3.2,2.3,oak);plant(g,66.5,1.7);pendant(g,72,11,9.5);}
  else {shelves(g,82,24.5,11);table(g,85,13,6,4,2.75);shelves(g,98,17,3);box(g,93,0,21,4.5,3.3,2.2,green);plant(g,81,1);pendant(g,88,14,9.5);}
  return poly;
 }
 function car(g,x,z,turn,color){const cg=new THREE.Group();g.add(cg);cg.position.set(x,.1,z);cg.rotation.y=turn;box(cg,-3.1,.7,-7.4,6.2,1.8,14.8,mat(color,.25,{metalness:.4}));box(cg,-2.7,2.4,-3.5,5.4,2.1,7.5,mat(color,.3,{metalness:.4}));box(cg,-2.58,2.72,-3.58,5.16,1.38,.06,mirror);box(cg,-2.58,2.72,4.02,5.16,1.38,.06,mirror);for(const xx of [-3.32,3.32]){box(cg,xx,2.72,-3.18,.03,1.38,6.7,mirror);for(const zz of [-4.8,4.8]){const tire=cyl(cg,xx,.7,zz,1.06,.45,dark);tire.rotation.z=Math.PI/2;tire.position.y=1.05;const hub=cyl(cg,xx+Math.sign(xx)*.25,.7,zz,.6,.46,bronze);hub.rotation.z=Math.PI/2;hub.position.y=1.05;}}box(cg,-2.7,1.5,-7.45,1.25,.45,.07,glow);box(cg,1.45,1.5,-7.45,1.25,.45,.07,glow);return cg;}
 // Context is deliberately diagrammatic: no surveyed road or terrain levels are claimed.
 slab(context,[[-150,-120],[220,-120],[220,170],[-150,170]],-10.75,.5,mat('#b3bca3'));
 slab(context,[[-35,-21],[58,-21],[111,-27],[113,-6],[90.43,-4.118],[56.68,0],[-35,0]],-.06,1.5,mat('#777e7b'));
 beam(context,[-35,0],[56.68,0],-9.95,8.45,.9,stone);beam(context,[56.68,0],[90.43,-4.118],-9.95,8.45,.9,stone);
 for(let x=-25;x<103;x+=12)beam(context,[x,roadZ(x)-12],[x+6,roadZ(x+6)-12],.02,.025,.18,mat('#d5d1bf'));
 slab(context,[[-4,3],[0,0],[52.24,43.54],[62.56,47.31],[61,54],[46,49]],-10.08,.25,mat('#b5b6ac'));
 // Low-key neighbouring masses and tree groups establish scale without inventing a mapped context.
 for(const [x,z,w,d,h] of [[-34,30,18,22,19],[121,39,24,22,22],[84,81,31,25,16]]){box(context,x-.4,-10.75,z-.4,w+.8,4.167,d+.8,stone);box(context,x,-6.583,z,w,h,d,mat('#c1c4b5'));box(context,x-1,h-6.6,z-1,w+2,.6,d+2,roofmat);for(let xx=x+3;xx<x+w-3;xx+=6)box(context,xx,2,z-.1,3,5,.05,mat('#7f928a'));}
 for(const [x,z,s] of [[-13,25,1],[6,38,1.1],[37,59,.9],[117,19,1.1],[109,61,1.3],[130,76,1.5],[-25,63,1.8],[65,93,2.1]]){cyl(context,x,-10.5,z,.55*s,12*s,oak);for(let j=0;j<3;j++)orb(context,x+(j-1)*1.6*s,(3+j*3)*s-5,z+Math.sin(j)*2*s,4.5*s,mat(j===1?'#718267':'#899879'),1.3);}
 // Lower level with four ordinary bays and an assumed open side connection.
 const pg=levels[0];slab(pg,P,0,.65,concrete);
 P.forEach((a,i)=>{const b=P[(i+1)%P.length];if(i<2)return;const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(i===6)wall(pg,0,a,b,8.5,.65,stone,[[10.5,17,0,8.5,'open']]);else wall(pg,0,a,b,8.5,.65,stone);});
 for(const [x,z,w,d] of [[83,7,17,8.5],[81,16.5,17,8.5],[59,33,17,8.5],[34.5,2,8.5,17]]){for(const [a,b] of [[[x,z],[x+w,z]],[[x+w,z],[x+w,z+d]],[[x+w,z+d],[x,z+d]],[[x,z+d],[x,z]]])beam(pg,a,b,.02,.025,.13,mat('#ebe8d8'));}
 car(pg,91.5,11.25,Math.PI/2,'#dee0d7');car(pg,89.5,20.75,Math.PI/2,'#627e80');car(pg,67.5,37.25,Math.PI/2,'#a99b84');car(pg,38.75,10.5,0,'#a7afb3');core(pg,0,10);
 for(const [x,z] of [[18,.35],[32,.35],[46,.35],[53,.35],[65,-.65],[79,-2.3],[90,-3.6],[32,23.5],[46,24],[53,27],[65,27],[79,27],[99,16],[58,43]]){box(pg,x-.4,0,z-.4,.8,8.5,.8,concrete);solids[0].push([x-.65,z-.65,x+.65,z+.65]);}
 for(const [x,z] of [[42,23],[75,28],[91,8]])box(pg,x,8.05,z,3,.08,.35,glow);
 // Four road-facing shops and independent lobby.
 const rg=levels[1];slab(rg,P,0,1.5,concrete);shop(rg,1,13,32,22,1);shop(rg,1,32,46,24,2);shop(rg,1,65,79,27,3);shop(rg,1,79,120,27,4);core(rg,1,12.5);bathroom(rg,1,53,35.25,8,8);bathroom(rg,1,61,35.25,6,8);shelves(rg,68.5,39.5,5);doorWallZ(rg,1,35.25,68,74,69.5);wall(rg,1,[68,35.25],[68,41.25],9);wall(rg,1,[74,35.25],[74,41.25],9);
 for(const x of [8,35,44,77])if(inside(x,Math.max(5,x*.65)))plant(rg,x,Math.max(5,x*.65),0,1.1);
 // Canopy strips are set back into the boundary rather than projecting into the road.
 for(const [x0,x1] of [[14,45.7],[65.2,89.8]])beam(rg,[x0,roadZ(x0)+.6],[x1,roadZ(x1)+.6],10.2,.26,1.2,bronze);
 // Two identical furnished residential plates.
 for(const idx of [2,3]){
  const g=levels[idx];
  for(const poly of [clip(P,18,46,-10,26),clip(P,46,65,-10,29.25),clip(P,65,120,-10,27),clip(P,41,86,27,35.25),clip(P,41,53,26,29.25),clip(P,53,74,35.25,43.25)])slab(g,poly,0,1.5,concrete);
  // Private tapered terrace A and small planted rear pockets.
  const terrace=clip(P,0,18,-10,30);slab(g,terrace,0,1.5,concrete);slab(g,terrace,.025,.025,tilefloor);terrace.forEach((a,i)=>{const b=terrace[(i+1)%terrace.length];if(!(Math.abs(a[0]-18)<.02&&Math.abs(b[0]-18)<.02))rail(g,a,b,0);});table(g,14,5.5,2,2,2.2);chair(g,15,8.6);plant(g,16,2.4);
  homeA(g,idx);homeB(g,idx);homeC(g,idx);core(g,idx,10.5);
  const service=clip(P,53,74,35.25,43.25);outline(g,idx,service,8.5,(a,b)=>a[1]===35.25&&b[1]===35.25?[[2,3,0,7,'door'],[16.5,3,0,7,'door']]:[]);
  wall(g,idx,[67,35.25],[67,43.25],8.5);shelves(g,58,41.8,7);for(let i=0;i<2;i++){box(g,53.4+i*2.9,.05,38,2.55,2.8,2.55,white);const face=cyl(g,54.7+i*2.9,.2,40.6,.75,.07,mirror);face.rotation.x=Math.PI/2;face.position.y=1.5;}plant(g,78,31.5);plant(g,44,32.5);
 }
 // A shallow standing-seam roof over occupied rooms. Rear gallery stays open.
 const mainRoof=clip(P,18,120,-10,27);
 slab(roof,mainRoof,33.5,1.5,concrete);
 function roofPanel(poly,base){const shape=new THREE.Shape(poly.map(([x,z])=>new THREE.Vector2(x,-z)));const ge=new THREE.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:false});ge.rotateX(-Math.PI/2);const pos=ge.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,pos.getY(i)+base+pos.getZ(i)*.065);pos.needsUpdate=true;ge.computeVertexNormals();const obj=new THREE.Mesh(ge,roofmat);obj.castShadow=true;obj.receiveShadow=true;roof.add(obj);}
 roofPanel(mainRoof,34.2);roofPanel(clip(P,53,74,35.25,43.25),33.5);
 for(let x=19;x<113;x+=2.1){const q=clip(mainRoof,x-.025,x+.025);if(q.length>2){const zz=q.map(p=>p[1]);const z0=Math.min(...zz),z1=Math.max(...zz);const o=beam(roof,[x,z0],[x,z1],34.42,.07,.09,bronze);if(o){o.rotation.x=Math.atan(.065);o.position.y+=((z0+z1)/2)*.065;}}}
 // Solid furniture keeps first-person travel out of beds, cabinets and parked cars.
 for(const i of [0,1,2])solids[i].push([53.45,2.5,64.55,18.5]);
 solids[0].push([84,8,99,14.5],[82,17.5,97,24],[60,34,75,40.5],[35.5,3,42,18]);
 solids[1].push([25,18,31,20.2],[22,5,24.4,7.4],[27.5,10,29.9,12.4],[36,10,40,15],[41,18,44.7,20.4],[69,9,74,13],[74,18,78,20.3],[85,13,91,17],[93,21,97.5,23.2]);
 for(const i of [2,3])solids[i].push([22.9,2.1,28.1,8.8],[33,2,39,4.8],[35,6.3,38.3,8.4],[35.5,10.4,38.7,13.6],[43.8,7,45.4,12.3],[40.5,16,45.5,18.2],[66.4,1.4,71.6,8.1],[73,1.5,78,4.3],[74,7.3,77.3,9.4],[74.7,12.3,77.2,14.8],[72,21.5,78,23.7],[81.4,.9,86.6,7.6],[81,14,87,16.8],[83,18,86.3,20.1],[91,18.2,94.2,21.4],[97,13,103.5,15.2],[87.5,1,90,2.7]);
 return {root,context,levels,roof,walls,solids,doors};
}
