const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const HTML_FILE = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');

async function testFullSmartRouter() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.goto(HTML_FILE, { waitUntil: 'load' });
  await page.waitForTimeout(500);

  const report = await page.evaluate(() => {
    // Implementasi Smart Orthogonal Router Lengkap
    function smartCalculateOrthogonalPath(start, end) {
      if (!start || !end) return [];
      const stub = 16;
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
            // Kedua port menghadap arah yang sama
            const bendY = start.side === 'top' ? Math.min(sStubY, eStubY) - 10 : Math.max(sStubY, eStubY) + 10;
            points.push({ x: sStubX, y: bendY });
            points.push({ x: eStubX, y: bendY });
          } else {
            // Satu top, satu bottom
            const isProperGap = (start.side === 'top' && sStubY > eStubY) || (start.side === 'bottom' && sStubY < eStubY);
            if (isProperGap) {
              const midY = (sStubY + eStubY) / 2;
              points.push({ x: sStubX, y: midY });
              points.push({ x: eStubX, y: midY });
            } else {
              // Stub tumpang tindih: memutar melalui kolom tengah X
              const midX = (sStubX + eStubX) / 2;
              points.push({ x: midX, y: sStubY });
              points.push({ x: midX, y: eStubY });
            }
          }
        } else if (!sVert && !eVert) {
          if (start.side === end.side) {
            const bendX = start.side === 'left' ? Math.min(sStubX, eStubX) - 10 : Math.max(sStubX, eStubX) + 10;
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
          // Satu vertikal, satu horizontal
          if (sVert) {
            // start vertikal, end horizontal
            // Jika start top dan endY > sStubY, atau start bottom dan endY < sStubY, jangan berbalik menembus komponen start
            const reversingThroughStart = (start.side === 'top' && eStubY > sStubY) || (start.side === 'bottom' && eStubY < sStubY);
            if (reversingThroughStart) {
              points.push({ x: eStubX, y: sStubY });
            } else {
              const enteringWrongSide = (end.side === 'left' && sStubX > eStubX) || (end.side === 'right' && sStubX < eStubX);
              if (enteringWrongSide) {
                const midY = (sStubY + eStubY) / 2;
                points.push({ x: sStubX, y: midY });
                points.push({ x: eStubX, y: midY });
              } else {
                points.push({ x: sStubX, y: eStubY });
              }
            }
          } else {
            // start horizontal, end vertikal
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
        // Sambungan ke junction
        if (start.side) {
          if (sVert) {
            const enteringWrongSide = (start.side === 'top' && eY > sStubY) || (start.side === 'bottom' && eY < sStubY);
            if (enteringWrongSide) {
              const midX = (sStubX + eX) / 2;
              points.push({ x: midX, y: sStubY });
              points.push({ x: midX, y: eY });
            } else {
              points.push({ x: sStubX, y: eY });
            }
          } else {
            const enteringWrongSide = (start.side === 'left' && eX > sStubX) || (start.side === 'right' && eX < sStubX);
            if (enteringWrongSide) {
              const midY = (sStubY + eY) / 2;
              points.push({ x: sStubX, y: midY });
              points.push({ x: eX, y: midY });
            } else {
              points.push({ x: eX, y: sStubY });
            }
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

    // Suntikkan ke helper internal
    window.calculateOrthogonalPath = smartCalculateOrthogonalPath;

    // Helper untuk re-route semua koneksi menggunakan router baru
    function rerouteAllConnections() {
      window.connections.forEach(conn => {
        let startPt = null;
        let endPt = null;

        if (conn.sourceType === 'port') {
          startPt = window.getPortData(conn.sourceCompId, conn.sourcePortNum);
        } else if (conn.sourceType === 'junction') {
          const junc = window.junctions.find(j => j.id === conn.sourceJunctionId);
          if (junc) startPt = { x: junc.x, y: junc.y, side: null };
        }

        if (conn.targetType === 'port') {
          endPt = window.getPortData(conn.targetCompId, conn.targetPortNum);
        } else if (conn.targetType === 'junction') {
          const junc = window.junctions.find(j => j.id === conn.targetJunctionId);
          if (junc) endPt = { x: junc.x, y: junc.y, side: null };
        }

        if (startPt && endPt) {
          conn.waypoints = smartCalculateOrthogonalPath(startPt, endPt);
          window.renderConnection(conn);
        }
      });
    }

    // ==========================================
    // PRESET 1 REVISED
    // ==========================================
    function loadPreset1Clean() {
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
      rerouteAllConnections();
    }

    // ==========================================
    // PRESET 2 REVISED
    // ==========================================
    function loadPreset2Clean() {
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

      window.addConnection(c1.id, 1, frl.id, 1, 'pneumatic');
      const mainPneuConn = window.addConnection(frl.id, 2, mainValve.id, 1, 'pneumatic');

      // Junction pasokan diletakkan di bawah di x=300, y=420
      const branchJunc = window.addJunction(mainPneuConn.id, 300, 420, 'pneumatic');
      window.addBranchConnection(pb1.id, 1, branchJunc.id, 'pneumatic');

      window.addConnection(pb1.id, 2, mainValve.id, 6, 'pneumatic');
      window.addConnection(mainValve.id, 4, cyl.id, 1, 'pneumatic');
      window.addConnection(mainValve.id, 2, cyl.id, 2, 'pneumatic');
      rerouteAllConnections();
    }

    // ==========================================
    // PRESET 3 REVISED
    // ==========================================
    function loadPreset3Clean() {
      window.clearAllComponents(true);
      // Bagian Pneumatik (Atas)
      const c1 = window.addComponent('compressor', 120, 160, { label: 'Kompresor' });
      const frl = window.addComponent('frl-unit', 240, 160, { label: 'FRL' });
      const solValve = window.addComponent('valve-5-2-solenoid', 420, 240, {
        label: 'V1',
        actuationLeft: 'solenoid',
        actuationRight: 'spring',
        solenoidRef: 'Y1'
      });
      const cyl = window.addComponent('cylinder-double', 420, 100, { label: 'A1' });

      window.addConnection(c1.id, 1, frl.id, 1, 'pneumatic');
      window.addConnection(frl.id, 2, solValve.id, 1, 'pneumatic');
      window.addConnection(solValve.id, 4, cyl.id, 1, 'pneumatic');
      window.addConnection(solValve.id, 2, cyl.id, 2, 'pneumatic');

      // Bagian Listrik (Bawah)
      const dc = window.addComponent('dc-source', 120, 360, { label: '24V DC' });
      const s1 = window.addComponent('button-no', 250, 420, { label: 'S1 (Start)' });
      const k1Contact = window.addComponent('relay-contact-no', 340, 420, {
        label: 'K1-1',
        relayRef: 'K1',
        rotation: 90
      });

      const rly = window.addComponent('relay', 295, 520, { label: 'K1', relayId: 'K1', relayRef: 'K1' });
      const sol = window.addComponent('solenoid-coil', 440, 520, { label: 'Y1', solenoidRef: 'Y1' });
      const lamp = window.addComponent('indicator-lamp', 560, 520, { label: 'H1' });

      const pwrRail = window.addConnection(dc.id, 1, s1.id, 1, 'electrical');
      const juncPwr = window.addJunction(pwrRail.id, 200, 360, 'electrical');
      window.addBranchConnection(k1Contact.id, 1, juncPwr.id, 'electrical');

      const latchLine = window.addConnection(s1.id, 2, rly.id, 1, 'electrical');
      const juncLatch = window.addJunction(latchLine.id, 295, 470, 'electrical');
      window.addBranchConnection(k1Contact.id, 2, juncLatch.id, 'electrical');
      window.addBranchConnection(sol.id, 1, juncLatch.id, 'electrical');
      window.addBranchConnection(lamp.id, 1, juncLatch.id, 'electrical');

      const gndLine = window.addConnection(rly.id, 2, dc.id, 2, 'electrical');
      const juncGnd1 = window.addJunction(gndLine.id, 440, 580, 'electrical');
      window.addBranchConnection(sol.id, 2, juncGnd1.id, 'electrical');
      const juncGnd2 = window.addJunction(gndLine.id, 560, 580, 'electrical');
      window.addBranchConnection(lamp.id, 2, juncGnd2.id, 'electrical');

      rerouteAllConnections();
      if (typeof window.updateNeutralWires === 'function') window.updateNeutralWires();
    }

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

    function checkPreset(name, runner) {
      runner();
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
                crossings.push(`Connection ${conn.id} crosses component ${comp.label} (${comp.defId}) at (${p1.x},${p1.y})->(${p2.x},${p2.y})`);
              }
            }
          });
        }
      });

      return { name, compCount: comps.length, connCount: window.connections.length, overlaps, crossings };
    }

    return {
      p1: checkPreset('Preset 1', loadPreset1Clean),
      p2: checkPreset('Preset 2', loadPreset2Clean),
      p3: checkPreset('Preset 3', loadPreset3Clean)
    };
  });

  console.log('Clean Router Results:', JSON.stringify(report, null, 2));
  await browser.close();
}

testFullSmartRouter().catch(console.error);
