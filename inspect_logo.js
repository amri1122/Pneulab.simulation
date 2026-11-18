const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SRC_IMG_PATH = 'C:/Users/ASUS/Downloads/Logo Pneulab Elektropneumatik Modern.png';
const ASSETS_DIR = path.resolve(__dirname, 'assets');

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function inspectAndProcessLogo() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage();
  
  // Baca gambar dan convert ke data URI
  const imgBuffer = fs.readFileSync(SRC_IMG_PATH);
  const base64Data = imgBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${base64Data}`;

  await page.setContent(`
    <html>
      <body style="background: #222; margin: 0; padding: 20px;">
        <img id="orig" src="${dataUri}" />
        <canvas id="canvas"></canvas>
      </body>
    </html>
  `);

  const imgInfo = await page.evaluate(async () => {
    const img = document.getElementById('orig');
    await new Promise(resolve => {
      if (img.complete) resolve();
      else img.onload = resolve;
    });

    const w = img.naturalWidth;
    const h = img.naturalHeight;

    // Scan bounding box piksel non-black
    const canvas = document.getElementById('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    // Nilai ambang hitam (background hitam biasanya r,g,b < 20)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        // Jika piksel bukan hitam pekat
        if (a > 30 && (r > 25 || g > 25 || b > 25)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    return {
      naturalWidth: w,
      naturalHeight: h,
      contentBox: { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
    };
  });

  console.log('Image Info:', JSON.stringify(imgInfo, null, 2));
  await browser.close();
}

inspectAndProcessLogo().catch(console.error);
