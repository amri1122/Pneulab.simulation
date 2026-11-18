const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HTML_FILE = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const SINGLE_HTML_FILE = 'file:///' + path.resolve(__dirname, 'index_single.html').replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots_no_contact_numbers');

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
  console.log('=== STARTING TEST SUITE: REMOVE CONTACT NUMBERS ===\n');
  const results = [];
  const targetDefIds = [
    'button-no',
    'button-no-detent',
    'button-nc',
    'button-nc-detent',
    'button-changeover',
    'button-changeover-detent',
    'relay-contact-no',
    'relay-contact-nc'
  ];

  const filesToTest = [
    { name: 'Modular (index.html)', url: HTML_FILE, prefix: 'modular' },
    { name: 'Bundled (index_single.html)', url: SINGLE_HTML_FILE, prefix: 'single' }
  ];

  for (const fileObj of filesToTest) {
    console.log(`\n======================================================`);
    console.log(`Testing File: ${fileObj.name}`);
    console.log(`======================================================`);

    // Skenario 1: Library Panel
    try {
      console.log(`--- [${fileObj.prefix}] Scenario 1: Library Cards Check ---`);
      const { page } = await initBrowser({ width: 1366, height: 768 });
      await page.goto(fileObj.url, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      // Pastikan kategori elektrikal aktif
      await page.click('button[data-category="electrical"]');
      await page.waitForTimeout(300);

      const libCheck = await page.evaluate((targets) => {
        const issues = [];
        const contactNums = ['11', '12', '13', '14', '21', '22'];

        targets.forEach(defId => {
          const card = document.querySelector(`.library-component-item[data-def-id="${defId}"]`);
          if (!card) {
            issues.push(`Library item missing: ${defId}`);
            return;
          }
          const svgTexts = Array.from(card.querySelectorAll('svg text')).map(t => t.textContent.trim());
          const found = svgTexts.filter(txt => contactNums.includes(txt));
          if (found.length > 0) {
            issues.push(`Library card ${defId} still contains contact numbers: ${found.join(', ')}`);
          }
        });

        // Verifikasi Kumparan Relai tetap ada terminal A1 & A2
        const relayCard = document.querySelector(`.library-component-item[data-def-id="relay"]`);
        if (relayCard) {
          const texts = Array.from(relayCard.querySelectorAll('svg text')).map(t => t.textContent.trim());
          if (!texts.includes('A1') || !texts.includes('A2')) {
            issues.push(`Relay card missing A1/A2 terminal labels`);
          }
        }

        return {
          success: issues.length === 0,
          issues
        };
      }, targetDefIds);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_sc01_library_panel.png`) });

      results.push({
        name: `[${fileObj.prefix}] Scenario 1: Library Cards clean of contact numbers`,
        passed: libCheck.success && pageErrors.length === 0,
        details: libCheck.issues.length > 0 ? libCheck.issues.join('; ') : '8 komponen target bebas dari angka kontak di library, relai tetap mempertahankan terminal A1/A2'
      });
      console.log(`  Result Scenario 1: ${libCheck.success ? 'PASS' : 'FAIL'}`, libCheck.issues);
    } catch (err) {
      results.push({ name: `[${fileObj.prefix}] Scenario 1`, passed: false, details: err.message });
      console.error(`  Error Scenario 1:`, err.message);
    }

    // Skenario 2: Workspace Rendering
    try {
      console.log(`--- [${fileObj.prefix}] Scenario 2: Workspace Rendering Check ---`);
      const { page } = await initBrowser({ width: 1366, height: 768 });
      await page.goto(fileObj.url, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      const workspaceCheck = await page.evaluate((targets) => {
        window.clearAllComponents(true);
        const issues = [];
        const contactNums = ['11', '12', '13', '14', '21', '22'];

        targets.forEach((defId, idx) => {
          const x = 120 + (idx % 4) * 160;
          const y = 140 + Math.floor(idx / 4) * 160;
          window.addComponent(defId, x, y);
        });

        window.workspaceComponents.forEach(comp => {
          const group = document.getElementById(`comp-${comp.id}`);
          if (!group) {
            issues.push(`DOM element comp-${comp.id} not found`);
            return;
          }
          const symbolContent = group.querySelector('.symbol-content');
          const textsInSymbol = Array.from(symbolContent.querySelectorAll('text')).map(t => t.textContent.trim());
          const found = textsInSymbol.filter(txt => contactNums.includes(txt));
          if (found.length > 0) {
            issues.push(`Workspace symbol ${comp.defId} (${comp.id}) still contains: ${found.join(', ')}`);
          }

          // Verifikasi component label (misal S1, K1-1) tetap ada
          const labelEl = group.querySelector('.component-label');
          if (!labelEl || !labelEl.textContent.trim()) {
            issues.push(`Component label missing for ${comp.defId}`);
          }
        });

        return {
          compCount: window.workspaceComponents.length,
          success: issues.length === 0,
          issues
        };
      }, targetDefIds);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_sc02_workspace_symbols.png`) });

      results.push({
        name: `[${fileObj.prefix}] Scenario 2: Workspace symbols clean of contact numbers`,
        passed: workspaceCheck.success && workspaceCheck.compCount === 8 && pageErrors.length === 0,
        details: workspaceCheck.issues.length > 0 ? workspaceCheck.issues.join('; ') : '8 komponen di workspace bebas angka kontak pada SVG simbol, label komponen tetap ada'
      });
      console.log(`  Result Scenario 2: ${workspaceCheck.success ? 'PASS' : 'FAIL'}`, workspaceCheck.issues);
    } catch (err) {
      results.push({ name: `[${fileObj.prefix}] Scenario 2`, passed: false, details: err.message });
      console.error(`  Error Scenario 2:`, err.message);
    }

    // Skenario 3: Presets Compatibility
    try {
      console.log(`--- [${fileObj.prefix}] Scenario 3: Presets Compatibility Check ---`);
      const { page } = await initBrowser({ width: 1366, height: 768 });
      await page.goto(fileObj.url, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      const presetsResult = await page.evaluate(() => {
        // 1. Direct Pneumatic
        window.loadPresetCircuit('direct');
        const dComps = window.workspaceComponents.length;
        const dValid = window.runDiagnostics().valid;

        // 2. Indirect Pneumatic
        window.loadPresetCircuit('indirect');
        const indComps = window.workspaceComponents.length;
        const indValid = window.runDiagnostics().valid;

        // 3. Electropneumatic
        window.loadPresetCircuit('electropneumatic');
        const elComps = window.workspaceComponents.length;
        const elValid = window.runDiagnostics().valid;

        // Verifikasi pushbutton S1 di preset electropneumatic tidak memiliki angka kontak
        const s1 = window.workspaceComponents.find(c => c.label && c.label.includes('S1'));
        let s1Clean = false;
        if (s1) {
          const group = document.getElementById(`comp-${s1.id}`);
          const symTexts = Array.from(group.querySelector('.symbol-content').querySelectorAll('text')).map(t => t.textContent.trim());
          s1Clean = !symTexts.includes('13') && !symTexts.includes('14');
        }

        return {
          direct: { comps: dComps, valid: dValid },
          indirect: { comps: indComps, valid: indValid },
          electropneumatic: { comps: elComps, valid: elValid, s1Clean },
          pass: dComps > 0 && dValid && indComps > 0 && indValid && elComps > 0 && elValid && s1Clean
        };
      });

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_sc03_preset_electropneumatic.png`) });

      results.push({
        name: `[${fileObj.prefix}] Scenario 3: Presets 1, 2, 3 Compatibility & diagnostics valid`,
        passed: presetsResult.pass && pageErrors.length === 0,
        details: `Direct: ${presetsResult.direct.comps} comps, Indirect: ${presetsResult.indirect.comps} comps, Electro: ${presetsResult.electropneumatic.comps} comps (S1 clean: ${presetsResult.electropneumatic.s1Clean})`
      });
      console.log(`  Result Scenario 3: ${presetsResult.pass ? 'PASS' : 'FAIL'}`);
    } catch (err) {
      results.push({ name: `[${fileObj.prefix}] Scenario 3`, passed: false, details: err.message });
      console.error(`  Error Scenario 3:`, err.message);
    }

    // Skenario 4: Simulasi Interaktif & Logika
    try {
      console.log(`--- [${fileObj.prefix}] Scenario 4: Interactive Simulation ---`);
      const { page } = await initBrowser({ width: 1366, height: 768 });
      await page.goto(fileObj.url, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      const simResult = await page.evaluate(async () => {
        window.clearAllComponents(true);

        const dc = window.addComponent('dc-source', 100, 200);
        const bNO = window.addComponent('button-no', 250, 150);
        const bNC = window.addComponent('button-nc', 250, 300);
        const lampNO = window.addComponent('indicator-lamp', 450, 150);
        const lampNC = window.addComponent('indicator-lamp', 450, 300);

        // Sambungan listrik:
        // +24V -> bNO(1), bNO(2) -> lampNO(1), lampNO(2) -> 0V
        window.addConnection(dc.id, 1, bNO.id, 1, 'electrical');
        window.addConnection(bNO.id, 2, lampNO.id, 1, 'electrical');
        window.addConnection(lampNO.id, 2, dc.id, 2, 'electrical');

        // +24V -> bNC(1), bNC(2) -> lampNC(1), lampNC(2) -> 0V
        window.addConnection(dc.id, 1, bNC.id, 1, 'electrical');
        window.addConnection(bNC.id, 2, lampNC.id, 1, 'electrical');
        window.addConnection(lampNC.id, 2, dc.id, 2, 'electrical');

        window.SimEngine.start();

        // State 0: Normal / Idle (NO terbuka, NC tertutup)
        window.SimEngine.tick(0.05);
        const s0 = {
          lampNO: !!window.SimEngine.lampStates[lampNO.id],
          lampNC: !!window.SimEngine.lampStates[lampNC.id]
        };

        // State 1: Tekan bNO
        window.SimEngine.pressButton(bNO.id);
        window.SimEngine.tick(0.05);
        const s1 = {
          lampNO: !!window.SimEngine.lampStates[lampNO.id],
          lampNC: !!window.SimEngine.lampStates[lampNC.id]
        };

        // State 2: Lepas bNO
        window.SimEngine.releaseButton(bNO.id);
        window.SimEngine.tick(0.05);
        const s2 = {
          lampNO: !!window.SimEngine.lampStates[lampNO.id],
          lampNC: !!window.SimEngine.lampStates[lampNC.id]
        };

        // State 3: Tekan bNC
        window.SimEngine.pressButton(bNC.id);
        window.SimEngine.tick(0.05);
        const s3 = {
          lampNO: !!window.SimEngine.lampStates[lampNO.id],
          lampNC: !!window.SimEngine.lampStates[lampNC.id]
        };

        // State 4: Lepas bNC
        window.SimEngine.releaseButton(bNC.id);
        window.SimEngine.tick(0.05);
        const s4 = {
          lampNO: !!window.SimEngine.lampStates[lampNO.id],
          lampNC: !!window.SimEngine.lampStates[lampNC.id]
        };

        window.SimEngine.stop();
        const pass = !s0.lampNO && s0.lampNC &&
                     s1.lampNO && s1.lampNC &&
                     !s2.lampNO && s2.lampNC &&
                     !s3.lampNO && !s3.lampNC &&
                     !s4.lampNO && s4.lampNC;

        return { s0, s1, s2, s3, s4, pass };
      });

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_sc04_interactive_sim.png`) });

      results.push({
        name: `[${fileObj.prefix}] Scenario 4: Pushbutton & Relay interactive simulation`,
        passed: simResult.pass && pageErrors.length === 0,
        details: `NO: s0=${simResult.s0.lampNO}, s1=${simResult.s1.lampNO}, s2=${simResult.s2.lampNO} | NC: s0=${simResult.s0.lampNC}, s3=${simResult.s3.lampNC}, s4=${simResult.s4.lampNC}`
      });
      console.log(`  Result Scenario 4: ${simResult.pass ? 'PASS' : 'FAIL'}`);
    } catch (err) {
      results.push({ name: `[${fileObj.prefix}] Scenario 4`, passed: false, details: err.message });
      console.error(`  Error Scenario 4:`, err.message);
    }

    // Skenario 5: Save & Load Persistence
    try {
      console.log(`--- [${fileObj.prefix}] Scenario 5: Save & Load Persistence ---`);
      const { page } = await initBrowser({ width: 1366, height: 768 });
      await page.goto(fileObj.url, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      const saveLoadResult = await page.evaluate(() => {
        window.clearAllComponents(true);
        window.addComponent('button-no-detent', 150, 150, { label: 'S_DET' });
        window.addComponent('relay-contact-nc', 350, 150, { label: 'K1-1' });
        window.addComponent('button-changeover', 550, 150, { label: 'S_CO' });

        window.saveProject();
        window.clearAllComponents(true);
        const clearedCount = window.workspaceComponents.length;

        window.loadProject();
        const loadedCount = window.workspaceComponents.length;

        // Cek simbol setelah reload tetap bersih dari angka kontak
        const contactNums = ['11', '12', '13', '14', '21', '22'];
        const badFound = [];
        window.workspaceComponents.forEach(comp => {
          const group = document.getElementById(`comp-${comp.id}`);
          if (group) {
            const sym = group.querySelector('.symbol-content');
            const texts = Array.from(sym.querySelectorAll('text')).map(t => t.textContent.trim());
            const bad = texts.filter(txt => contactNums.includes(txt));
            if (bad.length > 0) badFound.push(`${comp.defId}: ${bad.join(',')}`);
          }
        });

        return {
          clearedCount,
          loadedCount,
          badFound,
          pass: clearedCount === 0 && loadedCount === 3 && badFound.length === 0
        };
      });

      results.push({
        name: `[${fileObj.prefix}] Scenario 5: Save & load persistence`,
        passed: saveLoadResult.pass && pageErrors.length === 0,
        details: `Cleared: ${saveLoadResult.clearedCount}, Loaded: ${saveLoadResult.loadedCount}, Bad labels found: ${saveLoadResult.badFound.length}`
      });
      console.log(`  Result Scenario 5: ${saveLoadResult.pass ? 'PASS' : 'FAIL'}`);
    } catch (err) {
      results.push({ name: `[${fileObj.prefix}] Scenario 5`, passed: false, details: err.message });
      console.error(`  Error Scenario 5:`, err.message);
    }
  }

  // Skenario 6: Multi-Viewport & Error Check (Desktop 1280x600 & Mobile 390x844)
  const viewportsToTest = [
    { name: 'Desktop Compact (1280x600)', width: 1280, height: 600, isMobile: false, hasTouch: false },
    { name: 'Smartphone Mobile (390x844)', width: 390, height: 844, isMobile: true, hasTouch: true }
  ];

  for (const vp of viewportsToTest) {
    for (const fileObj of filesToTest) {
      console.log(`--- Multi-viewport Check: ${vp.name} on ${fileObj.name} ---`);
      try {
        const { page } = await initBrowser({ width: vp.width, height: vp.height }, { isMobile: vp.isMobile, hasTouch: vp.hasTouch });
        await page.goto(fileObj.url, { waitUntil: 'load' });
        await page.waitForTimeout(500);

        // Load Preset electropneumatic
        await page.evaluate(() => {
          window.loadPresetCircuit('electropneumatic');
        });
        await page.waitForTimeout(400);

        const vpSafeName = vp.name.replace(/[^a-zA-Z0-9]/g, '_');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${fileObj.prefix}_${vpSafeName}.png`), fullPage: false });

        results.push({
          name: `Scenario 6: Viewport Check ${vp.name} on ${fileObj.name}`,
          passed: pageErrors.length === 0,
          details: `Console pageErrors count: ${pageErrors.length}`
        });
        console.log(`  Viewport Check Result: PASS (0 errors)`);
      } catch (err) {
        results.push({ name: `Scenario 6: Viewport Check ${vp.name} on ${fileObj.name}`, passed: false, details: err.message });
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

  fs.writeFileSync(path.resolve(__dirname, 'test_remove_contact_numbers_results.json'), JSON.stringify(results, null, 2));
  if (browser) await browser.close();
  return allPassed;
}

runTests().then(passed => {
  console.log(`\nALL TESTS FINISHED. Overall Status: ${passed ? 'ALL PASSED' : 'SOME FAILED'}`);
  process.exit(passed ? 0 : 1);
}).catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
