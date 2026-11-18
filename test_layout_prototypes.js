const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HTML_FILE = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots_presets_revised');

async function testLayoutPrototypes() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(HTML_FILE, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  // Suntikkan prototype fungsi router dan preset baru langsung ke page runtime
  const testResults = await page.evaluate(async () => {
    // 1. Prototype Smart Orthogonal Router
    function smartCalculateOrthogonalPath(start, end) {
      if (!start || !end) return [];
      const stub = 18;
      const sX = start.x, sY = start.y;
      const eX = end.x, eY = end.y;

      let sStubX = sX, sStubY = sY;
      if (start.side === 'top') sStubY = sY - stub;
      else if (start.side === 'bottom') sStubY = sY + stub;
      else if (start.side === 'left') sStubX = sX - stub;
      else if (start.side === 'right') sStubX = sX + stub;

      let eStubX = eX, eStubY = eY;
      if (end.side === 'top') eStubY = eY - stub;
      else if (end.side === 'bottom') eStubY = eY + stub;
      else if (end.side === 'left') eStubX = eX - stub;
      else if (end.side === 'right') eStubX = eX + stub;

      const points = [{ x: sX, y: sY }];
      if (start.side) points.push({ x: sStubX, y: sStubY });

      const sVert = start.side === 'top' || start.side === 'bottom';
      const eVert = end.side === 'top' || end.side === 'bottom';

      if (start.side && end.side) {
        if (sVert && eVert) {
          if (start.side === end.side) {
            // Same direction (e.g. both top or both bottom)
            const bendY = start.side === 'top' ? Math.min(sStubY, eStubY) - 12 : Math.max(sStubY, eStubY) + 12;
            points.push({ x: sStubX, y: bendY });
            points.push({ x: eStubX, y: bendY });
          } else {
            // Opposite directions (one top, one bottom)
            const isProperGap = (start.side === 'top' && sStubY > eStubY) || (start.side === 'bottom' && sStubY < eStubY);
            if (isProperGap) {
              const midY = (sStubY + eStubY) / 2;
              points.push({ x: sStubX, y: midY });
              points.push({ x: eStubX, y: midY });
            } else {
              // Stub overlap: route around via middle X column
              const midX = (sStubX + eStubX) / 2;
              points.push({ x: midX, y: sStubY });
              points.push({ x: midX, y: eStubY });
            }
          }
        } else if (!sVert && !eVert) {
          if (start.side === end.side) {
            const bendX = start.side === 'left' ? Math.min(sStubX, eStubX) - 12 : Math.max(sStubX, eStubX) + 12;
            points.push({ x: bendX, y: sStubY });
            points.push({ x: bendX, y: eStubY });
          } else {
            const isProperGap = (start.side === 'right' && sStubX < eStubX) || (start.side === 'left' && sStubX > eStubX);
            if (isProperGap) {
              const midX = (sStubX + eStubX) / 2;
              points.push({ x: midX, y: sStubY });
              points.push({ x: midX, y: eStubY });
            } else {
              const midY = (sStubY + eStubY) / 2;
              points.push({ x: sStubX, y: midY });
              points.push({ x: eStubX, y: midY });
            }
          }
        } else {
          // One vertical, one horizontal
          if (sVert) {
            points.push({ x: sStubX, y: eStubY });
          } else {
            // start is horizontal, end is vertical
            // Check if sStubY is approaching end from the wrong side of the stub
            const enteringWrongSide = (end.side === 'top' && sStubY > eStubY) || (end.side === 'bottom' && sStubY < eStubY);
            if (enteringWrongSide) {
              const midX = (sStubX + eStubX) / 2;
              points.push({ x: midX, y: sStubY });
              points.push({ x: midX, y: eStubY });
            } else {
              points.push({ x: eStubX, y: sStubY });
            }
          }
        }
      } else {
        // Connection to junction (end has no side)
        if (start.side) {
          if (sVert) {
            points.push({ x: sStubX, y: eY });
          } else {
            points.push({ x: eX, y: sStubY });
          }
        } else if (end.side) {
          if (eVert) {
            points.push({ x: sX, y: eStubY });
          } else {
            points.push({ x: eStubX, y: sY });
          }
        } else {
          points.push({ x: (sX + eX) / 2, y: sY });
          points.push({ x: (sX + eX) / 2, y: eY });
        }
      }

      if (end.side) points.push({ x: eStubX, y: eStubY });
      points.push({ x: eX, y: eY });
      return points;
    }

    // Override router on page
    window.calculateOrthogonalPath = smartCalculateOrthogonalPath;

    // Redefine prototype Preset 1
    window.protoPreset1 = function() {
      window.clearAllComponents(true);
      const c1 = window.addComponent('compressor', 120, 360, { label: 'Kompresor' });
      const frl = window.addComponent('frl-unit', 240, 360, { label: 'FRL' });
      const v1 = window.addComponent('valve-3-2', 380, 360, {
        label: 'V1',
        actuationLeft: 'push-button',
        actuationRight: 'spring',
        normalPosition: 'closed'
      });
      const cyl = window.addComponent('cylinder-single', 380, 160, { label: 'A1' });

      window.addConnection(c1.id, 1, frl.id, 1, 'pneumatic');
      window.addConnection(frl.id, 2, v1.id, 1, 'pneumatic');
      window.addConnection(v1.id, 2, cyl.id, 1, 'pneumatic');
      // window.zoomToFit
      if (typeof window.zoomToFit === 'function') window.zoomToFit();
    };

    // Redefine prototype Preset 2
    window.protoPreset2 = function() {
      window.clearAllComponents(true);
      const c1 = window.addComponent('compressor', 120, 380, { label: 'Kompresor' });
      const frl = window.addComponent('frl-unit', 240, 380, { label: 'FRL' });
      const pb1 = window.addComponent('valve-3-2', 360, 380, {
        label: 'PB1',
        actuationLeft: 'push-button',
        actuationRight: 'spring',
        normalPosition: 'closed'
      });
      const mainValve = window.addComponent('valve-5-2-pilot', 540, 380, {
        label: 'V1 (5/2)',
        actuationLeft: 'pilot',
        actuationRight: 'spring',
        normalPosition: 'position-a'
      });
      const cyl = window.addComponent('cylinder-double', 540, 160, { label: 'A1' });

      // Tubing:
      window.addConnection(c1.id, 1, frl.id, 1, 'pneumatic');

      // FRL OUT ke Katup Utama 5/2 Port 1(P)
      const mainPneuConn = window.addConnection(frl.id, 2, mainValve.id, 1, 'pneumatic');

      // Percabangan pasokan ke PB1 Port 1(P)
      const branchJunc = window.addJunction(mainPneuConn.id, 300, 420, 'pneumatic');
      window.addBranchConnection(pb1.id, 1, branchJunc.id, 'pneumatic');

      // PB1 Port 2(A) ke Katup 5/2 Port 14 (Z)
      window.addConnection(pb1.id, 2, mainValve.id, 6, 'pneumatic');

      // Katup 5/2 Port 4(B) ke Silinder Port 1 (A, Maju)
      window.addConnection(mainValve.id, 4, cyl.id, 1, 'pneumatic');

      // Katup 5/2 Port 2(A) ke Silinder Port 2 (B, Mundur)
      window.addConnection(mainValve.id, 2, cyl.id, 2, 'pneumatic');

      if (typeof window.zoomToFit === 'function') window.zoomToFit();
    };

    // Redefine prototype Preset 3
    window.protoPreset3 = function() {
      window.clearAllComponents(true);
      // Bagian Pneumatik Daya (Atas)
      const c1 = window.addComponent('compressor', 120, 180, { label: 'Kompresor' });
      const frl = window.addComponent('frl-unit', 240, 180, { label: 'FRL' });
      const solValve = window.addComponent('valve-5-2-solenoid', 420, 180, {
        label: 'V1',
        actuationLeft: 'solenoid',
        actuationRight: 'spring',
        solenoidRef: 'Y1'
      });
      const cyl = window.addComponent('cylinder-double', 600, 180, { label: 'A1' });

      window.addConnection(c1.id, 1, frl.id, 1, 'pneumatic');
      window.addConnection(frl.id, 2, solValve.id, 1, 'pneumatic');
      window.addConnection(solValve.id, 4, cyl.id, 1, 'pneumatic'); // Maju
      window.addConnection(solValve.id, 2, cyl.id, 2, 'pneumatic'); // Mundur

      // Bagian Kelistrikan Kendali 24V DC (Bawah - Ladder Schematic)
      const dc = window.addComponent('dc-source', 120, 360, { label: '24V DC' });
      const s1 = window.addComponent('button-no', 250, 420, { label: 'S1 (Start)' });
      // Kontak Relai NO K1 paralel dengan S1 (diputar 90 derajat agar port 13 di top dan 14 di bottom)
      const k1Contact = window.addComponent('relay-contact-no', 340, 420, {
        label: 'K1-1',
        relayRef: 'K1',
        rotation: 90
      });

      const rly = window.addComponent('relay', 295, 520, { label: 'K1', relayId: 'K1', relayRef: 'K1' });
      const sol = window.addComponent('solenoid-coil', 440, 520, { label: 'Y1', solenoidRef: 'Y1' });
      const lamp = window.addComponent('indicator-lamp', 560, 520, { label: 'H1' });

      // Rel Daya +24V (atas):
      // Dari DC Source Port 1 (+24V) ke S1 Port 1 (pin 13)
      const pwrRail = window.addConnection(dc.id, 1, s1.id, 1, 'electrical');

      // Cabang +24V ke Kontak K1-1 Port 1 (pin 13)
      const juncPwr = window.addJunction(pwrRail.id, 200, 360, 'electrical');
      window.addBranchConnection(k1Contact.id, 1, juncPwr.id, 'electrical');

      // Jalur pengunci keluaran: S1 Port 2 (pin 14) ke Relai K1 Port 1 (A1)
      const latchLine = window.addConnection(s1.id, 2, rly.id, 1, 'electrical');

      // Cabang paralel dari Kontak K1-1 Port 2 (pin 14) ke latchLine
      const juncLatch = window.addJunction(latchLine.id, 295, 470, 'electrical');
      window.addBranchConnection(k1Contact.id, 2, juncLatch.id, 'electrical');

      // Cabang kontrol dari pengunci ke Kumparan Solenoid Y1 Port 1 (A1)
      window.addBranchConnection(sol.id, 1, juncLatch.id, 'electrical');

      // Cabang kontrol dari pengunci ke Lampu H1 Port 1 (X1)
      window.addBranchConnection(lamp.id, 1, juncLatch.id, 'electrical');

      // Rel Netral 0V (GND, bawah):
      // Dari Relai K1 Port 2 (A2) ke DC Source Port 2 (0V)
      const gndLine = window.addConnection(rly.id, 2, dc.id, 2, 'electrical');

      // Cabang netral dari Solenoid Y1 Port 2 (A2) ke gndLine
      const juncGnd1 = window.addJunction(gndLine.id, 440, 580, 'electrical');
      window.addBranchConnection(sol.id, 2, juncGnd1.id, 'electrical');

      // Cabang netral dari Lampu H1 Port 2 (X2) ke gndLine
      const juncGnd2 = window.addJunction(gndLine.id, 560, 580, 'electrical');
      window.addBranchConnection(lamp.id, 2, juncGnd2.id, 'electrical');

      if (typeof window.zoomToFit === 'function') window.zoomToFit();
      if (typeof window.updateNeutralWires === 'function') window.updateNeutralWires();
    };

    return { ready: true };
  });

  // Render & screenshot Proto Preset 1
  await page.evaluate(() => window.protoPreset1());
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'proto_preset1.png') });

  // Render & screenshot Proto Preset 2
  await page.evaluate(() => window.protoPreset2());
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'proto_preset2.png') });

  // Render & screenshot Proto Preset 3
  await page.evaluate(() => window.protoPreset3());
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'proto_preset3.png') });

  // Uji simulasi interaktif pada Proto Preset 3
  const simProto3 = await page.evaluate(async () => {
    window.protoPreset3();
    window.setMode('simulate');

    const s1Comp = window.workspaceComponents.find(c => c.label.includes('S1'));
    const k1Comp = window.workspaceComponents.find(c => c.label === 'K1');
    const y1Comp = window.workspaceComponents.find(c => c.label === 'Y1');
    const h1Comp = window.workspaceComponents.find(c => c.label.includes('H1'));
    const cylComp = window.workspaceComponents.find(c => c.label === 'A1');

    window.SimEngine.tick(0.05);
    const beforePress = {
      k1Energized: !!window.SimEngine.relayStates['K1'],
      y1Energized: !!window.SimEngine.solenoidStates['Y1'],
      h1Lit: !!window.SimEngine.lampStates[h1Comp.id],
      cylPos: window.SimEngine.cylinderStates[cylComp.id].pos
    };

    // Tekan S1
    window.SimEngine.pressButton(s1Comp.id);
    for (let i = 0; i < 20; i++) window.SimEngine.tick(0.05);

    const duringPress = {
      k1Energized: !!window.SimEngine.relayStates['K1'],
      y1Energized: !!window.SimEngine.solenoidStates['Y1'],
      h1Lit: !!window.SimEngine.lampStates[h1Comp.id],
      cylPos: window.SimEngine.cylinderStates[cylComp.id].pos
    };

    // Lepas S1 (menguji Latching / Self-Holding)
    window.SimEngine.releaseButton(s1Comp.id);
    for (let i = 0; i < 20; i++) window.SimEngine.tick(0.05);

    const afterRelease = {
      k1Energized: !!window.SimEngine.relayStates['K1'],
      y1Energized: !!window.SimEngine.solenoidStates['Y1'],
      h1Lit: !!window.SimEngine.lampStates[h1Comp.id],
      cylPos: window.SimEngine.cylinderStates[cylComp.id].pos
    };

    window.SimEngine.stop();

    return {
      beforePress,
      duringPress,
      afterRelease,
      latchSuccessful: afterRelease.k1Energized && afterRelease.y1Energized && afterRelease.h1Lit && afterRelease.cylPos > 0.9
    };
  });

  console.log('Proto Preset 3 Simulation Test:', JSON.stringify(simProto3, null, 2));

  await browser.close();
}

testLayoutPrototypes().catch(console.error);
