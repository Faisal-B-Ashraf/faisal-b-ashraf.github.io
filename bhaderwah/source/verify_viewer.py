
from pathlib import Path
import subprocess,time,json
from playwright.sync_api import sync_playwright
root=Path('bhaderwah/review');root.mkdir(exist_ok=True)
server=subprocess.Popen(['python3','-m','http.server','8800'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=browser.new_page(viewport={'width':1280,'height':872},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:8800/bhaderwah/',wait_until='networkidle')
  page.wait_for_selector('#loading',state='detached',timeout=90000)
  assert page.locator('.error-copy').count()==0,'3D viewer fallback appeared'
  page.screenshot(timeout=90000,path=str(root/'viewer-exterior.png'))
  page.locator('[data-floor="1"]').click();page.locator('[data-mode="plan"]').click();page.wait_for_timeout(1300)
  page.screenshot(path=str(root/'viewer-shops.png'))
  for name,file in [('Café & bakery','cafe'),('Print & stationery','print'),('Convenience store','convenience'),('Pharmacy','pharmacy')]:
   page.get_by_role('button',name=name,exact=False).click();page.wait_for_timeout(300)
   page.screenshot(path=str(root/f'viewer-{file}.png'))
  page.locator('[data-floor="0"]').click();page.locator('[data-mode="plan"]').click();page.wait_for_timeout(1000)
  page.screenshot(path=str(root/'viewer-parking.png'))
  assert not errors,errors
  (root/'viewer-check.json').write_text(json.dumps({'webgl':True,'shops':4,'parking':True,'page_errors':errors}))
  browser.close()
finally:
 server.terminate()

import base64,io,zipfile
from PIL import Image
contact=Image.new('RGB',(1280,872),'white')
for i,name in enumerate(['cafe','print','convenience','pharmacy']):
 im=Image.open(root/f'viewer-{name}.png').convert('RGB');im.thumbnail((640,436));contact.paste(im,((i%2)*640,(i//2)*436))
out=io.BytesIO();contact.save(out,format='JPEG',quality=85);(root/'shops-contact.b64').write_text(base64.b64encode(out.getvalue()).decode())
for name in ['shops','parking','exterior']:
 im=Image.open(root/f'viewer-{name}.png').convert('RGB');im.thumbnail((1280,872));out=io.BytesIO();im.save(out,format='JPEG',quality=87);(root/f'viewer-{name}.b64').write_text(base64.b64encode(out.getvalue()).decode())
site=Path('bhaderwah')
(site/'README.md').write_text("""Bhaderwah House — R03

Interactive concept: four fitted road-level shops, two upper residential floors and four lower parking bays. Separate parking entry and exit point toward a proposed road ramp; ramp geometry and land availability remain to be developed.

Open via a static web server. The PDF and exterior rendering are included. Three.js license: third-party-notices.txt.

Concept only; not for construction.
""")
names=['index.html','app.js','model.js','navigation.js','style.css','exterior.png','Bhaderwah_Concept_R03.pdf','README.md','third-party-notices.txt']
with zipfile.ZipFile(site/'Bhaderwah_R03_Website.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
 for name in names:z.write(site/name,name)
 for path in sorted((site/'lib').rglob('*')):
  if path.is_file():z.write(path,path.relative_to(site))
print('Saved presentation ZIP, PDF and visual checks.')
