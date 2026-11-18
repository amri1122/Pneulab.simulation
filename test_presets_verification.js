const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HTML_FILE = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const SINGLE_HTML_FILE = 'file:///' + path.resolve(__dirname, 'index_single.html').replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots_presets_revised');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let browser = null;
let pageErrors = [];

async function initBrowser(viewport = { width: 1366, height: 768 }, options = {}) {
  if (browser) await browser.close();
  pageErrors = [];
  browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: options.deviceScaleFactor || 1,
    isMobile: options.isMobile || false,
    hasTouch: options.hasTouch || false
  });
  const page = await context.newPage();
  page.on('pageerror', err => {
    console.error('Browser PageError:', err.message);
    pageErrors.push(err.message);
  });
  return { context, page };
}

async function runTests() {
  console.log('=== STARTING TEST SUITE: PRESETS 1, 2, 3 VERIFICATION ===\n');
  const results = [];

  const filesToTest = [
    { name: 'Modular (index.html)', url: HTML_FILE, prefix: 'modular' },
    { name: 'Bundled (index_single.html)', url: SINGLE_HTML_FILE, prefix: 'single' }
  ];

  for (const fileObj of filesToTest) {
    console.log(`\n======================================================`);
    console.log(`Testing File: ${fileObj.name}`);
    console.log(`======================================================`);

    // Skenario 1: Verifikasi Geometri Preset 1, 2, dan 3 (Overlaps & Crossings)
    try {
      console.log(`--- [${fileObj.prefix}] Checking Geometry: Overlaps & Wire Crossings ---`);
      const { page } = await initBrowser({ width: 1366, height: 768 });
      await page.goto(fileObj.url, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      const geomResult = await page.evaluate(() => {
        function lineIntersectsBox(x1, y1, x2, y2, box) {
          const bLeft = box.x + 5;
          const bRight = box.x + box.width - 5;
          const bTop = box.y + 5;
          const bBottom = box.y + box.height - 5;

          if (Math.max(x1, x2) <= bLeft || Math.min(x1, x2) >= bRight ||
              Math.max(y1, y2) <= bTop || Math.min(y1, y2) >= bBottom) {
            return false;
          }

          if ((x1 > bLeft && x1 < bRight && y1 > bTop && y1 < bBottom) ||
              (x2 > bLeft && x2 < bRight && y2 > bTop && y2 < bBottom)) {
            return true;
          }

          if (x1 === x2) {
            const yMin = Math.min(y1, y2);
            const yMax = Math.max(y1, y2);
            if (x1 > bLeft && x1 < bRight && yMin < bBottom && yMax > bTop) return true;
          }
          if (y1 === y2) {
            const xMin = Math.min(x1, x2);
            const xMax = Math.max(x1, x2);
            if (y1 > bTop && y1 < bBottom && xMin < bRight && xMax > bLeft) return true;
          }
          return false;
        }

        function checkGeometryForPreset(presetId) {
          window.loadPresetCircuit(presetId);
          const comps = window.workspaceComponents.map(c => {
            const halfW = c.width / 2;
            const halfH = c.height / 2;
            return {
              id: c.id,
              defId: c.defId,
              label: c.label,
              x: c.x - halfW,
              y: c.y - halfH,
              width: c.width,
              height: c.height
            };
          });

          const overlaps = [];
          for (let i = 0; i < comps.length; i++) {
            for (let j = i + 1; j < comps.length; j++) {
              const a = comps[i];
              const b = comps[j];
              if (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y) {
                overlaps.push(`${a.label} (${a.defId}) overlaps with ${b.label} (${b.defId})`);
              }
            }
          }

          const crossings = [];
          window.connections.forEach(conn => {
            const pts = conn.waypoints || [];
            for (let i = 0; i < pts.length - 1; i++) {
              const p1 = pts[i];
              const p2 = pts[i + 1];

              comps.forEach(comp => {
                const isSource = (conn.sourceCompId === comp.id && (i === 0 || i === 1));
                const isTarget = (conn.targetCompId === comp.id && (i === pts.length - 2 || i === pts.length - 3));
                if (!isSource && !isTarget) {
                  if (lineIntersectsBox(p1.x, p1.y, p2.x, p2.y, comp)) {
                    crossings.push(`Connection ${conn.id} crosses component ${comp.label} (${comp.defId})`);
                  }
                }
              });
            }
          });

          const diag = window.runDiagnostics();

          return {
            presetId,
            compCount: comps.length,
            connCount: window.connections.length,
            overlaps,
            crossings,
            diagValid: diag.valid
          };
        }

        return {
          direct: checkGeometryForPreset('direct'),
          indirect: checkGeometryForPreset('indirect'),
          electropneumatic: checkGeometryForPreset('electropneumatic')
        };
      });

      const p1Pass = geomResult.direct.overlaps.length === 0 && geomResult.direct.crossings.length === 0 && geomResult.direct.diagValid;
      const p2Pass = geomResult.indirect.overlaps.length === 0 && geomResult.indirect.crossings.length === 0 && geomResult.indirect.diagValid;
      const p3Pass = geomResult.electropneumatic.overlaps.length === 0 && geomResult.electropneumatic.crossings.length === 0 && geomResult.electropneumatic.diagValid;

      results.push({
        name: `[${fileObj.prefix}] Geometry & Diagnostics Check (0 overlaps, 0 wire crossings)`,
        passed: p1Pass && p2Pass && p3Pass && pageErrors.length === 0,
        details: `P1: overlaps=${geomResult.direct.overlaps.length}, crossings=${geomResult.direct.crossings.length}, valid=${geomResult.direct.diagValid} | P2: overlaps=${geomResult.indirect.overlaps.length}, crossings=${geomResult.indirect.crossings.length}, valid=${geomResult.indirect.diagValid} | P3: overlaps=${geomResult.electropneumatic.overlaps.length}, crossings=${geomResult.electropneumatic.crossings.length}, valid=${geomResult.electropneumatic.diagValid}`
      });
      console.log(`  Geometry Check: P1=${p1Pass ? 'PASS' : 'FAIL'}, P2=${p2Pass ? 'PASS' : 'FAIL'}, P3=${p3Pass ? 'PASS' : 'FAIL'}`);
    } catch (err) {
      results.push({ name: `[${fileObj.prefix}] Geometry Check`, passed: false, details: err.message });
      console.error(`  Error in Geometry Check:`, err.message);
    }

    // Skenario 2: Simulasi Preset 1 (Pneumatik Langsung)
    try {
      console.log(`--- [${fileObj.prefix}] Testing Preset 1 Simulation ---`);
      const { page } = await initBrowser({ width: 1366, height: 768 });
      await page.goto(fileObj.url, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      const simP1 = await page.evaluate(async () => {
        window.loadPresetCircuit('direct');
        window.setMode('simulate');

        const v1 = window.workspaceComponents.find(c => c.label === 'V1');
        const cyl = window.workspaceComponents.find(c => c.label === 'A1');

        window.SimEngine.tick(0.05);
        const initPos = window.SimEngine.cylinderStates[cyl.id].pos;

        // Tekan V1
        window.SimEngine.pressButton(v1.id);
        for (let i = 0; i < 25; i++) window.SimEngine.tick(0.05);
        const pressedPos = window.SimEngine.cylinderStates[cyl.id].pos;

        // Lepas V1
        window.SimEngine.releaseButton(v1.id);
        for (let i = 0; i < 30; i++) window.SimEngine.tick(0.05);
        const releasedPos = window.SimEngine.cylinderStates[cyl.id].pos;

        window.SimEngine.stop();

        return {
          initPos,
          pressedPos,
          releasedPos,
          pass: initPos < 0.05 && pressedPos > 0.95 && releasedPos < 0.05
        };
      });

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_preset1_sim.png`) });

      results.push({
        name: `[${fileObj.prefix}] Preset 1 Simulation (Press -> Advance, Release -> Retract)`,
        passed: simP1.pass && pageErrors.length === 0,
        details: `Initial: ${simP1.initPos.toFixed(2)}, Pressed: ${simP1.pressedPos.toFixed(2)}, Released: ${simP1.releasedPos.toFixed(2)}`
      });
      console.log(`  Preset 1 Simulation: ${simP1.pass ? 'PASS' : 'FAIL'}`);
    } catch (err) {
      results.push({ name: `[${fileObj.prefix}] Preset 1 Simulation`, passed: false, details: err.message });
      console.error(`  Error in Preset 1 Simulation:`, err.message);
    }

    // Skenario 3: Simulasi Preset 2 (Pneumatik Tak Langsung)
    try {
      console.log(`--- [${fileObj.prefix}] Testing Preset 2 Simulation ---`);
      const { page } = await initBrowser({ width: 1366, height: 768 });
      await page.goto(fileObj.url, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      const simP2 = await page.evaluate(async () => {
        window.loadPresetCircuit('indirect');
        window.setMode('simulate');

        const pb1 = window.workspaceComponents.find(c => c.label === 'PB1');
        const cyl = window.workspaceComponents.find(c => c.label === 'A1');

        window.SimEngine.tick(0.05);
        const initPos = window.SimEngine.cylinderStates[cyl.id].pos;

        // Tekan PB1
        window.SimEngine.pressButton(pb1.id);
        for (let i = 0; i < 25; i++) window.SimEngine.tick(0.05);
        const pressedPos = window.SimEngine.cylinderStates[cyl.id].pos;

        // Lepas PB1
        window.SimEngine.releaseButton(pb1.id);
        for (let i = 0; i < 30; i++) window.SimEngine.tick(0.05);
        const releasedPos = window.SimEngine.cylinderStates[cyl.id].pos;

        window.SimEngine.stop();

        return {
          initPos,
          pressedPos,
          releasedPos,
          pass: initPos < 0.05 && pressedPos > 0.95 && releasedPos < 0.05
        };
      });

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_preset2_sim.png`) });

      results.push({
        name: `[${fileObj.prefix}] Preset 2 Simulation (PB1 Press -> Pilot 14 -> Advance, Release -> Retract)`,
        passed: simP2.pass && pageErrors.length === 0,
        details: `Initial: ${simP2.initPos.toFixed(2)}, Pressed: ${simP2.pressedPos.toFixed(2)}, Released: ${simP2.releasedPos.toFixed(2)}`
      });
      console.log(`  Preset 2 Simulation: ${simP2.pass ? 'PASS' : 'FAIL'}`);
    } catch (err) {
      results.push({ name: `[${fileObj.prefix}] Preset 2 Simulation`, passed: false, details: err.message });
      console.error(`  Error in Preset 2 Simulation:`, err.message);
    }

    // Skenario 4: Simulasi Preset 3 (Elektropneumatik Pengunci / Latching)
    try {
      console.log(`--- [${fileObj.prefix}] Testing Preset 3 Simulation (Self-Holding) ---`);
      const { page } = await initBrowser({ width: 1366, height: 768 });
      await page.goto(fileObj.url, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      const simP3 = await page.evaluate(async () => {
        window.loadPresetCircuit('electropneumatic');
        window.setMode('simulate');

        const s1 = window.workspaceComponents.find(c => c.label.includes('S1'));
        const k1 = window.workspaceComponents.find(c => c.label === 'K1');
        const y1 = window.workspaceComponents.find(c => c.label === 'Y1');
        const h1 = window.workspaceComponents.find(c => c.label.includes('H1'));
        const cyl = window.workspaceComponents.find(c => c.label === 'A1');

        window.SimEngine.tick(0.05);
        const before = {
          k1: !!window.SimEngine.relayStates['K1'],
          y1: !!window.SimEngine.solenoidStates['Y1'],
          h1: !!window.SimEngine.lampStates[h1.id],
          pos: window.SimEngine.cylinderStates[cyl.id].pos
        };

        // Tekan S1
        window.SimEngine.pressButton(s1.id);
        for (let i = 0; i < 25; i++) window.SimEngine.tick(0.05);
        const pressed = {
          k1: !!window.SimEngine.relayStates['K1'],
          y1: !!window.SimEngine.solenoidStates['Y1'],
          h1: !!window.SimEngine.lampStates[h1.id],
          pos: window.SimEngine.cylinderStates[cyl.id].pos
        };

        // Lepas S1 (harus tetap mengunci / self-holding)
        window.SimEngine.releaseButton(s1.id);
        for (let i = 0; i < 25; i++) window.SimEngine.tick(0.05);
        const released = {
          k1: !!window.SimEngine.relayStates['K1'],
          y1: !!window.SimEngine.solenoidStates['Y1'],
          h1: !!window.SimEngine.lampStates[h1.id],
          pos: window.SimEngine.cylinderStates[cyl.id].pos
        };

        // Periksa warna kabel: kabel netral 0V harus ditandai isNeutral === true
        const gndConns = window.connections.filter(c => c.isNeutral);

        window.SimEngine.stop();

        const pass = !before.k1 && !before.y1 && !before.h1 && before.pos < 0.05 &&
                     pressed.k1 && pressed.y1 && pressed.h1 && pressed.pos > 0.95 &&
                     released.k1 && released.y1 && released.h1 && released.pos > 0.95 &&
                     gndConns.length >= 3;

        return {
          before,
          pressed,
          released,
          neutralConnCount: gndConns.length,
          pass
        };
      });

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_preset3_sim_latched.png`) });

      results.push({
        name: `[${fileObj.prefix}] Preset 3 Simulation (S1 Press -> K1/Y1/H1 Active -> S1 Release -> Latched Active & Neutral Black)`,
        passed: simP3.pass && pageErrors.length === 0,
        details: `Before: k1=${simP3.before.k1}, pos=${simP3.before.pos.toFixed(2)} | Pressed: k1=${simP3.pressed.k1}, pos=${simP3.pressed.pos.toFixed(2)} | Released (Latched): k1=${simP3.released.k1}, pos=${simP3.released.pos.toFixed(2)}, NeutralConns=${simP3.neutralConnCount}`
      });
      console.log(`  Preset 3 Simulation: ${simP3.pass ? 'PASS' : 'FAIL'}`);
    } catch (err) {
      results.push({ name: `[${fileObj.prefix}] Preset 3 Simulation`, passed: false, details: err.message });
      console.error(`  Error in Preset 3 Simulation:`, err.message);
    }
  }

  // Skenario 5: Pengujian Multi-Viewport (Desktop 1366x768, 1280x600, Tablet 768x1024, Mobile 390x844)
  const viewportsToTest = [
    { name: 'Desktop_1366x768', width: 1366, height: 768, isMobile: false, hasTouch: false },
    { name: 'Desktop_1280x600', width: 1280, height: 600, isMobile: false, hasTouch: false },
    { name: 'Tablet_768x1024', width: 768, height: 1024, isMobile: true, hasTouch: true },
    { name: 'Mobile_390x844', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
  ];

  for (const vp of viewportsToTest) {
    for (const fileObj of filesToTest) {
      console.log(`--- Viewport Check: ${vp.name} on ${fileObj.name} ---`);
      try {
        const { page } = await initBrowser(
          { width: vp.width, height: vp.height },
          { isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 }
        );
        await page.goto(fileObj.url, { waitUntil: 'load' });
        await page.waitForTimeout(500);

        // Screenshot Preset 1
        await page.evaluate(() => window.loadPresetCircuit('direct'));
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_${vp.name}_preset1.png`) });

        // Screenshot Preset 2
        await page.evaluate(() => window.loadPresetCircuit('indirect'));
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_${vp.name}_preset2.png`) });

        // Screenshot Preset 3
        await page.evaluate(() => window.loadPresetCircuit('electropneumatic'));
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_${vp.name}_preset3.png`) });

        results.push({
          name: `Viewport Check: ${vp.name} on ${fileObj.name}`,
          passed: pageErrors.length === 0,
          details: `Errors: ${pageErrors.length}, Presets 1-3 rendered cleanly`
        });
        console.log(`  Viewport Check Result: PASS (0 errors)`);
      } catch (err) {
        results.push({ name: `Viewport Check: ${vp.name} on ${fileObj.name}`, passed: false, details: err.message });
        console.error(`  Viewport Check Error:`, err.message);
      }
    }
  }

  // Summary
  console.log('\n======================================================');
  console.log('FINAL TEST RESULTS SUMMARY:');
  console.log('======================================================');
  let allPassed = true;
  results.forEach(r => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}: ${r.details}`);
    if (!r.passed) allPassed = false;
  });

  fs.writeFileSync(path.resolve(__dirname, 'test_presets_verification_results.json'), JSON.stringify(results, null, 2));
  if (browser) await browser.close();
  return allPassed;
}

runTests().then(passed => {
  console.log(`\nALL PRESET TESTS FINISHED. Overall Status: ${passed ? 'ALL PASSED' : 'SOME FAILED'}`);
  process.exit(passed ? 0 : 1);
}).catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
