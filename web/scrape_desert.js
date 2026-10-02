const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
  await page.goto('https://white-desert.com', { waitUntil: 'networkidle2' });
  
  const headerHtml = await page.evaluate(() => {
    const header = document.querySelector('header') || document.querySelector('.header');
    return header ? header.outerHTML : 'No header found';
  });
  
  const cloudHtml = await page.evaluate(() => {
    const clouds = Array.from(document.querySelectorAll('[class*="cloud"]'));
    return clouds.map(c => c.outerHTML).join('\n');
  });

  console.log("=== HEADER ===");
  console.log(headerHtml.substring(0, 1000));
  console.log("=== CLOUDS ===");
  console.log(cloudHtml.substring(0, 1000));

  await browser.close();
})();
