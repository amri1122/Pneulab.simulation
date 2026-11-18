const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SRC_IMG_PATH = 'C:/Users/ASUS/Downloads/Logo Pneulab Elektropneumatik Modern.png';
const ASSETS_DIR = path.resolve(__dirname, 'assets');

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

async function renderLogoVariations() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

  const imgBuffer = fs.readFileSync(SRC_IMG_PATH);
  const base64Data = imgBuffer.toString('base64');
  const dataUri = `data:image/png;base64,${base64Data}`;

  // Buat file uji coba HTML
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; background: #f1f5f9; padding: 20px; }
        .row { display: flex; gap: 20px; margin-bottom: 20px; align-items: center; }
        .header-mock { background: #ffffff; padding: 10px 20px; border-bottom: 1px solid #cbd5e1; display: flex; align-items: center; gap: 15px; border-radius: 8px; }
        .badge-dark { background: #0f172a; border-radius: 8px; padding: 4px 10px; display: inline-flex; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
      </style>
    </head>
    <body>
      <h2>Logo Variations</h2>
      <canvas id="cropFullCanvas"></canvas>
      <canvas id="cropIconCanvas"></canvas>
    </body>
    </html>
  `);

  const crops = await page.evaluate(async (dataUri) => {
    const img = new Image();
    img.src = dataUri;
    await new Promise(r => img.onload = r);

    // 1. Crop logo lengkap (ikon + teks Pneulab)
    // Box: x: 250, y: 130, w: 1040, h: 730
    const cropFull = document.getElementById('cropFullCanvas');
    const pad = 20;
    const cropX = Math.max(0, 258 - pad);
    const cropY = Math.max(0, 138 - pad);
    const cropW = 1020 + pad * 2;
    const cropH = 714 + pad * 2;

    cropFull.width = cropW;
    cropFull.height = cropH;
    const ctx1 = cropFull.getContext('2d');
    ctx1.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // 2. Crop ikon mark saja (bagian atas, tanpa teks)
    // Ikon ada di bagian atas (y dari 138 sampai ~650)
    const cropIcon = document.getElementById('cropIconCanvas');
    const iconPad = 15;
    const iconX = 350;
    const iconY = 138;
    const iconW = 836;
    const iconH = 500;
    cropIcon.width = iconW;
    cropIcon.height = iconH;
    const ctx2 = cropIcon.getContext('2d');
    ctx2.drawImage(img, iconX, iconY, iconW, iconH, 0, 0, iconW, iconH);

    return {
      fullData: cropFull.toDataURL('image/png'),
      iconData: cropIcon.toDataURL('image/png')
    };
  }, dataUri);

  // Simpan hasil crop
  const fullBuffer = Buffer.from(crops.fullData.replace(/^data:image\/png;base64,/, ''), 'base64');
  const iconBuffer = Buffer.from(crops.iconData.replace(/^data:image\/png;base64,/, ''), 'base64');

  fs.writeFileSync(path.join(ASSETS_DIR, 'logo-pneulab-full.png'), fullBuffer);
  fs.writeFileSync(path.join(ASSETS_DIR, 'logo-pneulab-icon.png'), iconBuffer);

  // Juga salin gambar asli ke assets/logo-pneulab.png
  fs.copyFileSync(SRC_IMG_PATH, path.join(ASSETS_DIR, 'logo-pneulab.png'));

  console.log('Saved cropped assets successfully.');
  await browser.close();
}

renderLogoVariations().catch(console.error);
