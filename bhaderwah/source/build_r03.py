
from pathlib import Path
import math,io,json
import pymupdf as fitz
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor,white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
ROOT=Path('bhaderwah')
F=Path('/usr/share/fonts/truetype/dejavu')
for n,f in [('Sans','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Serif','DejaVuSerif.ttf')]:pdfmetrics.registerFont(TTFont(n,str(F/f)))
W,H=1190.55,841.89
INK='#233B40';TEAL='#386F6C';GRAY='#67767A';PAPER='#F7F5F0';GOLD='#AF8551';RULE='#D8DDDA'
P=[[0,0],[56.67888,0],[90.42987,-4.11816],[112.56747,16.85177],[70.35568,45.46508],[62.56395,47.31187],[52.24337,43.54375]]
def clipped(poly,x0=-1e5,x1=1e5,z0=-1e5,z1=1e5):
 a=poly[:]
 for axis,bound,side in [(0,x0,1),(0,x1,-1),(1,z0,1),(1,z1,-1)]:
  out=[]
  for i,q in enumerate(a):
   p=a[i-1];ip=(p[axis]-bound)*side>=0;iq=(q[axis]-bound)*side>=0
   if ip!=iq:
    t=(bound-p[axis])/(q[axis]-p[axis]);out.append([p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])])
   if iq:out.append(q)
  a=out
 return a
buf=io.BytesIO();c=canvas.Canvas(buf,pagesize=(W,H))
def txt(x,y,s,size=10,col=INK,font='Sans',align='left'):
 c.setFont(font,size);c.setFillColor(HexColor(col));getattr(c,{'left':'drawString','center':'drawCentredString','right':'drawRightString'}[align])(x,y,s)
def para(x,y,s,w,size=10,col=GRAY):
 p=Paragraph(s,ParagraphStyle('body',fontName='Sans',fontSize=size,leading=size*1.5,textColor=HexColor(col)));_,h=p.wrap(w,500);p.drawOn(c,x,y-h);return y-h
def ln(a,b,col=INK,width=.8):
 c.setStrokeColor(HexColor(col));c.setLineWidth(width);c.line(*a,*b)
def point(x,z):return 65+x*6.2,570-z*6.2
def line(a,b,col=INK,width=.8):ln(point(*a),point(*b),col,width)
def poly(q,fill=None,col=INK,width=.8):
 if len(q)<3:return
 path=c.beginPath();path.moveTo(*point(*q[0]))
 for xy in q[1:]:path.lineTo(*point(*xy))
 path.close();c.setLineWidth(width);c.setStrokeColor(HexColor(col))
 if fill:c.setFillColor(HexColor(fill))
 c.drawPath(path,stroke=1,fill=bool(fill))
def reg(x0,x1,z0,z1,fill):poly(clipped(P,x0,x1,z0,z1),fill)
def rect(x,z,w,d,fill=None,col=INK):poly([[x,z],[x+w,z],[x+w,z+d],[x,z+d]],fill,col,.6)
def lab(x,z,lines,size=7.8,col=INK):
 for i,s in enumerate(lines):txt(*point(x,z+i*size/6.2*1.22),s,size,col,'Bold' if i==0 else 'Sans','center')
def arrow(a,b):
 line(a,b,TEAL,1.6);dx=b[0]-a[0];dz=b[1]-a[1];r=math.hypot(dx,dz);u,v=dx/r,dz/r
 line(b,[b[0]-2*u-v,b[1]-2*v+u],TEAL,1.6);line(b,[b[0]-2*u+v,b[1]-2*v-u],TEAL,1.6)
