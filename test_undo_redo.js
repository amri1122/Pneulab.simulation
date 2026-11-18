const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const screenshotDir = path.join(__dirname, 'screenshots_undo_redo');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const viewports = [
  { name: 'desktop_1366x768', width: 1366, height: 768, isMobile: false, hasTouch: false },
  { name: 'desktop_1280x600', width: 1280, height: 600, isMobile: false, hasTouch: false },
  { name: 'mobile_390x844', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'mobile_360x740', width: 360, height: 740, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'tablet_768x1024', width: 768, height: 1024, isMobile: false, hasTouch: true },
];

const testFiles = ['index.html', 'index_single.html'];

async function runTests() {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const overallResults = [];

  for (const file of testFiles) {
    const fileUrl = 'file:///' + path.join(__dirname, file).replace(/\\/g, '/');
    console.log(`\n======================================================`);
    console.log(`TESTING FILE: ${file}`);
    console.log(`======================================================`);

    for (const vp of viewports) {
      console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        deviceScaleFactor: vp.deviceScaleFactor || 1,
      });

      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', err => pageErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') pageErrors.push(msg.text());
      });

      await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Pastikan workspace view aktif
      await page.evaluate(() => {
        if (window.showWorkspaceView) window.showWorkspaceView();
      });
      await page.waitForTimeout(300);

      const scenarioResults = {};

      // Skenario 8: Cek tombol Batal/Ulang terlihat di toolbar, tidak meluap, touch target >= 36px
      const toolbarButtonsCheck = await page.evaluate(() => {
        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');
        const toolbar = document.getElementById('workspace-toolbar');
        const tbRect = toolbar.getBoundingClientRect();
        const uRect = btnUndo ? btnUndo.getBoundingClientRect() : null;
        const rRect = btnRedo ? btnRedo.getBoundingClientRect() : null;

        // elementFromPoint check
        const uCenter = uRect ? { x: uRect.left + uRect.width / 2, y: uRect.top + uRect.height / 2 } : null;
        const elAtUndo = uCenter ? document.elementFromPoint(uCenter.x, uCenter.y) : null;
        const undoClickable = elAtUndo && (elAtUndo === btnUndo || btnUndo.contains(elAtUndo));

        // toolbar overflow check
        const inBoundsUndo = uRect && uRect.left >= tbRect.left - 2 && uRect.right <= tbRect.right + 2;
        const inBoundsRedo = rRect && rRect.left >= tbRect.left - 2 && rRect.right <= tbRect.right + 2;

        return {
          undoExists: !!btnUndo,
          redoExists: !!btnRedo,
          undoWidth: uRect ? uRect.width : 0,
          undoHeight: uRect ? uRect.height : 0,
          redoWidth: rRect ? rRect.width : 0,
          redoHeight: rRect ? rRect.height : 0,
          undoClickable,
          inBoundsUndo,
          inBoundsRedo,
          undoDisabled: btnUndo ? btnUndo.disabled : false,
          redoDisabled: btnRedo ? btnRedo.disabled : false,
        };
      });

      const touchTargetPass = vp.isMobile
        ? (toolbarButtonsCheck.undoHeight >= 36 && toolbarButtonsCheck.undoWidth >= 34)
        : (toolbarButtonsCheck.undoHeight >= 26);

      scenarioResults.s8_toolbar = toolbarButtonsCheck.undoExists &&
        toolbarButtonsCheck.redoExists &&
        toolbarButtonsCheck.inBoundsUndo &&
        toolbarButtonsCheck.inBoundsRedo &&
        touchTargetPass;

      console.log(`  Skenario 8 (Toolbar visibility & touch target): ${scenarioResults.s8_toolbar ? 'PASS' : 'FAIL'} (Undo: ${toolbarButtonsCheck.undoWidth.toFixed(1)}x${toolbarButtonsCheck.undoHeight.toFixed(1)}px, Redo: ${toolbarButtonsCheck.redoWidth.toFixed(1)}x${toolbarButtonsCheck.redoHeight.toFixed(1)}px)`);

      // Skenario 1: Awal tombol disabled. Tambah 1 komponen -> Ctrl+Z -> hilang -> Ctrl+Y -> kembali ID & posisi sama.
      const initialDisabled = toolbarButtonsCheck.undoDisabled && toolbarButtonsCheck.redoDisabled;
      
      // Tambah komponen via window.addComponent atau drag
      const comp1Data = await page.evaluate(() => {
        return window.addComponent('compressor', 200, 200, { label: 'K1_Test' });
      });
      await page.waitForTimeout(200);

      const afterAdd1 = await page.evaluate(() => {
        const u = document.getElementById('btn-undo');
        const r = document.getElementById('btn-redo');
        return {
          compCount: window.workspaceComponents.length,
          undoEnabled: u && !u.disabled,
          redoDisabled: r && r.disabled,
        };
      });

      // Lakukan Ctrl+Z (Undo)
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(300);

      const afterUndo1 = await page.evaluate(() => {
        const u = document.getElementById('btn-undo');
        const r = document.getElementById('btn-redo');
        return {
          compCount: window.workspaceComponents.length,
          undoDisabled: u && u.disabled,
          redoEnabled: r && !r.disabled,
        };
      });

      // Lakukan Ctrl+Y (Redo)
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(300);

      const afterRedo1 = await page.evaluate((originalId) => {
        const comp = window.workspaceComponents.find(c => c.id === originalId);
        return {
          compCount: window.workspaceComponents.length,
          idMatched: !!comp && comp.id === originalId,
          x: comp ? comp.x : 0,
          y: comp ? comp.y : 0,
          label: comp ? comp.label : '',
        };
      }, comp1Data.id);

      scenarioResults.s1_basic_undo_redo = initialDisabled &&
        afterAdd1.compCount === 1 && afterAdd1.undoEnabled &&
        afterUndo1.compCount === 0 && afterUndo1.redoEnabled &&
        afterRedo1.compCount === 1 && afterRedo1.idMatched && afterRedo1.x === comp1Data.x;

      console.log(`  Skenario 1 (Awal disabled, tambah, Ctrl+Z, Ctrl+Y): ${scenarioResults.s1_basic_undo_redo ? 'PASS' : 'FAIL'}`);

      // Bersihkan untuk Skenario 2
      await page.evaluate(() => window.clearAllComponents(true));
      await page.waitForTimeout(200);

      // Skenario 2: Tambah 3 komponen, sambung 1 kabel, lalu undo berulang sampai awal.
      const s2Setup = await page.evaluate(() => {
        const c1 = window.addComponent('compressor', 100, 200);
        const c2 = window.addComponent('frl-unit', 250, 200);
        const c3 = window.addComponent('cylinder-single', 400, 200);
        const conn = window.addConnection(c1.id, 1, c2.id, 1, 'pneumatic');
        return {
          c1Id: c1.id,
          c2Id: c2.id,
          c3Id: c3.id,
          connId: conn ? conn.id : null,
          initialComponents: window.workspaceComponents.length,
          initialConnections: window.connections.length,
        };
      });
      await page.waitForTimeout(300);

      // Undo 1: kabel hilang
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);
      const undoStep1 = await page.evaluate(() => ({
        comps: window.workspaceComponents.length,
        conns: window.connections.length,
      }));

      // Undo 2: c3 hilang
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);
      const undoStep2 = await page.evaluate(() => ({
        comps: window.workspaceComponents.length,
        conns: window.connections.length,
      }));

      // Undo 3: c2 hilang
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);
      const undoStep3 = await page.evaluate(() => ({
        comps: window.workspaceComponents.length,
        conns: window.connections.length,
      }));

      // Undo 4: c1 hilang
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);
      const undoStep4 = await page.evaluate(() => ({
        comps: window.workspaceComponents.length,
        conns: window.connections.length,
      }));

      scenarioResults.s2_multi_step_undo = s2Setup.initialComponents === 3 && s2Setup.initialConnections === 1 &&
        undoStep1.comps === 3 && undoStep1.conns === 0 &&
        undoStep2.comps === 2 && undoStep2.conns === 0 &&
        undoStep3.comps === 1 && undoStep3.conns === 0 &&
        undoStep4.comps === 0 && undoStep4.conns === 0;

      console.log(`  Skenario 2 (Tambah 3 komponen + 1 kabel, undo bertahap): ${scenarioResults.s2_multi_step_undo ? 'PASS' : 'FAIL'}`);

      // Skenario 3: Seret komponen beberapa piksel -> 1 langkah undo mengembalikan posisi awal.
      await page.evaluate(() => window.clearAllComponents(true));
      const dragTestComp = await page.evaluate(() => {
        return window.addComponent('cylinder-single', 300, 300);
      });
      await page.waitForTimeout(200);

      // Lakukan drag pada elemen komponen
      await page.evaluate((id) => {
        const c = window.workspaceComponents.find(comp => comp.id === id);
        if (c) {
          window.startComponentDrag(id, c.x, c.y);
          window.updateComponentPosition(id, c.x + 80, c.y + 60);
          window.handleWorkspaceMouseUp();
        }
      }, dragTestComp.id);
      await page.waitForTimeout(300);

      const afterDrag = await page.evaluate((id) => {
        const c = window.workspaceComponents.find(comp => comp.id === id);
        return c ? { x: c.x, y: c.y } : null;
      }, dragTestComp.id);

      // Undo drag
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(300);

      const afterUndoDrag = await page.evaluate((id) => {
        const c = window.workspaceComponents.find(comp => comp.id === id);
        return c ? { x: c.x, y: c.y } : null;
      }, dragTestComp.id);

      scenarioResults.s3_drag_undo = afterDrag && afterUndoDrag &&
        (afterDrag.x !== dragTestComp.x || afterDrag.y !== dragTestComp.y) &&
        (afterUndoDrag.x === dragTestComp.x && afterUndoDrag.y === dragTestComp.y);

      console.log(`  Skenario 3 (Drag komponen & undo posisi): ${scenarioResults.s3_drag_undo ? 'PASS' : 'FAIL'} (Awal: ${dragTestComp.x},${dragTestComp.y} -> Drag: ${afterDrag.x},${afterDrag.y} -> Undo: ${afterUndoDrag.x},${afterUndoDrag.y})`);

      // Skenario 4: Ubah properti (label) lalu undo: label kembali.
      await page.evaluate((id) => {
        window.selectComponent(id);
      }, dragTestComp.id);
      await page.waitForTimeout(200);

      const origLabel = dragTestComp.label;
      await page.evaluate((id) => {
        const input = document.getElementById('prop-comp-label');
        if (input) {
          input.value = 'Silinder_Kustom_X';
          const form = document.getElementById('property-form');
          if (form) form.dispatchEvent(new Event('submit'));
        }
      }, dragTestComp.id);
      await page.waitForTimeout(300);

      const labelAfterEdit = await page.evaluate((id) => {
        const c = window.workspaceComponents.find(comp => comp.id === id);
        return c ? c.label : '';
      }, dragTestComp.id);

      await page.keyboard.press('Control+z');
      await page.waitForTimeout(300);

      const labelAfterUndo = await page.evaluate((id) => {
        const c = window.workspaceComponents.find(comp => comp.id === id);
        return c ? c.label : '';
      }, dragTestComp.id);

      scenarioResults.s4_property_undo = labelAfterEdit === 'Silinder_Kustom_X' && labelAfterUndo === origLabel;
      console.log(`  Skenario 4 (Edit properti label & undo): ${scenarioResults.s4_property_undo ? 'PASS' : 'FAIL'} ("${origLabel}" -> "${labelAfterEdit}" -> "${labelAfterUndo}")`);

      // Skenario 5: Muat preset materi 1, lalu undo: area kerja kembali ke kondisi sebelumnya.
      const beforePresetCompCount = await page.evaluate(() => window.workspaceComponents.length);
      await page.evaluate(() => {
        window.loadPresetCircuit('direct');
      });
      await page.waitForTimeout(300);

      const afterPresetCompCount = await page.evaluate(() => window.workspaceComponents.length);

      // Undo load preset
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(300);

      const afterUndoPresetCompCount = await page.evaluate(() => window.workspaceComponents.length);

      scenarioResults.s5_preset_undo = afterPresetCompCount >= 4 && afterUndoPresetCompCount === beforePresetCompCount;
      console.log(`  Skenario 5 (Muat preset materi 1 & 1x Undo): ${scenarioResults.s5_preset_undo ? 'PASS' : 'FAIL'} (${beforePresetCompCount} -> ${afterPresetCompCount} -> ${afterUndoPresetCompCount})`);

      // Skenario 6: Setelah undo, lakukan aksi baru: riwayat redo kosong dan tombol Ulang nonaktif.
      // Saat ini redo aktif (karena baru saja undo preset)
      const redoActiveBeforeNewAction = await page.evaluate(() => {
        const r = document.getElementById('btn-redo');
        return r && !r.disabled;
      });

      // Lakukan aksi baru: tambah komponen
      await page.evaluate(() => window.addComponent('valve-3-2', 500, 300));
      await page.waitForTimeout(200);

      const redoAfterNewAction = await page.evaluate(() => {
        const r = document.getElementById('btn-redo');
        return {
          redoDisabled: r && r.disabled,
          historyLen: window.historyStack ? window.historyStack.length : 0,
        };
      });

      scenarioResults.s6_redo_cleared_on_new_action = redoActiveBeforeNewAction && redoAfterNewAction.redoDisabled;
      console.log(`  Skenario 6 (Aksi baru menghapus riwayat Redo): ${scenarioResults.s6_redo_cleared_on_new_action ? 'PASS' : 'FAIL'}`);

      // Skenario 7: Mode simulasi: tombol undo/redo nonaktif. Kembali ke edit: riwayat tetap ada.
      await page.evaluate(() => window.setMode('simulate'));
      await page.waitForTimeout(200);

      const simButtonsState = await page.evaluate(() => {
        const u = document.getElementById('btn-undo');
        const r = document.getElementById('btn-redo');
        return {
          undoDisabled: u && u.disabled,
          redoDisabled: r && r.disabled,
        };
      });

      // Coba shortcut saat simulasi (harus dicegah)
      const compsDuringSim = await page.evaluate(() => window.workspaceComponents.length);
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(200);
      const compsAfterSimUndo = await page.evaluate(() => window.workspaceComponents.length);

      // Kembali ke edit mode
      await page.evaluate(() => window.setMode('edit'));
      await page.waitForTimeout(200);

      const editButtonsState = await page.evaluate(() => {
        const u = document.getElementById('btn-undo');
        return {
          undoEnabled: u && !u.disabled,
        };
      });

      scenarioResults.s7_simulation_lock = simButtonsState.undoDisabled &&
        simButtonsState.redoDisabled &&
        compsDuringSim === compsAfterSimUndo &&
        editButtonsState.undoEnabled;

      console.log(`  Skenario 7 (Kunci Undo saat simulasi, pulih di edit mode): ${scenarioResults.s7_simulation_lock ? 'PASS' : 'FAIL'}`);

      // Skenario 9: Simpan (Ctrl+S), reload: riwayat mulai kosong, rangkaian termuat dari storage.
      await page.keyboard.press('Control+s');
      await page.waitForTimeout(300);

      // Reload page
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const afterReloadCheck = await page.evaluate(() => {
        const u = document.getElementById('btn-undo');
        const r = document.getElementById('btn-redo');
        return {
          historyLen: window.historyStack ? window.historyStack.length : 0,
          undoDisabled: u && u.disabled,
          redoDisabled: r && r.disabled,
        };
      });

      // Muat project yang tersimpan
      await page.evaluate(() => window.loadProject());
      await page.waitForTimeout(300);

      const afterLoadStorage = await page.evaluate(() => {
        const u = document.getElementById('btn-undo');
        return {
          compCount: window.workspaceComponents.length,
          undoEnabled: u && !u.disabled,
        };
      });

      scenarioResults.s9_save_reload_clean_history = afterReloadCheck.undoDisabled &&
        afterReloadCheck.redoDisabled &&
        afterLoadStorage.compCount > 0 &&
        afterLoadStorage.undoEnabled;

      console.log(`  Skenario 9 (Ctrl+S, reload riwayat kosong, loadProject bisa di-undo): ${scenarioResults.s9_save_reload_clean_history ? 'PASS' : 'FAIL'}`);

      // Skenario 10: Bebas pageerror console, preset 1-3 termuat, mode edit <-> sim lancar.
      let presetsPass = true;
      for (const mId of ['direct', 'indirect', 'electropneumatic']) {
        const count = await page.evaluate((id) => {
          window.loadPresetCircuit(id);
          return window.workspaceComponents.length;
        }, mId);
        if (count < 3) presetsPass = false;
      }
      await page.evaluate(() => {
        window.setMode('simulate');
        window.setMode('edit');
      });

      scenarioResults.s10_no_errors_and_presets = (pageErrors.length === 0) && presetsPass;
      console.log(`  Skenario 10 (Zero console errors & presets 1-3 valid): ${scenarioResults.s10_no_errors_and_presets ? 'PASS' : 'FAIL'} (Errors: ${pageErrors.length})`);

      // Screenshot toolbar
      const ssPath = path.join(screenshotDir, `${file.replace('.html','')}_${vp.name}_toolbar.png`);
      const toolbarLoc = page.locator('#workspace-toolbar');
      if (await toolbarLoc.count() > 0) {
        await toolbarLoc.screenshot({ path: ssPath });
      } else {
        await page.screenshot({ path: ssPath });
      }

      const allVpPass = Object.values(scenarioResults).every(v => v === true);
      overallResults.push({
        file,
        viewport: vp.name,
        width: vp.width,
        pass: allVpPass,
        scenarios: scenarioResults,
        errors: pageErrors,
      });

      await context.close();
    }
  }

  await browser.close();

  console.log(`\n======================================================`);
  console.log(`FINAL TEST SUMMARY`);
  console.log(`======================================================`);
  let totalPass = true;
  for (const r of overallResults) {
    console.log(`[${r.pass ? 'PASS' : 'FAIL'}] ${r.file} - ${r.viewport}`);
    if (!r.pass) {
      totalPass = false;
      console.log(`   Failed scenarios:`, Object.entries(r.scenarios).filter(([k,v]) => !v).map(([k]) => k));
    }
  }

  if (totalPass) {
    console.log(`\n>>> ALL 10 SCENARIOS PASSED ACROSS ALL VIEWPORTS & FILES! <<<`);
  } else {
    console.log(`\n>>> SOME TESTS FAILED! <<<`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
