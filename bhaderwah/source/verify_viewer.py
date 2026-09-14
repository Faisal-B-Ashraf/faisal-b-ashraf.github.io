
from pathlib import Path
import subprocess,time,json
from playwright.sync_api import sync_playwright
root=Path('bhaderwah/review');root.mkdir(exist_ok=True)
server=subprocess.Popen(['python3','-m','http.server','8800'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=browser.new_page(viewport={'width':1440,'height':980},device_scale_factor=1)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('http://127.0.0.1:8800/bhaderwah/',wait_until='networkidle')
  page.wait_for_selector('#loading',state='detached',timeout=90000)
  assert page.locator('.error-copy').count()==0,'3D viewer fallback appeared'
  page.screenshot(path=str(root/'viewer-exterior.png'))
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
