const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const screenshotDir = path.join(__dirname, 'screenshots_save_load');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const downloadsDir = path.join(__dirname, 'test_downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

const testFilesDir = path.join(__dirname, 'test_files');

const viewports = [
  { name: 'desktop_1366x768', width: 1366, height: 768, isMobile: false, hasTouch: false },
  { name: 'desktop_1280x600', width: 1280, height: 600, isMobile: false, hasTouch: false },
  { name: 'mobile_390x844', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'mobile_360x740', width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'tablet_768x1024', width: 768, height: 1024, isMobile: false, hasTouch: true },
];

const targetHtmlFiles = ['index.html', 'index_single.html'];

async function runTests() {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const overallResults = [];

  for (const htmlFile of targetHtmlFiles) {
    console.log(`\n======================================================`);
    console.log(`TESTING FILE: ${htmlFile}`);
    console.log(`======================================================`);

    const fileUrl = 'file:///' + path.join(__dirname, htmlFile).replace(/\\/g, '/');

    for (const vp of viewports) {
      console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        deviceScaleFactor: vp.deviceScaleFactor || 1,
        acceptDownloads: true,
      });

      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') pageErrors.push(msg.text());
      });

      await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const scenarioResults = {};

      // -------------------------------------------------------------
      // Skenario 7: Mobile toolbar/header visibility, touch target, scrollWidth
      // -------------------------------------------------------------
      try {
        const headerInfo = await page.evaluate(() => {
          const saveBtn = document.getElementById('btn-save');
          const loadBtn = document.getElementById('btn-load');
          const sRect = saveBtn.getBoundingClientRect();
          const lRect = loadBtn.getBoundingClientRect();
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            saveBox: { x: sRect.x, y: sRect.y, width: sRect.width, height: sRect.height },
            loadBox: { x: lRect.x, y: lRect.y, width: lRect.width, height: lRect.height }
          };
        });

        const noHorizontalOverflow = headerInfo.scrollWidth <= headerInfo.clientWidth;
        let touchTargetValid = true;
        if (vp.isMobile) {
          touchTargetValid = headerInfo.saveBox.height >= 36 && headerInfo.saveBox.width >= 36 &&
                             headerInfo.loadBox.height >= 36 && headerInfo.loadBox.width >= 36;
        }

        scenarioResults.s7_header_touch_and_layout = noHorizontalOverflow && touchTargetValid;
        console.log(`  Skenario 7 (Header layout & touch target): ${scenarioResults.s7_header_touch_and_layout ? 'PASS' : 'FAIL'} (Save: ${headerInfo.saveBox.width.toFixed(1)}x${headerInfo.saveBox.height.toFixed(1)}px, Load: ${headerInfo.loadBox.width.toFixed(1)}x${headerInfo.loadBox.height.toFixed(1)}px, ScrollW: ${headerInfo.scrollWidth})`);
      } catch (err) {
        console.error('Error in Skenario 7:', err.message);
        scenarioResults.s7_header_touch_and_layout = false;
      }

      // -------------------------------------------------------------
      // Skenario 1: Buat rangkaian (preset materi 3), Simpan Proyek, download JSON
      // -------------------------------------------------------------
      let savedProjectFile = null;
      let savedProjectData = null;
      try {
        // Load preset materi 3
        await page.evaluate(() => window.loadPresetCircuit('electropneumatic'));
        await page.waitForTimeout(400);

        const initialCompCount = await page.evaluate(() => window.workspaceComponents.length);
        const initialConnCount = await page.evaluate(() => window.connections.length);

        // Click #btn-save and wait for download
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          page.locator('#btn-save').click(),
        ]);

        const suggestedFilename = download.suggestedFilename();
        const filenameMatches = /^pneulab-proyek-\d{8}-\d{4}\.json$/.test(suggestedFilename);

        savedProjectFile = path.join(downloadsDir, `${vp.name}_${htmlFile.replace('.html','')}_${suggestedFilename}`);
        await download.saveAs(savedProjectFile);

        const fileContent = fs.readFileSync(savedProjectFile, 'utf8');
        savedProjectData = JSON.parse(fileContent);

        const toastText = await page.evaluate(() => {
          const t = document.querySelector('.toast');
          return t ? t.textContent : '';
        });

        const validFormat = savedProjectData.format === 'electropneusim-project';
        const validVersion = savedProjectData.version === 1;
        const validAppName = savedProjectData.appName === 'Pneulab';
        const validCounts = savedProjectData.data.components.length === initialCompCount &&
                            savedProjectData.data.connections.length === initialConnCount;
        const hasSavedAt = typeof savedProjectData.savedAt === 'string';

        scenarioResults.s1_save_download_json = filenameMatches && validFormat && validVersion &&
                                              validAppName && validCounts && hasSavedAt;

        console.log(`  Skenario 1 (Simpan Proyek & JSON download): ${scenarioResults.s1_save_download_json ? 'PASS' : 'FAIL'} (Filename: ${suggestedFilename}, Format: ${savedProjectData.format}, Version: ${savedProjectData.version}, Comps: ${savedProjectData.data.components.length}, Conns: ${savedProjectData.data.connections.length})`);

        // Screenshot header with toast
        const headerEl = await page.$('#app-header');
        if (headerEl) {
          await headerEl.screenshot({
            path: path.join(screenshotDir, `${htmlFile.replace('.html','')}_${vp.name}_header.png`)
          });
        }
      } catch (err) {
        console.error('Error in Skenario 1:', err.message);
        scenarioResults.s1_save_download_json = false;
      }

      // -------------------------------------------------------------
      // Skenario 2: Kosongkan kanvas, Buka Proyek via setInputFiles, rangkaian pulih
      // -------------------------------------------------------------
      try {
        // Clear workspace
        await page.evaluate(() => window.clearAllComponents(true));
        await page.waitForTimeout(300);

        const countAfterClear = await page.evaluate(() => window.workspaceComponents.length);

        // Upload file via #file-input-project
        await page.locator('#file-input-project').setInputFiles(savedProjectFile);
        await page.waitForTimeout(500);

        const restoredCounts = await page.evaluate(() => {
          return {
            comps: window.workspaceComponents.length,
            conns: window.connections.length,
            juncs: window.junctions.length,
            undoDisabled: document.getElementById('btn-undo').disabled,
          };
        });

        const toastOpened = await page.evaluate(() => {
          const t = document.querySelector('.toast');
          return t ? t.textContent : '';
        });

        // Test Undo of the loaded project
        await page.locator('#btn-undo').click();
        await page.waitForTimeout(300);
        const countAfterUndo = await page.evaluate(() => window.workspaceComponents.length);

        // Test Redo of the loaded project
        await page.locator('#btn-redo').click();
        await page.waitForTimeout(300);
        const countAfterRedo = await page.evaluate(() => window.workspaceComponents.length);

        scenarioResults.s2_restore_and_undo = countAfterClear === 0 &&
          restoredCounts.comps === savedProjectData.data.components.length &&
          restoredCounts.conns === savedProjectData.data.connections.length &&
          countAfterUndo === 0 &&
          countAfterRedo === restoredCounts.comps;

        console.log(`  Skenario 2 (Kosongkan, Buka Proyek & Undo/Redo): ${scenarioResults.s2_restore_and_undo ? 'PASS' : 'FAIL'} (Clear: ${countAfterClear} -> Restore: ${restoredCounts.comps} -> Undo: ${countAfterUndo} -> Redo: ${countAfterRedo})`);
      } catch (err) {
        console.error('Error in Skenario 2:', err.message);
        scenarioResults.s2_restore_and_undo = false;
      }

      // -------------------------------------------------------------
      // Skenario 3: Simulasi setelah buka (preset 3 aktif, tekan S1 -> K1 ON)
      // -------------------------------------------------------------
      try {
        await page.evaluate(() => {
          window.setMode('simulate');
          // Find button-no (S1)
          const btn = window.workspaceComponents.find(c => c.defId === 'button-no' || c.defId === 'button-push-no');
          if (btn) {
            window.SimEngine.buttonStates[btn.id] = { pressed: true };
            window.SimEngine.solveElectricalNetwork();
            window.SimEngine.solveValveActuations();
          }
        });
        await page.waitForTimeout(300);

        const k1Active = await page.evaluate(() => {
          const sim = window.SimEngine;
          return !!(sim && sim.relayStates && sim.relayStates['K1']);
        });

        await page.evaluate(() => window.setMode('edit'));
        await page.waitForTimeout(200);

        scenarioResults.s3_simulation_functional = k1Active;
        console.log(`  Skenario 3 (Simulasi Preset 3 K1 Aktif): ${scenarioResults.s3_simulation_functional ? 'PASS' : 'FAIL'} (K1 Active: ${k1Active})`);
      } catch (err) {
        console.error('Error in Skenario 3:', err.message);
        scenarioResults.s3_simulation_functional = false;
      }

      // -------------------------------------------------------------
      // Skenario 4: Buka file tidak valid (teks biasa, format salah, kabel hantu)
      // -------------------------------------------------------------
      try {
        const compCountBefore = await page.evaluate(() => window.workspaceComponents.length);

        // 4a: Teks biasa
        await page.locator('#file-input-project').setInputFiles(path.join(testFilesDir, 'test_invalid_text.json'));
        await page.waitForTimeout(400);
        const countAfter4a = await page.evaluate(() => window.workspaceComponents.length);

        // 4b: Format identifier salah
        await page.locator('#file-input-project').setInputFiles(path.join(testFilesDir, 'test_invalid_format.json'));
        await page.waitForTimeout(400);
        const countAfter4b = await page.evaluate(() => window.workspaceComponents.length);

        // 4c: Kabel merujuk komponen tidak ada
        await page.locator('#file-input-project').setInputFiles(path.join(testFilesDir, 'test_invalid_missing_comp.json'));
        await page.waitForTimeout(400);
        const countAfter4c = await page.evaluate(() => window.workspaceComponents.length);

        const untouched = compCountBefore === countAfter4a &&
                          countAfter4a === countAfter4b &&
                          countAfter4b === countAfter4c &&
                          compCountBefore > 0;

        scenarioResults.s4_invalid_file_rejection = untouched;
        console.log(`  Skenario 4 (Validasi & penolakan file rusak): ${scenarioResults.s4_invalid_file_rejection ? 'PASS' : 'FAIL'} (Komponen tetap stabil: ${compCountBefore})`);
      } catch (err) {
        console.error('Error in Skenario 4:', err.message);
        scenarioResults.s4_invalid_file_rejection = false;
      }

      // -------------------------------------------------------------
      // Skenario 5: Buka file versi lama (legacy raw format)
      // -------------------------------------------------------------
      try {
        await page.locator('#file-input-project').setInputFiles(path.join(testFilesDir, 'test_legacy_format.json'));
        await page.waitForTimeout(500);

        const legacyCounts = await page.evaluate(() => {
          return {
            comps: window.workspaceComponents.length,
            conns: window.connections.length,
            labels: window.workspaceComponents.map(c => c.label)
          };
        });

        scenarioResults.s5_legacy_compatibility = legacyCounts.comps === 2 &&
                                                 legacyCounts.conns === 1 &&
                                                 legacyCounts.labels.includes('K1');
        console.log(`  Skenario 5 (Kompatibilitas format legacy): ${scenarioResults.s5_legacy_compatibility ? 'PASS' : 'FAIL'} (Comps: ${legacyCounts.comps}, Conns: ${legacyCounts.conns}, Labels: ${legacyCounts.labels.join(',')})`);
      } catch (err) {
        console.error('Error in Skenario 5:', err.message);
        scenarioResults.s5_legacy_compatibility = false;
      }

      // -------------------------------------------------------------
      // Skenario 6: Ctrl+S mengunduh file
      // -------------------------------------------------------------
      try {
        await page.evaluate(() => document.body.focus());
        const [ctrlSDownload] = await Promise.all([
          page.waitForEvent('download'),
          page.keyboard.press('Control+s'),
        ]);

        const ctrlSFilename = ctrlSDownload.suggestedFilename();
        const ctrlSMatches = /^pneulab-proyek-\d{8}-\d{4}\.json$/.test(ctrlSFilename);

        scenarioResults.s6_ctrl_s_downloads_file = ctrlSMatches;
        console.log(`  Skenario 6 (Ctrl+S mengunduh file): ${scenarioResults.s6_ctrl_s_downloads_file ? 'PASS' : 'FAIL'} (Filename: ${ctrlSFilename})`);
      } catch (err) {
        console.error('Error in Skenario 6:', err.message);
        scenarioResults.s6_ctrl_s_downloads_file = false;
      }

      // -------------------------------------------------------------
      // Skenario 8 & 9: Bebas console error, mode toggle aman
      // -------------------------------------------------------------
      await page.evaluate(() => {
        window.setMode('simulate');
        window.setMode('edit');
      });

      scenarioResults.s9_zero_errors_and_modes = pageErrors.length === 0;
      console.log(`  Skenario 9 (Nol pageerror console): ${scenarioResults.s9_zero_errors_and_modes ? 'PASS' : 'FAIL'} (Errors: ${pageErrors.length})`);

      const allPassed = Object.values(scenarioResults).every(v => v === true);
      overallResults.push({
        file: htmlFile,
        viewport: vp.name,
        passed: allPassed,
        scenarios: scenarioResults
      });

      await context.close();
    }
  }

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`FINAL TEST SUMMARY`);
  console.log(`======================================================`);
  let totalFailures = 0;
  for (const r of overallResults) {
    const status = r.passed ? '[PASS]' : '[FAIL]';
    if (!r.passed) totalFailures++;
    console.log(`${status} ${r.file} - ${r.viewport}`);
  }

  if (totalFailures === 0) {
    console.log(`\n>>> ALL SCENARIOS PASSED ACROSS ALL VIEWPORTS & FILES! <<<`);
    process.exit(0);
  } else {
    console.error(`\n>>> ${totalFailures} TEST CONFIGURATIONS FAILED! <<<`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