def base(page,kicker,title,subtitle):
 c.setFillColor(HexColor(PAPER));c.rect(0,0,W,H,fill=1,stroke=0)
 txt(48,792,'BHADERWAH',15,TEAL,'Bold');txt(188,792,'COMMERCIAL + LIVING',8,GRAY)
 txt(W-49,804,'BHADERWAH / CONCEPT',10,TEAL,'Bold','right');txt(W-49,786,'FAMILY CONCEPT  ·  R03  ·  14 SEP 2026',8,GRAY,'Sans','right')
 ln((48,770),(W-48,770),RULE)
 txt(48,740,kicker,10,TEAL,'Bold');txt(48,703,title,28,INK,'Serif');txt(48,674,subtitle,10,GRAY)
 ln((48,57),(W-48,57),RULE);txt(48,39,'Bhaderwah  |  University Road  |  Concept R03',8,GRAY)
 txt(W-49,39,'CONCEPT ONLY  /  NOT FOR CONSTRUCTION     '+str(page).zfill(2)+' / 08',8,GRAY,'Sans','right')
def context():
 poly([[0,-12],[56.68,-12],[90.43,-16],[90.43,-4.118],[56.68,0],[0,0]],'#E7E7DF','#E7E7DF')
 lab(43,-7,['UNIVERSITY ROAD  /  ROAD LEVEL ±0 ft'],8.5,GRAY)
 poly(P,'#FFFFFF')
 dims=["56′8″","34′0″","30′6″","51′0″","8′0″","11′0″","68′0″"]
 for i,a in enumerate(P):
  b=P[(i+1)%7];dx=b[0]-a[0];dz=b[1]-a[1];le=math.hypot(dx,dz);nx=dz/le*4.5;nz=-dx/le*4.5
  aa=[a[0]+nx,a[1]+nz];bb=[b[0]+nx,b[1]+nz];line(aa,bb,GOLD,.5);line(a,[a[0]+nx*1.2,a[1]+nz*1.2],GOLD,.5);line(b,[b[0]+nx*1.2,b[1]+nz*1.2],GOLD,.5)
  px,py=point((aa[0]+bb[0])/2,(aa[1]+bb[1])/2);c.saveState();c.translate(px,py);angle=-math.degrees(math.atan2(dz,dx))
  if angle<-90:angle+=180
  if angle>90:angle-=180
  c.rotate(angle);txt(0,4,dims[i],8,GOLD,align='center');c.restoreState()
 txt(65,215,'GRAPHIC SCALE  /  DO NOT SCALE FOR CONSTRUCTION',7.5,GRAY)
 for i in range(4):c.setFillColor(HexColor(INK if i%2==0 else '#FFFFFF'));c.rect(65+i*31,201,31,4,fill=1,stroke=0)
 for x,s in [(65,'0'),(127,'10'),(189,'20 feet')]:txt(x,189,s,7,GRAY)
 txt(530,250,'NEIGHBOURING OPEN PLOT',7.7,GRAY)
def core(parking=False):
 rect(46,0,7,29.25,'#E3E8E8');rect(53,0,12,19,'#D8DFDF');rect(53,19,7,8,'#DCE3EC');rect(60,19,5,8,'#E3E8E8')
 for z in [2+i*.8 for i in range(19)]:line([53.6,z],[58.6,z],GRAY,.4);line([59.5,z],[64.4,z],GRAY,.4)
 lab(59,8,['STAIR','12′ × 19′','UP'],8);lab(56.5,22,['LIFT','7′ × 8′'],7);lab(49.5,11,['7′','ENTRY'],7)
 line([47,0],[51.5,0],'#FFFFFF',3)
 if not parking:
  reg(41,86,27,35.25,'#E3E8E8');rect(46,26.5,7,3,'#E3E8E8','#E3E8E8')
  lab(68,31,['COMMON SERVICE LOBBY  /  8′3″'],7.6)
  rect(53,35.25,8,8,'#C9E0E5');rect(61,35.25,6,8,'#C9E0E5');rect(68,35.25,6,6,'#E9E0D2')
  lab(57,39,['WC 01'],7);lab(64,39,['WC 02'],7);lab(71,38,['STORE','6′ × 6′'],6.7)
