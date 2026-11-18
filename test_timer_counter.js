const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HTML_FILE = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const SINGLE_HTML_FILE = 'file:///' + path.resolve(__dirname, 'index_single.html').replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots_timer_counter');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

let browser = null;
let pageErrors = [];

async function initBrowser(viewport = { width: 1366, height: 768 }) {
  if (browser) await browser.close();
  pageErrors = [];
  browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true
  });
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  page.on('pageerror', err => {
    console.error('Browser PageError:', err.message);
    pageErrors.push(err.message);
  });
  return { context, page };
}

async function runTests() {
  console.log('=== STARTING TEST SUITE FOR TIMER & COUNTER & SYMBOLS ===\n');
  const results = [];

  // =========================================================================
  // SCENARIO 1: Relay & Solenoid Coil Symbols (Festo FluidSIM Standard)
  // =========================================================================
  try {
    console.log('--- Running Scenario 1: Relay & Solenoid Symbols Check ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const symCheck = await page.evaluate(() => {
      window.clearAllComponents(true);
      const r = window.addComponent('relay', 200, 200);
      const s = window.addComponent('solenoid-coil', 350, 200);

      const rElem = document.getElementById(`comp-${r.id}`);
      const sElem = document.getElementById(`comp-${s.id}`);

      // Relay checks
      const rBox = rElem.querySelector('rect[width="24"][height="32"]');
      const rDiagonals = rElem.querySelectorAll('line[stroke-width="1.5"]');
      const rLines = Array.from(rElem.querySelectorAll('line')).map(l => ({
        x1: l.getAttribute('x1'), y1: l.getAttribute('y1'),
        x2: l.getAttribute('x2'), y2: l.getAttribute('y2')
      }));
      const rPorts = Array.from(rElem.querySelectorAll('.component-port')).map(p => ({
        id: p.id,
        r: p.getAttribute('r'),
        fill: window.getComputedStyle(p).fill,
        stroke: window.getComputedStyle(p).stroke
      }));
      const rTexts = Array.from(rElem.querySelectorAll('text')).map(t => t.textContent.trim());

      // Solenoid checks
      const sBox = sElem.querySelector('rect[width="24"][height="32"]');
      const sLines = Array.from(sElem.querySelectorAll('line')).map(l => ({
        x1: l.getAttribute('x1'), y1: l.getAttribute('y1'),
        x2: l.getAttribute('x2'), y2: l.getAttribute('y2'),
        dash: l.getAttribute('stroke-dasharray')
      }));
      const sPolygons = Array.from(sElem.querySelectorAll('polygon')).map(p => p.getAttribute('points'));
      const sPorts = Array.from(sElem.querySelectorAll('.component-port')).map(p => ({
        id: p.id,
        r: p.getAttribute('r'),
        fill: window.getComputedStyle(p).fill,
        stroke: window.getComputedStyle(p).stroke
      }));
      const sTexts = Array.from(sElem.querySelectorAll('text')).map(t => t.textContent.trim());

      return {
        rBoxFill: rBox ? rBox.getAttribute('fill') : null,
        rBoxStroke: rBox ? rBox.getAttribute('stroke') : null,
        rLinesCount: rLines.length,
        rLines,
        rPorts,
        rTexts,
        sBoxFill: sBox ? sBox.getAttribute('fill') : null,
        sLines,
        sPolygons,
        sPorts,
        sTexts
      };
    });

    // Validasi Relay
    console.log('Relay Box Fill:', symCheck.rBoxFill, 'Stroke:', symCheck.rBoxStroke);
    console.log('Relay Ports:', JSON.stringify(symCheck.rPorts));
    console.log('Relay Texts:', symCheck.rTexts);
    console.log('Solenoid Polygons:', symCheck.sPolygons);

    const rPass = symCheck.rBoxFill === '#ffffff' &&
                  symCheck.rTexts.includes('A1') &&
                  symCheck.rTexts.includes('A2') &&
                  symCheck.rPorts.length === 2 &&
                  symCheck.rPorts[0].r === '3.5';

    const sPass = symCheck.sBoxFill === '#ffffff' &&
                  symCheck.sPolygons.length === 2 &&
                  symCheck.sTexts.includes('A1') &&
                  symCheck.sTexts.includes('A2') &&
                  symCheck.sLines.some(l => l.dash === '2.5,2') &&
                  symCheck.sLines.some(l => l.x1 === '-12' && l.y1 === '16' && l.x2 === '12' && l.y2 === '-16');

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc01_relay_solenoid_symbols.png') });

    results.push({
      scenario: '1. Relay & Solenoid Coil Symbols (FluidSIM)',
      pass: rPass && sPass,
      details: { rPass, sPass, symCheck }
    });
  } catch (err) {
    console.error('Scenario 1 Failed:', err);
    results.push({ scenario: '1. Relay & Solenoid Coil Symbols', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 2: Library Electrical Components (Timer On, Off, Counter)
  // =========================================================================
  try {
    console.log('--- Running Scenario 2: Library Electrical Components ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    // Buka filter Elektrikal
    await page.click('button[data-category="electrical"]');
    await page.waitForTimeout(300);

    const libCheck = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.library-component-item')).map(item => ({
        id: item.getAttribute('data-def-id'),
        title: item.querySelector('.library-item-name') ? item.querySelector('.library-item-name').textContent : '',
        desc: item.querySelector('.library-item-desc') ? item.querySelector('.library-item-desc').textContent : ''
      }));

      const hasOnDelay = items.some(i => i.id === 'timer-on-delay');
      const hasOffDelay = items.some(i => i.id === 'timer-off-delay');
      const hasCounter = items.some(i => i.id === 'counter');

      // Click to add
      const onBtn = document.querySelector('.library-component-item[data-def-id="timer-on-delay"]');
      const offBtn = document.querySelector('.library-component-item[data-def-id="timer-off-delay"]');
      const cntBtn = document.querySelector('.library-component-item[data-def-id="counter"]');
      if (onBtn) onBtn.click();
      if (offBtn) offBtn.click();
      if (cntBtn) cntBtn.click();

      const comps = window.workspaceComponents.map(c => ({ id: c.id, defId: c.defId, label: c.label }));

      return { items, hasOnDelay, hasOffDelay, hasCounter, comps };
    });

    console.log('Library Check:', libCheck.hasOnDelay, libCheck.hasOffDelay, libCheck.hasCounter);
    console.log('Comps added:', libCheck.comps);

    const pass = libCheck.hasOnDelay && libCheck.hasOffDelay && libCheck.hasCounter && libCheck.comps.length >= 3;
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc02_library_electrical_components.png') });

    results.push({
      scenario: '2. Library Electrical Components',
      pass,
      details: libCheck
    });
  } catch (err) {
    console.error('Scenario 2 Failed:', err);
    results.push({ scenario: '2. Library Electrical Components', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 3, 4, 5: Symbols of Timer On-Delay, Timer Off-Delay, and Counter
  // =========================================================================
  try {
    console.log('--- Running Scenarios 3, 4, 5: Timer & Counter Symbols ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const symbolDetails = await page.evaluate(() => {
      window.clearAllComponents(true);
      const ton = window.addComponent('timer-on-delay', 200, 200);
      const toff = window.addComponent('timer-off-delay', 350, 200);
      const cnt = window.addComponent('counter', 500, 200);

      const tonElem = document.getElementById(`comp-${ton.id}`);
      const toffElem = document.getElementById(`comp-${toff.id}`);
      const cntElem = document.getElementById(`comp-${cnt.id}`);

      // Timer On checks: cross X lines (-16,-16 to -4,16 & -16,16 to -4,-16), divider x=-4, time text
      const tonDivider = tonElem.querySelector('line[x1="-4"][x2="-4"]');
      const tonX1 = tonElem.querySelector('line[x1="-16"][y1="-16"][x2="-4"][y2="16"]');
      const tonX2 = tonElem.querySelector('line[x1="-16"][y1="16"][x2="-4"][y2="-16"]');
      const tonText = Array.from(tonElem.querySelectorAll('text')).map(t => t.textContent.trim());
      const tonPorts = Array.from(tonElem.querySelectorAll('.component-port')).map(p => ({
        id: p.id, r: p.getAttribute('r')
      }));

      // Timer Off checks: black filled rect on left
      const toffBlackRect = toffElem.querySelector('rect[x="-16"][width="12"][fill="#1e293b"]');
      const toffText = Array.from(toffElem.querySelectorAll('text')).map(t => t.textContent.trim());
      const toffPorts = Array.from(toffElem.querySelectorAll('.component-port')).map(p => ({
        id: p.id, r: p.getAttribute('r')
      }));

      // Counter checks: mechanism circle at (-12, 5, r=5.5), count text "0/5", 4 stubs, 4 ports
      const cntCircle = cntElem.querySelector('circle[cx="-12"][cy="5"][r="5.5"]');
      const cntText = Array.from(cntElem.querySelectorAll('text')).map(t => t.textContent.trim());
      const cntPorts = Array.from(cntElem.querySelectorAll('.component-port')).map(p => ({
        id: p.id, r: p.getAttribute('r')
      }));

      return {
        tonPass: !!(tonDivider && tonX1 && tonX2 && tonText.includes('5s') && tonPorts.length === 2),
        toffPass: !!(toffBlackRect && toffText.includes('5s') && toffPorts.length === 2),
        cntPass: !!(cntCircle && cntText.includes('0/5') && cntPorts.length === 4),
        tonText,
        toffText,
        cntText,
        cntPortsCount: cntPorts.length
      };
    });

    console.log('Symbol Details:', symbolDetails);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc03_timer_on_delay_symbol.png') });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc04_timer_off_delay_symbol.png') });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc05_counter_symbol.png') });

    results.push({
      scenario: '3. Timer On-Delay Symbol (X on left, 5s on right, A1/A2 stubs)',
      pass: symbolDetails.tonPass,
      details: symbolDetails.tonText
    });
    results.push({
      scenario: '4. Timer Off-Delay Symbol (Black rect on left, 5s on right, A1/A2 stubs)',
      pass: symbolDetails.toffPass,
      details: symbolDetails.toffText
    });
    results.push({
      scenario: '5. Relay Counter Symbol (Mechanism circle, 0/5 count, 4 ports A1/A2/R1/R2)',
      pass: symbolDetails.cntPass,
      details: { cntText: symbolDetails.cntText, ports: symbolDetails.cntPortsCount }
    });
  } catch (err) {
    console.error('Scenario 3,4,5 Failed:', err);
    results.push({ scenario: '3,4,5 Symbols', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 6: Simulation Logic - Timer On-Delay
  // =========================================================================
  try {
    console.log('--- Running Scenario 6: SimEngine Timer On-Delay Logic ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const onDelaySimResult = await page.evaluate(async () => {
      window.clearAllComponents(true);

      // Buat DC Source (+24V port 1, 0V port 2)
      const dc = window.addComponent('dc-source', 100, 200);
      // Buat Push Button NO (Port 1 left, Port 2 right)
      const btn = window.addComponent('button-no', 250, 200);
      // Buat Timer On Delay (timeSec: 0.4s = 400ms, tag 'K2', Port 1 A1, Port 2 A2)
      const ton = window.addComponent('timer-on-delay', 400, 200, { timeSec: 0.4, relayRef: 'K2', label: 'K2' });
      // Buat Relay Contact NO (relayRef: 'K2', Port 1 left, Port 2 right)
      const cont = window.addComponent('relay-contact-no', 550, 200, { relayRef: 'K2' });
      // Buat Indicator Lamp (Port 1 left, Port 2 right)
      const lamp = window.addComponent('indicator-lamp', 700, 200);

      // Buat sambungan kabel:
      // Jalur 1: +24V -> btn(1), btn(2) -> ton(1:A1), ton(2:A2) -> 0V
      window.addConnection(dc.id, 1, btn.id, 1, 'electrical');
      window.addConnection(btn.id, 2, ton.id, 1, 'electrical');
      window.addConnection(ton.id, 2, dc.id, 2, 'electrical');

      // Jalur 2: +24V -> cont(1), cont(2) -> lamp(1), lamp(2) -> 0V
      window.addConnection(dc.id, 1, cont.id, 1, 'electrical');
      window.addConnection(cont.id, 2, lamp.id, 1, 'electrical');
      window.addConnection(lamp.id, 2, dc.id, 2, 'electrical');

      // Jalankan simulasi
      window.SimEngine.start();

      // Kondisi 0: Tombol belum ditekan
      window.SimEngine.tick(0.05);
      const state0 = {
        relayActive: !!window.SimEngine.relayStates['K2'],
        lampLit: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Kondisi 1: Tekan tombol, tunggu 100ms (< 400ms)
      window.SimEngine.buttonStates[btn.id] = { pressed: true, locked: false };
      window.SimEngine.tick(0.05);
      await new Promise(r => setTimeout(r, 100));
      window.SimEngine.tick(0.05);
      const state1 = {
        relayActive: !!window.SimEngine.relayStates['K2'],
        lampLit: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Kondisi 2: Tahan tombol hingga total 500ms (> 400ms timeout)
      await new Promise(r => setTimeout(r, 450));
      window.SimEngine.tick(0.05);
      const state2 = {
        relayActive: !!window.SimEngine.relayStates['K2'],
        lampLit: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Kondisi 3: Lepas tombol -> kontak harus langsung OFF seketika
      window.SimEngine.buttonStates[btn.id] = { pressed: false, locked: false };
      window.SimEngine.tick(0.05);
      const state3 = {
        relayActive: !!window.SimEngine.relayStates['K2'],
        lampLit: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Kondisi 4: Test pembatalan (tekan 150ms lalu lepas sebelum 400ms)
      window.SimEngine.buttonStates[btn.id] = { pressed: true, locked: false };
      window.SimEngine.tick(0.05);
      await new Promise(r => setTimeout(r, 150));
      window.SimEngine.tick(0.05);
      window.SimEngine.buttonStates[btn.id] = { pressed: false, locked: false };
      window.SimEngine.tick(0.05);
      await new Promise(r => setTimeout(r, 350));
      window.SimEngine.tick(0.05);
      const state4 = {
        relayActive: !!window.SimEngine.relayStates['K2'],
        lampLit: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      window.SimEngine.stop();

      return { state0, state1, state2, state3, state4 };
    });

    console.log('On-Delay Simulation States:', onDelaySimResult);

    const pass = !onDelaySimResult.state0.relayActive && !onDelaySimResult.state0.lampLit &&
                 !onDelaySimResult.state1.relayActive && !onDelaySimResult.state1.lampLit &&
                 onDelaySimResult.state2.relayActive && onDelaySimResult.state2.lampLit &&
                 !onDelaySimResult.state3.relayActive && !onDelaySimResult.state3.lampLit &&
                 !onDelaySimResult.state4.relayActive && !onDelaySimResult.state4.lampLit;

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc06_sim_timer_on_delay.png') });

    results.push({
      scenario: '6. SimEngine Timer On-Delay Logic (400ms delay, timeout activation, immediate cutoff, cancellation)',
      pass,
      details: onDelaySimResult
    });
  } catch (err) {
    console.error('Scenario 6 Failed:', err);
    results.push({ scenario: '6. SimEngine Timer On-Delay Logic', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 7: Simulation Logic - Timer Off-Delay
  // =========================================================================
  try {
    console.log('--- Running Scenario 7: SimEngine Timer Off-Delay Logic ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const offDelaySimResult = await page.evaluate(async () => {
      window.clearAllComponents(true);

      const dc = window.addComponent('dc-source', 100, 200);
      const btn = window.addComponent('button-no', 250, 200);
      const toff = window.addComponent('timer-off-delay', 400, 200, { timeSec: 0.4, relayRef: 'K3', label: 'K3' });
      const cont = window.addComponent('relay-contact-no', 550, 200, { relayRef: 'K3' });
      const lamp = window.addComponent('indicator-lamp', 700, 200);

      window.addConnection(dc.id, 1, btn.id, 1, 'electrical');
      window.addConnection(btn.id, 2, toff.id, 1, 'electrical');
      window.addConnection(toff.id, 2, dc.id, 2, 'electrical');

      window.addConnection(dc.id, 1, cont.id, 1, 'electrical');
      window.addConnection(cont.id, 2, lamp.id, 1, 'electrical');
      window.addConnection(lamp.id, 2, dc.id, 2, 'electrical');
      window.SimEngine.start();

      // Kondisi 0: Idle
      window.SimEngine.tick(0.05);
      const state0 = {
        relayActive: !!window.SimEngine.relayStates['K3'],
        lampLit: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Kondisi 1: Tekan tombol -> LANGSUNG AKTIF SEKETIKA!
      window.SimEngine.buttonStates[btn.id] = { pressed: true, locked: false };
      window.SimEngine.tick(0.05);
      const state1 = {
        relayActive: !!window.SimEngine.relayStates['K3'],
        lampLit: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Kondisi 2: Lepas tombol, tunggu 150ms (< 400ms off-delay) -> HARUS TETAP AKTIF!
      window.SimEngine.buttonStates[btn.id] = { pressed: false, locked: false };
      window.SimEngine.tick(0.05);
      await new Promise(r => setTimeout(r, 150));
      window.SimEngine.tick(0.05);
      const state2 = {
        relayActive: !!window.SimEngine.relayStates['K3'],
        lampLit: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Kondisi 3: Tunggu hingga total 500ms (> 400ms off-delay) -> SEKARANG MATI
      await new Promise(r => setTimeout(r, 350));
      window.SimEngine.tick(0.05);
      const state3 = {
        relayActive: !!window.SimEngine.relayStates['K3'],
        lampLit: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Kondisi 4: Re-trigger sebelum timeout
      window.SimEngine.buttonStates[btn.id] = { pressed: true, locked: false };
      window.SimEngine.tick(0.05);
      window.SimEngine.buttonStates[btn.id] = { pressed: false, locked: false };
      window.SimEngine.tick(0.05);
      await new Promise(r => setTimeout(r, 150)); // Di tengah delay
      window.SimEngine.buttonStates[btn.id] = { pressed: true, locked: false }; // Tekan lagi
      window.SimEngine.tick(0.05);
      const state4 = {
        relayActive: !!window.SimEngine.relayStates['K3'],
        lampLit: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      window.SimEngine.stop();

      return { state0, state1, state2, state3, state4 };
    });

    console.log('Off-Delay Simulation States:', offDelaySimResult);

    const pass = !offDelaySimResult.state0.relayActive &&
                 offDelaySimResult.state1.relayActive && offDelaySimResult.state1.lampLit &&
                 offDelaySimResult.state2.relayActive && offDelaySimResult.state2.lampLit &&
                 !offDelaySimResult.state3.relayActive && !offDelaySimResult.state3.lampLit &&
                 offDelaySimResult.state4.relayActive && offDelaySimResult.state4.lampLit;

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc07_sim_timer_off_delay.png') });

    results.push({
      scenario: '7. SimEngine Timer Off-Delay Logic (immediate on, sustained during 400ms off-delay, turnoff on timeout, re-trigger cancel)',
      pass,
      details: offDelaySimResult
    });
  } catch (err) {
    console.error('Scenario 7 Failed:', err);
    results.push({ scenario: '7. SimEngine Timer Off-Delay Logic', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 8: Simulation Logic - Relay Counter
  // =========================================================================
  try {
    console.log('--- Running Scenario 8: SimEngine Relay Counter Logic ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const counterSimResult = await page.evaluate(async () => {
      window.clearAllComponents(true);

      const dc = window.addComponent('dc-source', 100, 200);
      const btnCount = window.addComponent('button-no', 250, 150, { label: 'S1' });
      const btnReset = window.addComponent('button-no', 250, 300, { label: 'S2' });
      const cnt = window.addComponent('counter', 420, 220, { presetCount: 3, relayRef: 'K4', label: 'K4' });
      const cont = window.addComponent('relay-contact-no', 600, 200, { relayRef: 'K4' });
      const lamp = window.addComponent('indicator-lamp', 750, 200);

      // Jalur Count: +24V -> btnCount -> cnt(1:A1), cnt(2:A2) -> 0V
      window.addConnection(dc.id, 1, btnCount.id, 1, 'electrical');
      window.addConnection(btnCount.id, 2, cnt.id, 1, 'electrical');
      window.addConnection(cnt.id, 2, dc.id, 2, 'electrical');

      // Jalur Reset: +24V -> btnReset -> cnt(3:R1), cnt(4:R2) -> 0V
      window.addConnection(dc.id, 1, btnReset.id, 1, 'electrical');
      window.addConnection(btnReset.id, 2, cnt.id, 3, 'electrical');
      window.addConnection(cnt.id, 4, dc.id, 2, 'electrical');

      // Jalur Beban: +24V -> cont(1), cont(2) -> lamp(1), lamp(2) -> 0V
      window.addConnection(dc.id, 1, cont.id, 1, 'electrical');
      window.addConnection(cont.id, 2, lamp.id, 1, 'electrical');
      window.addConnection(lamp.id, 2, dc.id, 2, 'electrical');
      window.SimEngine.start();

      function pulseButton(buttonId) {
        window.SimEngine.buttonStates[buttonId] = { pressed: true, locked: false };
        window.SimEngine.tick(0.03);
        window.SimEngine.buttonStates[buttonId] = { pressed: false, locked: false };
        window.SimEngine.tick(0.03);
      }

      // Initial state: 0/3
      window.SimEngine.tick(0.03);
      const st0 = {
        count: window.SimEngine.counterStates[cnt.id] ? window.SimEngine.counterStates[cnt.id].count : 0,
        relay: !!window.SimEngine.relayStates['K4'],
        lamp: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Pulsa 1
      pulseButton(btnCount.id);
      const st1 = {
        count: window.SimEngine.counterStates[cnt.id].count,
        relay: !!window.SimEngine.relayStates['K4'],
        lamp: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Pulsa 2
      pulseButton(btnCount.id);
      const st2 = {
        count: window.SimEngine.counterStates[cnt.id].count,
        relay: !!window.SimEngine.relayStates['K4'],
        lamp: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Pulsa 3 (mencapai preset 3) -> RELAY & LAMPU HARUS AKTIF!
      pulseButton(btnCount.id);
      const st3 = {
        count: window.SimEngine.counterStates[cnt.id].count,
        relay: !!window.SimEngine.relayStates['K4'],
        lamp: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      // Tekan tombol Reset -> count = 0, relay = false, lamp = false!
      pulseButton(btnReset.id);
      const stReset = {
        count: window.SimEngine.counterStates[cnt.id].count,
        relay: !!window.SimEngine.relayStates['K4'],
        lamp: !!(window.SimEngine.lampStates && window.SimEngine.lampStates[lamp.id])
      };

      window.SimEngine.stop();

      return { st0, st1, st2, st3, stReset };
    });

    console.log('Counter Simulation States:', counterSimResult);

    const pass = counterSimResult.st0.count === 0 && !counterSimResult.st0.relay &&
                 counterSimResult.st1.count === 1 && !counterSimResult.st1.relay &&
                 counterSimResult.st2.count === 2 && !counterSimResult.st2.relay &&
                 counterSimResult.st3.count === 3 && counterSimResult.st3.relay && counterSimResult.st3.lamp &&
                 counterSimResult.stReset.count === 0 && !counterSimResult.stReset.relay && !counterSimResult.stReset.lamp;

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc08_sim_counter.png') });

    results.push({
      scenario: '8. SimEngine Relay Counter Logic (rising edge counting 1->2->3, trip at preset, contact closure, reset back to 0)',
      pass,
      details: counterSimResult
    });
  } catch (err) {
    console.error('Scenario 8 Failed:', err);
    results.push({ scenario: '8. SimEngine Relay Counter Logic', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 9: Property Panel, Range Validation (0.1-999 / 1-999), Save & Load
  // =========================================================================
  try {
    console.log('--- Running Scenario 9: Property Panel & Save/Load ---');
    const { page } = await initBrowser();
    await page.goto(HTML_FILE, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const propResult = await page.evaluate(async () => {
      window.clearAllComponents(true);
      const t1 = window.addComponent('timer-on-delay', 200, 200);
      const c1 = window.addComponent('counter', 400, 200);

      // 1. Test Timer Property Panel Valid Input
      window.selectComponent(t1.id);
      const timeSecInput = document.getElementById('prop-time-sec');
      const timerTagInput = document.getElementById('prop-timer-tag');
      const timerForm = document.getElementById('property-form');

      let timerInputsExist = !!(timeSecInput && timerTagInput);

      timeSecInput.value = '3.5';
      timerTagInput.value = 'KT1';
      timerForm.dispatchEvent(new Event('submit'));

      const t1Updated = window.getComponentById(t1.id);
      const timerValidPass = t1Updated.properties.timeSec === 3.5 && t1Updated.properties.relayRef === 'KT1';

      // 2. Test Timer Property Invalid Input (e.g. 0.01 or 1200) -> Must restore
      timeSecInput.value = '1500';
      timerForm.dispatchEvent(new Event('submit'));
      const timerInvalidPass = t1Updated.properties.timeSec === 3.5 && timeSecInput.value === '3.5';

      // 3. Test Counter Property Panel Valid Input
      window.selectComponent(c1.id);
      const presetInput = document.getElementById('prop-preset-count');
      const counterTagInput = document.getElementById('prop-counter-tag');
      const counterForm = document.getElementById('property-form');

      let counterInputsExist = !!(presetInput && counterTagInput);

      presetInput.value = '8';
      counterTagInput.value = 'KC1';
      counterForm.dispatchEvent(new Event('submit'));

      const c1Updated = window.getComponentById(c1.id);
      const counterValidPass = c1Updated.properties.presetCount === 8 && c1Updated.properties.relayRef === 'KC1';

      // 4. Test Counter Invalid Input (e.g. 0 or -5) -> Must restore
      presetInput.value = '-5';
      counterForm.dispatchEvent(new Event('submit'));
      const counterInvalidPass = c1Updated.properties.presetCount === 8 && presetInput.value === '8';

      // 5. Test Save & Load Project
      window.saveProject();
      window.clearAllComponents(true);
      const clearedCount = window.workspaceComponents.length;
      window.loadProject();
      const loadedComps = window.workspaceComponents.map(c => ({
        defId: c.defId,
        label: c.label,
        properties: c.properties
      }));

      const loadedTimer = loadedComps.find(c => c.defId === 'timer-on-delay');
      const loadedCounter = loadedComps.find(c => c.defId === 'counter');

      const saveLoadPass = loadedTimer && loadedTimer.properties.timeSec === 3.5 &&
                           loadedCounter && loadedCounter.properties.presetCount === 8;

      return {
        timerInputsExist,
        timerValidPass,
        timerInvalidPass,
        counterInputsExist,
        counterValidPass,
        counterInvalidPass,
        clearedCount,
        saveLoadPass,
        loadedTimer,
        loadedCounter
      };
    });

    console.log('Property Panel & Save/Load Result:', propResult);

    const pass = propResult.timerInputsExist && propResult.timerValidPass && propResult.timerInvalidPass &&
                 propResult.counterInputsExist && propResult.counterValidPass && propResult.counterInvalidPass &&
                 propResult.saveLoadPass;

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc09_property_panel_validation.png') });

    results.push({
      scenario: '9. Property Panel, Validation (0.1-999 / 1-999) & Save/Load Persistence',
      pass,
      details: propResult
    });
  } catch (err) {
    console.error('Scenario 9 Failed:', err);
    results.push({ scenario: '9. Property Panel, Validation & Save/Load', pass: false, error: err.message });
  }

  // =========================================================================
  // SCENARIO 10: Standalone Single HTML, Presets & Cross-Platform Responsive
  // =========================================================================
  try {
    console.log('--- Running Scenario 10: Standalone HTML, Presets & Responsive ---');

    // 10A: Test on index_single.html
    const { page: singlePage } = await initBrowser({ width: 1366, height: 768 });
    await singlePage.goto(SINGLE_HTML_FILE, { waitUntil: 'load' });
    await singlePage.waitForTimeout(500);

    const singleResult = await singlePage.evaluate(() => {
      // Test Presets
      window.loadPresetCircuit(1);
      const p1Comps = window.workspaceComponents.length;
      const p1Valid = window.runDiagnostics().valid;

      window.loadPresetCircuit(2);
      const p2Comps = window.workspaceComponents.length;
      const p2Valid = window.runDiagnostics().valid;

      window.loadPresetCircuit(3);
      const p3Comps = window.workspaceComponents.length;
      const p3Valid = window.runDiagnostics().valid;

      // Add timer and counter to single html
      const t = window.addComponent('timer-on-delay', 200, 200);
      const c = window.addComponent('counter', 400, 200);

      return {
        p1Comps, p1Valid,
        p2Comps, p2Valid,
        p3Comps, p3Valid,
        hasTimer: !!document.getElementById(`comp-${t.id}`),
        hasCounter: !!document.getElementById(`comp-${c.id}`)
      };
    });

    console.log('Single HTML Presets & Components:', singleResult);
    await singlePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc10_single_html.png') });

    // 10B: Desktop 1280x600 Viewport
    const { page: d1280Page } = await initBrowser({ width: 1280, height: 600 });
    await d1280Page.goto(HTML_FILE, { waitUntil: 'load' });
    await d1280Page.evaluate(() => {
      window.addComponent('relay', 150, 150);
      window.addComponent('solenoid-coil', 280, 150);
      window.addComponent('timer-on-delay', 420, 150);
      window.addComponent('timer-off-delay', 560, 150);
      window.addComponent('counter', 720, 150);
    });
    await d1280Page.waitForTimeout(300);
    await d1280Page.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc10_desktop_1280.png') });

    // 10C: Mobile 390x844 Viewport
    const { page: mPage } = await initBrowser({ width: 390, height: 844 });
    await mPage.goto(HTML_FILE, { waitUntil: 'load' });
    await mPage.evaluate(() => {
      window.addComponent('timer-on-delay', 120, 150);
      window.addComponent('counter', 240, 150);
    });
    await mPage.waitForTimeout(300);
    await mPage.screenshot({ path: path.join(SCREENSHOT_DIR, 'sc10_mobile_390.png') });

    const pass = singleResult.p1Valid && singleResult.p2Valid && singleResult.p3Valid &&
                 singleResult.hasTimer && singleResult.hasCounter && pageErrors.length === 0;

    results.push({
      scenario: '10. Standalone index_single.html, Presets 1-3 & Responsive (1366, 1280, 390)',
      pass,
      details: { singleResult, pageErrorsCount: pageErrors.length }
    });
  } catch (err) {
    console.error('Scenario 10 Failed:', err);
    results.push({ scenario: '10. Standalone HTML & Responsive', pass: false, error: err.message });
  }

  if (browser) await browser.close();

  // Print Summary
  console.log('\n========================================');
  console.log('           TEST SUITE SUMMARY           ');
  console.log('========================================');
  let allPassed = true;
  results.forEach((r, idx) => {
    const status = r.pass ? 'PASS' : 'FAIL';
    console.log(`[${status}] Scenario ${idx + 1}: ${r.scenario}`);
    if (!r.pass) allPassed = false;
  });
  console.log('========================================');
  console.log(`Overall Status: ${allPassed ? 'ALL PASSED (10/10)' : 'SOME FAILED'}`);
  console.log(`Page Errors: ${pageErrors.length}`);
  console.log('========================================\n');

  fs.writeFileSync(
    path.join(__dirname, 'test_results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), allPassed, pageErrors, results }, null, 2)
  );
}

runTests().catch(e => {
  console.error('Fatal Test Suite Error:', e);
  process.exit(1);
});
