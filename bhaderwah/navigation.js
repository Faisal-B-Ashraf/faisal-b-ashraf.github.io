import {inside} from './model.js';
function distance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],len=dx*dx+dz*dz;const t=len?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/len)):0;return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
export function canOccupy(x,z,f,model){
 const onPlot=inside(x,z),outsideRoad=f===1&&z<1&&z>-19&&x>3&&x<109,outsideSide=f===0&&x>24&&x<54&&z>22&&z<45;
 if(!(onPlot||outsideRoad||outsideSide))return false;
 if(model.walls[f].some(([a,b])=>distance(x,z,a,b)<.34))return false;
 if(model.solids[f].some(([x0,z0,x1,z1])=>x>x0-.2&&x<x1+.2&&z>z0-.2&&z<z1+.2))return false;
 if(f>=2){const plate=(x<=18)||(x>=18&&x<=46&&z<=26)||(x>=46&&x<=65&&z<=29.25)||(x>=41&&x<=53&&z>=26&&z<=29.25)||(x>=65&&z<=27)||(x>=41&&x<=86&&z>=27&&z<=35.25)||(x>=53&&x<=74&&z>=35.25&&z<=43.25);if(!plate)return false;}
 return true;
}