def sidebar(rows):
 y=640
 for i,(title,body) in enumerate(rows,1):
  txt(892,y,str(i).zfill(2),10,GOLD,'Bold');txt(920,y,title,12,INK,'Bold')
  y=para(920,y-16,body,222,9.7)-25
def footer(s):para(50,82,s,1090,8,GRAY)
base(3,'02 / LOWER GROUND  ·  PROPOSED FFL -10′0″','Parking below the road-level slab','Four ordinary bays, a footpath-side entry and an opposite-side exit toward a proposed road ramp.')
context();reg(0,31,-10,50,'#EEEDE5');lab(21,8,['NON-PARKING','TAPERED ZONE'],8,GRAY);core(True)
for x,z,w,d,n in [(83,7,17,8.5,'P1'),(81,16.5,17,8.5,'P2'),(59,33,17,8.5,'P3'),(34.5,2,8.5,17,'P4')]:
 rect(x,z,w,d,'#EDF1EA',TEAL);rect(x+.8,z+.8,w-1.6,d-1.6,'#C6D5D6',GRAY);lab(x+w/2,z+d/2,[n],9,TEAL)
lab(72,17,['PARKING COURT','Manoeuvring space'],8);rect(47,33,6,5,'#E9E0D2');lab(50,35.5,['PLANT'],7)
G,A=P[6],P[0];L=math.dist(G,A)
for p,q in [([G[0]+(A[0]-G[0])*10.5/L,G[1]+(A[1]-G[1])*10.5/L],[G[0]+(A[0]-G[0])*27.5/L,G[1]+(A[1]-G[1])*27.5/L]),([P[2][0]+(P[3][0]-P[2][0])*6/30.5,P[2][1]+(P[3][1]-P[2][1])*6/30.5],[P[2][0]+(P[3][0]-P[2][0])*20/30.5,P[2][1]+(P[3][1]-P[2][1])*20/30.5])]:line(p,q,'#FFFFFF',4)
arrow([27,36],[44,25]);lab(32,42,['SIDE ENTRY'],8,TEAL);arrow([90,4],[105,3]);lab(94,0,['EXIT TO RAMP'],6.7,TEAL)
sidebar([('Four parking bays','Each bay is 8′6″ × 17′0″. The former vehicle-lift reservation is an ordinary parking bay.'),
 ('Separate entry + exit','Entry is from the footpath side. The opposite-side exit points toward a proposed ramp connecting up to road level.'),
 ('Independent pedestrian route','Parking users reach the stair and passenger lift through their own lobby. Access to the homes does not pass through a shop.'),
 ('Ramp to be developed','Gateways and arrows show the intended connection. Confirm ramp alignment, gradient, transitions, turning room and land availability.')])
para(65,155,'<b>Level strategy.</b> The shops stay flush with the road. Proposed parking FFL is -10′0″; the earlier reported plot level is approximately -6′7″. Excavation, structure and drainage require development against a measured survey.',760,10,INK)
footer('Access and parking are conceptual. Four bays are indicative; vehicle swept paths, structural clearances and the final parking requirement remain to be checked.')
c.showPage()
base(4,'03 / ROAD LEVEL  ·  PROPOSED FFL ±0′0″','Four shops with a clear commercial identity','Illustrative fit-outs for everyday needs, campus-serving retail and a compact café.')
context();reg(0,13,-10,50,'#CAD6BD');reg(13,32,-10,22,'#EAD8B7');reg(32,46,-10,24,'#EAD8B7');reg(65,79,-10,27,'#EAD8B7');reg(79,120,-10,27,'#E5CDAC');core()
for x,z,w,d in [(25,18,6,2.2),(25,14.4,6,2.25),(33,20,5.5,2.5),(40.5,20,4.4,2.2),(32.65,6,1.1,12),(36,9,2,7),(65.6,6,1.1,14),(70,7,2.4,10),(75.5,1,2.8,2.25),(74.2,20,4.1,2.3),(80.6,12,1.5,8),(84,17,11,2.5),(98,17,2.2,2.2),(82,24.6,12,.9)]:rect(x,z,w,d,'#E9E0D2',GRAY)
for x,z in [(22,5),(27.5,10)]:rect(x,z,2.4,2.4,'#FFFFFF',GRAY)
lab(20,11,['01 / CAFÉ'],7.8);lab(41,8,['02 / PRINT','STATIONERY'],7.2);lab(72,24,['03 / DAILY NEEDS'],6.6);lab(90,9,['04 / PHARMACY','Dispensing + health'],7.6)
road=lambda x:0 if x<=P[1][0] else (x-P[1][0])*P[2][1]/(P[2][0]-P[1][0])
for a,b in [(13,32),(32,46),(65,79),(79,P[2][0])]:
 le=math.hypot(b-a,road(b)-road(a));k=(b-a)/le;x=a+(le-4.15)*k;w=3.3*k
 line([a+.7*k,road(a+.7*k)],[a+(le-4.4)*k,road(a+(le-4.4)*k)],'#8DB7B8',2)
 line([x,road(x)],[x+w,road(x+w)],'#FFFFFF',3);line([x,road(x)],[x,road(x)+3],GRAY,.6)
