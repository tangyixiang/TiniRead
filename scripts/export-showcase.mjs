import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  // We use deviceScaleFactor: 2, so 540x720 becomes 1080x1440, perfect for Xiaohongshu 3:4!
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });

  const fileUrl = 'file://' + path.resolve('showcase.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  await page.evaluate(() => {
    // switch to dark mode
    if (typeof switchTheme === 'function') {
      switchTheme('dark');
    }
    // switch to ratio-xhs
    if (typeof switchRatio === 'function') {
      switchRatio('ratio-xhs');
    }
    // disable transitions
    const style = document.createElement('style');
    style.innerHTML = '* { transition: none !important; animation: none !important; }';
    document.head.appendChild(style);
  });

  const outDir = path.resolve('xhs-screenshots');
  await fs.promises.mkdir(outDir, { recursive: true });

  const totalSlides = 6;
  for (let i = 0; i < totalSlides; i++) {
    await page.evaluate((idx) => {
      goToSlide(idx);
    }, i);

    // wait a moment for any render
    await new Promise(resolve => setTimeout(resolve, 100));

    const element = await page.$('.slides-wrapper');
    const outputPath = path.join(outDir, `xhs-slide-${i + 1}.png`);
    await element.screenshot({ path: outputPath });
    console.log(`Saved: ${outputPath}`);
  }

  await browser.close();
  console.log('All slides captured successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
