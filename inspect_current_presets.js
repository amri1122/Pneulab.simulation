const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HTML_FILE = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots_presets_revised');

async function run() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();
  await page.goto(HTML_FILE, { waitUntil: 'load' });
  await page.waitForTimeout(600);

  // 1. Preset 1
  await page.evaluate(() => window.loadPresetCircuit('direct'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'current_preset1_direct.png') });

  // 2. Preset 2
  await page.evaluate(() => window.loadPresetCircuit('indirect'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'current_preset2_indirect.png') });

  // 3. Preset 3
  await page.evaluate(() => window.loadPresetCircuit('electropneumatic'));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'current_preset3_electro.png') });

  // Cek detail geometri koneksi dan posisi komponen preset 1, 2, 3
  const presetsInfo = await page.evaluate(() => {
    function inspectPreset(name) {
      window.loadPresetCircuit(name);
      return {
        name,
        components: window.workspaceComponents.map(c => ({
          id: c.id,
          defId: c.defId,
          label: c.label,
          x: c.x,
          y: c.y,
          width: c.width,
          height: c.height,
          rotation: c.rotation || 0
        })),
        connections: window.connections.map(c => ({
          id: c.id,
          type: c.type,
          src: `${c.sourceCompId}:${c.sourcePortNum}`,
          tgt: `${c.targetCompId}:${c.targetPortNum}`,
          targetType: c.targetType,
          junctionId: c.targetJunctionId,
          waypoints: c.waypoints
        })),
        junctions: window.junctions.map(j => ({
          id: j.id,
          x: j.x,
          y: j.y,
          parent: j.parentConnectionId
        }))
      };
    }
    return [
      inspectPreset('direct'),
      inspectPreset('indirect'),
      inspectPreset('electropneumatic')
    ];
  });

  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'presets_inspection.json'), JSON.stringify(presetsInfo, null, 2));
  console.log('Inspection complete. Saved to presets_inspection.json');
  await browser.close();
}

run().catch(console.error);