for x,z in [(41.8,24),(72,27),(81.5,27)]:line([x,z],[x+3,z],'#FFFFFF',3);line([x,z],[x,z-3],GRAY,.5)
sidebar([('Café + bakery','Coffee bar, espresso machine, glazed pastry display and compact café seating. A tapered tenancy with a 19-foot frontage.'),
 ('Print + stationery','Books and stationery shelving, a copier counter and checkout within a nominal 14 × 24-foot bay.'),
 ('Convenience store','Grocery shelves, produce display, chilled drinks and a checkout counter within a nominal 14 × 26-foot bay.'),
 ('Pharmacy','Medicine shelves, dispensing counter and health-product displays. A 17 × 12-foot rectangular core sits within the corner tenancy.')])
para(65,155,'<b>Shared support.</b> Four independent shopfront entrances sit beside the dedicated stair and passenger-lift lobby. Common toilets and storage serve the commercial floor. Tenant demand, licensing and service requirements will inform final leasing.',760,10,INK)
footer('Fit-outs illustrate the proposed uses. Internal sizes are nominal and subject to wall build-ups, columns and services. This is a concept presentation, not an approved construction drawing.')
c.showPage();c.save()
planpages=fitz.open(stream=buf.getvalue(),filetype='pdf')
doc=fitz.open(ROOT/'Bhaderwah_Concept_R02.pdf')
doc.delete_page(3);doc.delete_page(2);doc.insert_pdf(planpages,from_page=0,to_page=1,start_at=2)

# Coordinate retained cover, site basis, upper-floor sheets and schedule.
new_url='https://faisal-b-ashraf.github.io/bhaderwah/'
paper=tuple(int(PAPER[i:i+2],16)/255 for i in (1,3,5))
ink=tuple(int(INK[i:i+2],16)/255 for i in (1,3,5))
gray=tuple(int(GRAY[i:i+2],16)/255 for i in (1,3,5))
def fontpage(p):
 p.insert_font(fontname='FRegular',fontfile=str(F/'DejaVuSans.ttf'))
 p.insert_font(fontname='FBold',fontfile=str(F/'DejaVuSans-Bold.ttf'))
def area(p,box,text,size=9.3,fill=paper):
 r=fitz.Rect(box);p.add_redact_annot(r,fill=fill);p.apply_redactions(images=0,graphics=0)
 fontpage(p);ret=p.insert_textbox(r,text,fontname='FRegular',fontsize=size,lineheight=1.25,color=gray)
 assert ret>=0, ('Text overflow',box,text,ret)
def phrase(p,old,new,size=9.3):
 rr=p.search_for(old)
 assert rr, ('Missing phrase',old)
 r=rr[0]
 for q in rr[1:]:r|=q
 area(p,(r.x0,r.y0-1,1140,r.y1+17),new,size)
