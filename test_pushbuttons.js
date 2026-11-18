const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HTML_FILE = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const SINGLE_HTML_FILE = 'file:///' + path.resolve(__dirname, 'index_single.html').replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots_pushbuttons');

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
  console.log('=== STARTING TEST SUITE FOR FLUIDSIM PUSHBUTTONS ===\n');
  const results = [];

  // =========================================================================
  // SCENARIO 1: Keenam Simbol di Library dan Area Kerja
  // =========================================================================
  try {
    console.log('--- Running Scenario 1: Six Pushbutton Symbols Check ---');
    const { page } = await initBrowser({ width: 1366, height: 768 });
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    // Buka kategori Elektrikal
    await page.click('button[data-category="electrical"]');
    await page.waitForTimeout(300);

    const checkLibraryAndSymbols = await page.evaluate(() => {
      window.clearAllComponents(true);

      const defIds = [
        'button-no',
        'button-no-detent',
        'button-nc',
        'button-nc-detent',
        'button-changeover',
        'button-changeover-detent'
      ];

      // Verifikasi keberadaan di DOM Library
      const libItems = defIds.map(id => {
        const item = document.querySelector(`.library-component-item[data-def-id="${id}"]`);
        return {
          id,
          found: !!item,
          name: item ? item.querySelector('.library-item-name').textContent.trim() : '',
          desc: item ? item.querySelector('.library-item-desc').textContent.trim() : ''
        };
      });

      // Tambahkan keenam tombol ke workspace berdampingan
      const addedComps = defIds.map((id, index) => {
        const x = 120 + (index % 3) * 160;
        const y = 140 + Math.floor(index / 3) * 160;
        return window.addComponent(id, x, y);
      });

      // Analisis SVG masing-masing tombol
      const symbolDetails = defIds.map(id => {
        const comp = window.workspaceComponents.find(c => c.defId === id);
        const group = document.getElementById(`comp-${comp.id}`);
        const texts = Array.from(group.querySelectorAll('text')).map(t => t.textContent.trim());
        const lines = Array.from(group.querySelectorAll('line')).map(l => ({
          x1: l.getAttribute('x1'), y1: l.getAttribute('y1'),
          x2: l.getAttribute('x2'), y2: l.getAttribute('y2'),
          dash: l.getAttribute('stroke-dasharray')
        }));
        const paths = Array.from(group.querySelectorAll('path')).map(p => p.getAttribute('d'));
        const polygons = Array.from(group.querySelectorAll('polygon')).map(p => p.getAttribute('points'));
        const ports = Array.from(group.querySelectorAll('.component-port')).map(p => ({
          id: p.id, r: p.getAttribute('r'), fill: window.getComputedStyle(p).fill
        }));

        const isDetent = id.includes('detent');
        const hasDetentActuator = lines.some(l => l.dash === '5,2,1.5,2');
        const hasMomentaryActuator = lines.some(l => l.dash === '2.5,2');
        const hasEHead = paths.some(p => p.includes('-6') && p.includes('6'));

        return {
          id,
          texts,
          linesCount: lines.length,
          portsCount: ports.length,
          hasEHead,
          isDetent,
          actuatorPass: isDetent ? hasDetentActuator : hasMomentaryActuator,
          hasLTerminal: id.includes('nc') || id.includes('changeover') ? paths.some(p => p.includes('-10')) : true
        };
      });

      return { libItems, symbolDetails };
    });

    console.log('Library items found:', checkLibraryAndSymbols.libItems.map(i => `${i.id}: ${i.found}`));
    console.log('Symbol details:', checkLibraryAndSymbols.symbolDetails.map(s => `${s.id} ports:${s.portsCount} act:${s.actuatorPass}`));

    const allLibFound = checkLibraryAndSymbols.libItems.every(i => i.found);
    const allSymbolsValid = checkLibraryAndSymbols.symbolDetails.every(s => s.hasEHead && s.actuatorPass && s.hasLTerminal);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc01_all_pushbuttons_workspace.png') });

    results.push({
      scenario: '1. Six Pushbutton Symbols in Library and Workspace (FluidSIM Standard)',
      pass: allLibFound && allSymbolsValid,
      details: checkLibraryAndSymbols
    });
  } catch (err) {
    console.error('Scenario 1 Failed:', err);
    results.push({ scenario: '1. Six Pushbutton Symbols', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 2: Presisi Terminal & Jarak Ujung Stub terhadap Pusat Port (<= 1px)
  // =========================================================================
  try {
    console.log('--- Running Scenario 2: Terminal Stubs Precision Check (<= 1px) ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const precisionResult = await page.evaluate(() => {
      window.clearAllComponents(true);

      const defIds = [
        'button-no',
        'button-no-detent',
        'button-nc',
        'button-nc-detent',
        'button-changeover',
        'button-changeover-detent'
      ];

      const checks = [];

      defIds.forEach(id => {
        const comp = window.addComponent(id, 200, 200);
        const group = document.getElementById(`comp-${comp.id}`);

        comp.ports.forEach(port => {
          const portPos = window.getPortPosition(port, comp.width, comp.height);
          const portCircle = group.querySelector(`#port-${comp.id}-${port.portNumber}`);
          const cx = parseFloat(portCircle.getAttribute('cx'));
          const cy = parseFloat(portCircle.getAttribute('cy'));

          // Cek deviasi pusat port
          const portDevX = Math.abs(portPos.x - cx);
          const portDevY = Math.abs(portPos.y - cy);

          // Cek keberadaan garis/path stub yang berakhir di portPos
          const lines = Array.from(group.querySelectorAll('line'));
          const paths = Array.from(group.querySelectorAll('path'));

          let minStubDist = 999;
          lines.forEach(l => {
            const x1 = parseFloat(l.getAttribute('x1'));
            const y1 = parseFloat(l.getAttribute('y1'));
            const x2 = parseFloat(l.getAttribute('x2'));
            const y2 = parseFloat(l.getAttribute('y2'));
            const d1 = Math.hypot(x1 - portPos.x, y1 - portPos.y);
            const d2 = Math.hypot(x2 - portPos.x, y2 - portPos.y);
            minStubDist = Math.min(minStubDist, d1, d2);
          });

          paths.forEach(p => {
            const d = p.getAttribute('d');
            // Cek titik awal koordinat path M x,y
            const match = d.match(/M\s*([-\d.]+)\s*,\s*([-\d.]+)/i);
            if (match) {
              const mx = parseFloat(match[1]);
              const my = parseFloat(match[2]);
              const dist = Math.hypot(mx - portPos.x, my - portPos.y);
              minStubDist = Math.min(minStubDist, dist);
            }
          });

          checks.push({
            compDef: id,
            portName: port.name,
            portNumber: port.portNumber,
            portPos,
            circlePos: { cx, cy },
            minStubDist,
            pass: portDevX <= 1.0 && portDevY <= 1.0 && minStubDist <= 1.0
          });
        });
      });

      return { checks, allPass: checks.every(c => c.pass) };
    });

    console.log('Precision checks count:', precisionResult.checks.length, 'All Pass:', precisionResult.allPass);
    precisionResult.checks.forEach(c => {
      console.log(`  ${c.compDef} pin ${c.portName}: stubDist = ${c.minStubDist.toFixed(2)}px (pass: ${c.pass})`);
    });

    results.push({
      scenario: '2. Terminal Precision & Stub Distance <= 1px',
      pass: precisionResult.allPass,
      details: precisionResult.checks
    });
  } catch (err) {
    console.error('Scenario 2 Failed:', err);
    results.push({ scenario: '2. Terminal Precision', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 3: Simulasi Momentary (NO dan NC)
  // =========================================================================
  try {
    console.log('--- Running Scenario 3: Momentary Simulation (NO & NC) ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const momentaryResult = await page.evaluate(async () => {
      window.clearAllComponents(true);

      const dc = window.addComponent('dc-source', 100, 200);
      const bNO = window.addComponent('button-no', 250, 150);
      const bNC = window.addComponent('button-nc', 250, 300);
      const lampNO = window.addComponent('indicator-lamp', 450, 150);
      const lampNC = window.addComponent('indicator-lamp', 450, 300);

      // Jalur NO: +24V -> bNO(1), bNO(2) -> lampNO(1), lampNO(2) -> 0V
      window.addConnection(dc.id, 1, bNO.id, 1, 'electrical');
      window.addConnection(bNO.id, 2, lampNO.id, 1, 'electrical');
      window.addConnection(lampNO.id, 2, dc.id, 2, 'electrical');

      // Jalur NC: +24V -> bNC(1), bNC(2) -> lampNC(1), lampNC(2) -> 0V
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
      return { s0, s1, s2, s3, s4 };
    });

    console.log('Momentary simulation result:', momentaryResult);
    const pass = !momentaryResult.s0.lampNO && momentaryResult.s0.lampNC &&
                 momentaryResult.s1.lampNO && momentaryResult.s1.lampNC &&
                 !momentaryResult.s2.lampNO && momentaryResult.s2.lampNC &&
                 !momentaryResult.s3.lampNO && !momentaryResult.s3.lampNC &&
                 !momentaryResult.s4.lampNO && momentaryResult.s4.lampNC;

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc03_momentary_simulation.png') });

    results.push({
      scenario: '3. Momentary Simulation (NO & NC press and release)',
      pass,
      details: momentaryResult
    });
  } catch (err) {
    console.error('Scenario 3 Failed:', err);
    results.push({ scenario: '3. Momentary Simulation', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 4: Simulasi Detent (Latching NO dan NC)
  // =========================================================================
  try {
    console.log('--- Running Scenario 4: Detent Latching Simulation (NO & NC) ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const detentResult = await page.evaluate(async () => {
      window.clearAllComponents(true);

      const dc = window.addComponent('dc-source', 100, 200);
      const bNODetent = window.addComponent('button-no-detent', 250, 150);
      const bNCDetent = window.addComponent('button-nc-detent', 250, 300);
      const lampNO = window.addComponent('indicator-lamp', 450, 150);
      const lampNC = window.addComponent('indicator-lamp', 450, 300);

      window.addConnection(dc.id, 1, bNODetent.id, 1, 'electrical');
      window.addConnection(bNODetent.id, 2, lampNO.id, 1, 'electrical');
      window.addConnection(lampNO.id, 2, dc.id, 2, 'electrical');

      window.addConnection(dc.id, 1, bNCDetent.id, 1, 'electrical');
      window.addConnection(bNCDetent.id, 2, lampNC.id, 1, 'electrical');
      window.addConnection(lampNC.id, 2, dc.id, 2, 'electrical');

      window.SimEngine.start();

      // State 0: Normal (NO Detent off, NC Detent on)
      window.SimEngine.tick(0.05);
      const s0 = {
        lampNO: !!window.SimEngine.lampStates[lampNO.id],
        lampNC: !!window.SimEngine.lampStates[lampNC.id]
      };

      // State 1: Klik 1x bNODetent (press & release) -> status HARUS TETAP AKTIF!
      window.SimEngine.pressButton(bNODetent.id);
      window.SimEngine.releaseButton(bNODetent.id);
      window.SimEngine.tick(0.05);
      const s1 = {
        isPressed: !!window.SimEngine.buttonStates[bNODetent.id].pressed,
        lampNO: !!window.SimEngine.lampStates[lampNO.id],
        lampNC: !!window.SimEngine.lampStates[lampNC.id]
      };

      // State 2: Klik ke-2 bNODetent -> status kembali OFF!
      window.SimEngine.pressButton(bNODetent.id);
      window.SimEngine.releaseButton(bNODetent.id);
      window.SimEngine.tick(0.05);
      const s2 = {
        isPressed: !!window.SimEngine.buttonStates[bNODetent.id].pressed,
        lampNO: !!window.SimEngine.lampStates[lampNO.id],
        lampNC: !!window.SimEngine.lampStates[lampNC.id]
      };

      // State 3: Klik 1x bNCDetent -> status TETAP AKTIF (lampu NC padam terus)
      window.SimEngine.pressButton(bNCDetent.id);
      window.SimEngine.releaseButton(bNCDetent.id);
      window.SimEngine.tick(0.05);
      const s3 = {
        isPressed: !!window.SimEngine.buttonStates[bNCDetent.id].pressed,
        lampNO: !!window.SimEngine.lampStates[lampNO.id],
        lampNC: !!window.SimEngine.lampStates[lampNC.id]
      };

      // State 4: Klik ke-2 bNCDetent -> kembali normal (lampu NC menyala lagi)
      window.SimEngine.pressButton(bNCDetent.id);
      window.SimEngine.releaseButton(bNCDetent.id);
      window.SimEngine.tick(0.05);
      const s4 = {
        isPressed: !!window.SimEngine.buttonStates[bNCDetent.id].pressed,
        lampNO: !!window.SimEngine.lampStates[lampNO.id],
        lampNC: !!window.SimEngine.lampStates[lampNC.id]
      };

      window.SimEngine.stop();
      return { s0, s1, s2, s3, s4 };
    });

    console.log('Detent simulation result:', detentResult);
    const pass = !detentResult.s0.lampNO && detentResult.s0.lampNC &&
                 detentResult.s1.isPressed && detentResult.s1.lampNO && detentResult.s1.lampNC &&
                 !detentResult.s2.isPressed && !detentResult.s2.lampNO && detentResult.s2.lampNC &&
                 detentResult.s3.isPressed && !detentResult.s3.lampNC &&
                 !detentResult.s4.isPressed && detentResult.s4.lampNC;

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc04_detent_simulation.png') });

    results.push({
      scenario: '4. Detent Switch Simulation (Latching NO & NC single click toggle)',
      pass,
      details: detentResult
    });
  } catch (err) {
    console.error('Scenario 4 Failed:', err);
    results.push({ scenario: '4. Detent Switch Simulation', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 5: Simulasi Changeover (Momentary & Detent)
  // =========================================================================
  try {
    console.log('--- Running Scenario 5: Changeover Simulation (Push & Detent) ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const changeoverResult = await page.evaluate(async () => {
      window.clearAllComponents(true);

      const dc = window.addComponent('dc-source', 100, 250);
      const bChg = window.addComponent('button-changeover', 280, 200);
      const lampNC = window.addComponent('indicator-lamp', 480, 140);
      const lampNO = window.addComponent('indicator-lamp', 480, 260);

      // +24V ke COM (Port 1, Pin 11)
      window.addConnection(dc.id, 1, bChg.id, 1, 'electrical');
      // NC (Port 2, Pin 12) ke lampNC
      window.addConnection(bChg.id, 2, lampNC.id, 1, 'electrical');
      window.addConnection(lampNC.id, 2, dc.id, 2, 'electrical');
      // NO (Port 3, Pin 14) ke lampNO
      window.addConnection(bChg.id, 3, lampNO.id, 1, 'electrical');
      window.addConnection(lampNO.id, 2, dc.id, 2, 'electrical');

      window.SimEngine.start();

      // State 0: Normal (COM tersambung ke NC -> lampNC hidup, lampNO mati)
      window.SimEngine.tick(0.05);
      const s0 = {
        lampNC: !!window.SimEngine.lampStates[lampNC.id],
        lampNO: !!window.SimEngine.lampStates[lampNO.id]
      };

      // State 1: Tekan bChg (COM pindah ke NO -> lampNC mati, lampNO hidup)
      window.SimEngine.pressButton(bChg.id);
      window.SimEngine.tick(0.05);
      const s1 = {
        lampNC: !!window.SimEngine.lampStates[lampNC.id],
        lampNO: !!window.SimEngine.lampStates[lampNO.id]
      };

      // State 2: Lepas bChg (COM kembali ke NC -> lampNC hidup, lampNO mati)
      window.SimEngine.releaseButton(bChg.id);
      window.SimEngine.tick(0.05);
      const s2 = {
        lampNC: !!window.SimEngine.lampStates[lampNC.id],
        lampNO: !!window.SimEngine.lampStates[lampNO.id]
      };

      window.SimEngine.stop();

      // Test Changeover Detent
      window.clearAllComponents(true);
      const dc2 = window.addComponent('dc-source', 100, 250);
      const bChgDet = window.addComponent('button-changeover-detent', 280, 200);
      const lNC2 = window.addComponent('indicator-lamp', 480, 140);
      const lNO2 = window.addComponent('indicator-lamp', 480, 260);

      window.addConnection(dc2.id, 1, bChgDet.id, 1, 'electrical');
      window.addConnection(bChgDet.id, 2, lNC2.id, 1, 'electrical');
      window.addConnection(lNC2.id, 2, dc2.id, 2, 'electrical');
      window.addConnection(bChgDet.id, 3, lNO2.id, 1, 'electrical');
      window.addConnection(lNO2.id, 2, dc2.id, 2, 'electrical');

      window.SimEngine.start();
      window.SimEngine.tick(0.05);
      const d0 = { lampNC: !!window.SimEngine.lampStates[lNC2.id], lampNO: !!window.SimEngine.lampStates[lNO2.id] };

      // Klik 1x detent changeover -> tetap di NO
      window.SimEngine.pressButton(bChgDet.id);
      window.SimEngine.releaseButton(bChgDet.id);
      window.SimEngine.tick(0.05);
      const d1 = { lampNC: !!window.SimEngine.lampStates[lNC2.id], lampNO: !!window.SimEngine.lampStates[lNO2.id] };

      // Klik ke-2 detent changeover -> kembali ke NC
      window.SimEngine.pressButton(bChgDet.id);
      window.SimEngine.releaseButton(bChgDet.id);
      window.SimEngine.tick(0.05);
      const d2 = { lampNC: !!window.SimEngine.lampStates[lNC2.id], lampNO: !!window.SimEngine.lampStates[lNO2.id] };

      window.SimEngine.stop();

      return { s0, s1, s2, d0, d1, d2 };
    });

    console.log('Changeover simulation result:', changeoverResult);
    const pass = changeoverResult.s0.lampNC && !changeoverResult.s0.lampNO &&
                 !changeoverResult.s1.lampNC && changeoverResult.s1.lampNO &&
                 changeoverResult.s2.lampNC && !changeoverResult.s2.lampNO &&
                 changeoverResult.d0.lampNC && !changeoverResult.d0.lampNO &&
                 !changeoverResult.d1.lampNC && changeoverResult.d1.lampNO &&
                 changeoverResult.d2.lampNC && !changeoverResult.d2.lampNO;

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc05_changeover_simulation.png') });

    results.push({
      scenario: '5. Changeover Simulation (Normal COM->NC, Pressed COM->NO, Detent toggle)',
      pass,
      details: changeoverResult
    });
  } catch (err) {
    console.error('Scenario 5 Failed:', err);
    results.push({ scenario: '5. Changeover Simulation', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 6: Save & Load Persistence
  // =========================================================================
  try {
    console.log('--- Running Scenario 6: Save & Load Persistence ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const saveLoadResult = await page.evaluate(() => {
      window.clearAllComponents(true);
      window.addComponent('button-no', 100, 100, { label: 'PB1' });
      window.addComponent('button-no-detent', 250, 100, { label: 'SW1' });
      window.addComponent('button-changeover', 400, 100, { label: 'CO1' });

      window.saveProject();
      window.clearAllComponents(true);
      const cleared = window.workspaceComponents.length;

      window.loadProject();
      const loaded = window.workspaceComponents.map(c => ({
        defId: c.defId,
        label: c.label,
        portsCount: c.ports.length
      }));

      const hasPB1 = loaded.some(c => c.defId === 'button-no' && c.label === 'PB1');
      const hasSW1 = loaded.some(c => c.defId === 'button-no-detent' && c.label === 'SW1');
      const hasCO1 = loaded.some(c => c.defId === 'button-changeover' && c.label === 'CO1');

      return { cleared, loaded, pass: cleared === 0 && hasPB1 && hasSW1 && hasCO1 };
    });

    console.log('Save & Load result:', saveLoadResult);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc06_save_load_persistence.png') });

    results.push({
      scenario: '6. Save & Load Circuit Persistence for New Buttons',
      pass: saveLoadResult.pass,
      details: saveLoadResult
    });
  } catch (err) {
    console.error('Scenario 6 Failed:', err);
    results.push({ scenario: '6. Save & Load Persistence', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 7: Preset Materi 1, 2, 3 Compatibility
  // =========================================================================
  try {
    console.log('--- Running Scenario 7: Presets 1-3 Compatibility Check ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
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

      // 3. Electropneumatic (Menggunakan button-no S1)
      window.loadPresetCircuit('electropneumatic');
      const elComps = window.workspaceComponents.length;
      const elValid = window.runDiagnostics().valid;

      // Uji tombol S1 di preset electropneumatic
      const s1 = window.workspaceComponents.find(c => c.label.includes('S1'));
      window.SimEngine.start();
      window.SimEngine.tick(0.05);
      const solIdle = window.SimEngine.solenoidStates['Y1'];

      window.SimEngine.pressButton(s1.id);
      window.SimEngine.tick(0.05);
      const solPressed = window.SimEngine.solenoidStates['Y1'];

      window.SimEngine.releaseButton(s1.id);
      window.SimEngine.tick(0.05);
      const solReleased = window.SimEngine.solenoidStates['Y1'];
      window.SimEngine.stop();

      return {
        dComps, dValid,
        indComps, indValid,
        elComps, elValid,
        solIdle, solPressed, solReleased,
        pass: dValid && indValid && elValid && !solIdle && solPressed && !solReleased
      };
    });

    console.log('Presets result:', presetsResult);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc07_presets_compatibility.png') });

    results.push({
      scenario: '7. Presets 1-3 Compatibility & Button S1 Electropneumatic Actuation',
      pass: presetsResult.pass,
      details: presetsResult
    });
  } catch (err) {
    console.error('Scenario 7 Failed:', err);
    results.push({ scenario: '7. Presets Compatibility', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 8: Cross-Platform Viewports & index_single.html
  // =========================================================================
  try {
    console.log('--- Running Scenario 8: Cross-Platform & Single HTML Check ---');

    // 8A: index_single.html Desktop 1366x768
    const { page: pSingle } = await initBrowser({ width: 1366, height: 768 });
    await pSingle.goto(SINGLE_HTML_FILE, { waitUntil: 'load' });
    await pSingle.waitForTimeout(500);

    const singleResult = await pSingle.evaluate(() => {
      window.clearAllComponents(true);
      window.addComponent('button-no', 150, 150);
      window.addComponent('button-changeover-detent', 320, 150);
      return {
        hasComps: window.workspaceComponents.length === 2,
        diag: window.runDiagnostics()
      };
    });
    await pSingle.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc08_single_html_1366.png') });

    // 8B: Desktop 1280x600
    const { page: p1280 } = await initBrowser({ width: 1280, height: 600 });
    await p1280.goto(HTML_FILE, { waitUntil: 'load' });
    await p1280.waitForTimeout(400);
    await p1280.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc08_desktop_1280.png') });

    // 8C: Mobile 390x844 (Touch & Mobile)
    const { page: pMobile } = await initBrowser({ width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await pMobile.goto(HTML_FILE, { waitUntil: 'load' });
    await pMobile.waitForTimeout(400);
    await pMobile.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc08_mobile_390.png') });

    // 8D: Tablet 768x1024
    const { page: pTablet } = await initBrowser({ width: 768, height: 1024 });
    await pTablet.goto(HTML_FILE, { waitUntil: 'load' });
    await pTablet.waitForTimeout(400);
    await pTablet.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc08_tablet_768.png') });

    const pass = singleResult.hasComps && pageErrors.length === 0;

    results.push({
      scenario: '8. Standalone index_single.html & Responsive Viewports (1366, 1280, 768, 390)',
      pass,
      details: { singleResult, pageErrorsCount: pageErrors.length }
    });
  } catch (err) {
    console.error('Scenario 8 Failed:', err);
    results.push({ scenario: '8. Cross-Platform & Single HTML', pass: false, error: err.message });
  }

  if (browser) await browser.close();

  console.log('\n========================================');
  console.log('       PUSHBUTTON TEST SUITE SUMMARY    ');
  console.log('========================================');
  let allPassed = true;
  results.forEach((r, idx) => {
    const status = r.pass ? 'PASS' : 'FAIL';
    console.log(`[${status}] Scenario ${idx + 1}: ${r.scenario}`);
    if (!r.pass) allPassed = false;
  });
  console.log('========================================');
  console.log(`Overall Status: ${allPassed ? 'ALL PASSED (8/8)' : 'SOME FAILED'}`);
  console.log(`Total Page Errors: ${pageErrors.length}`);
  console.log('========================================\n');

  fs.writeFileSync(
    path.join(__dirname, 'test_pushbuttons_results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), allPassed, pageErrors, results }, null, 2)
  );
}

runTests().catch(e => {
  console.error('Fatal Test Suite Error:', e);
  process.exit(1);
});
