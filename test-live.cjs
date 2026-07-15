const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ ignoreHTTPSErrors: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) {
      console.log('PAGE RESPONSE ERROR:', response.url(), response.status());
    }
  });

  console.log('Visiting live site...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log('Body length:', bodyHTML.length);
  
  await browser.close();
})();