for p in doc:
 replacements=[]
 for b in p.get_text('dict')['blocks']:
  for l in b.get('lines',[]):
   for sp in l['spans']:
    if 'R02' in sp['text']:
     replacements.append(sp);p.add_redact_annot(fitz.Rect(sp['bbox']),fill=paper)
 if replacements:
  p.apply_redactions(images=0,graphics=0);fontpage(p)
  for sp in replacements:
   n=sp['color'];col=((n>>16&255)/255,(n>>8&255)/255,(n&255)/255)
   p.insert_text(sp['origin'],sp['text'].replace('R02','R03'),fontname='FBold' if 'Bold' in sp['font'] else 'FRegular',fontsize=sp['size'],color=col)
p=doc[0]
area(p,(50,588,205,630),'Separate parking entry and exit; proposed road ramp.',9.5)
area(p,(50,739,600,757),'faisal-b-ashraf.github.io/bhaderwah/',8.5)
# Replace the old linked QR and both link targets.
oldlinks=p.get_links()
for lk in oldlinks:
 if 'chatgpt.site' in lk.get('uri',''):p.delete_link(lk)
qrbox=fitz.Rect(1049,667.89,1127,745.89)
p.add_redact_annot(qrbox,fill=(1,1,1));p.apply_redactions(images=2,graphics=2)
import qrcode
q=qrcode.make(new_url);out=io.BytesIO();q.save(out,format='PNG');p.insert_image(qrbox,stream=out.getvalue())
for r in [fitz.Rect(50,696.89,570,738.89),qrbox]:p.insert_link({'kind':fitz.LINK_URI,'from':r,'uri':new_url})
area(doc[1],(728,540,1140,576),'Pedestrian entry stays on University Road. Parking enters at the footpath side and exits opposite toward a proposed road ramp; its alignment and land availability require confirmation.',9.1)
p=doc[7]
phrase(p,'Tapered campus-end tenancy; independent road-facing entrance.','Café and bakery: coffee bar, pastry display and compact seating.')
phrase(p,'Two regular shops; the former vehicle-lift bay is now Retail 02.','Print / stationery and convenience store with dedicated commercial fittings.')
phrase(p,"Corner tenancy within the actual 34' road segment; tapered parts support fit-out.",'Pharmacy: dispensing counter, medicine shelves and health-product displays.')
phrase(p,'Footpath-side access assumed; approach geometry is outside this concept.','Separate footpath-side entry and opposite exit toward a proposed road ramp.')
area(p,(614,601,1140,645),'Access + operations. Develop separate parking entry / exit, ramp alignment, slope, transitions and turning space. Confirm land availability, the passenger-lift layout, stair strategy, fire separation and accessible routes.',9.2)
doc.set_metadata({'title':'Bhaderwah House | Concept R03','author':'','subject':'Four fitted shops, lower parking and proposed separate access routes','keywords':'Bhaderwah, R03, concept'})
pdf=ROOT/'Bhaderwah_Concept_R03.pdf';doc.save(pdf,garbage=4,deflate=True)
check=fitz.open(pdf)
assert len(check)==8
assert 'R02' not in ''.join(p.get_text() for p in check)
assert 'chatgpt.site' not in ''.join(p.get_text() for p in check)
review=ROOT/'review';review.mkdir(exist_ok=True)
for i in [0,1,2,3,7]:check[i].get_pixmap(matrix=fitz.Matrix(1,1)).save(review/f'r03-page-{i+1}.png')
(review/'r03-text.txt').write_text('\n\n'.join(p.get_text() for p in check))
print('Saved eight-page R03 plans with GitHub links and coordinated shop / parking pages.')

import base64
from PIL import Image
for i in [0,1,2,3,7]:
 im=Image.open(review/f'r03-page-{i+1}.png');b=io.BytesIO();im.save(b,format='JPEG',quality=87)
 (review/f'r03-page-{i+1}.b64').write_text(base64.b64encode(b.getvalue()).decode())
