const { chromium } = require('C:/Users/ASUS/AppData/Local/ms-playwright-go/1.57.0/package');
const path = require('path');
const fs = require('fs');

const screenshotDir = path.join(__dirname, 'screenshots_library_header');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const viewports = [
  { name: 'mobile_360x740', width: 360, height: 740, isMobile: true },
  { name: 'mobile_390x844', width: 390, height: 844, isMobile: true },
  { name: 'mobile_430x932', width: 430, height: 932, isMobile: true },
  { name: 'tablet_768x1024', width: 768, height: 1024, isMobile: false },
  { name: 'desktop_1366x768', width: 1366, height: 768, isMobile: false },
];

const testFiles = ['index.html', 'index_single.html'];

async function runTests() {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });

  const results = [];

  for (const file of testFiles) {
    const fileUrl = 'file:///' + path.join(__dirname, file).replace(/\\/g, '/');
    console.log(`\n========================================`);
    console.log(`Testing file: ${file}`);
    console.log(`========================================`);

    for (const vp of viewports) {
      console.log(`\n--- Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      // Pastikan library panel terbuka
      await page.evaluate(() => {
        if (typeof window.toggleLibrary === 'function') {
          window.toggleLibrary(true);
        }
      });
      await page.waitForTimeout(400);

      // Verifikasi elemen-elemen dan ukur bounding boxes
      const metrics = await page.evaluate((isMobile) => {
        const hamb = document.getElementById('sidebar-toggle');
        const libHeader = document.querySelector('.library-header');
        const libTitle = document.querySelector('.library-header h3');
        const libClose = document.getElementById('library-close');
        const searchInput = document.getElementById('library-search');
        const searchIcon = document.querySelector('.library-search-container .search-icon');
        const filterContainer = document.getElementById('library-filter');
        const pneumaticChip = Array.from(document.querySelectorAll('.filter-btn')).find(b => b.textContent.includes('Kendali Pneumatik'));
        const libPanel = document.getElementById('library-panel');

        const hambRect = hamb ? hamb.getBoundingClientRect() : null;
        const hambStyle = hamb ? window.getComputedStyle(hamb) : null;
        const hambVisible = hamb && hambStyle.display !== 'none' && hambStyle.visibility !== 'hidden' && hambStyle.opacity !== '0';

        const headerRect = libHeader ? libHeader.getBoundingClientRect() : null;
        const titleRect = libTitle ? libTitle.getBoundingClientRect() : null;
        const closeRect = libClose ? libClose.getBoundingClientRect() : null;
        const inputRect = searchInput ? searchInput.getBoundingClientRect() : null;
        const iconRect = searchIcon ? searchIcon.getBoundingClientRect() : null;
        const filterRect = filterContainer ? filterContainer.getBoundingClientRect() : null;
        const pneuChipRect = pneumaticChip ? pneumaticChip.getBoundingClientRect() : null;

        // Check element at hamburger center point
        let elementAtHamb = null;
        if (hambRect && hambVisible) {
          const centerX = hambRect.left + hambRect.width / 2;
          const centerY = hambRect.top + hambRect.height / 2;
          const el = document.elementFromPoint(centerX, centerY);
          elementAtHamb = el ? (el.id || el.className || el.tagName) : null;
        }

        // Overlap hamburger vs title
        let hambTitleOverlap = false;
        let overlapPixelsX = 0;
        let overlapPixelsY = 0;
        if (hambRect && titleRect && hambVisible) {
          const ox = Math.max(0, Math.min(hambRect.right, titleRect.right) - Math.max(hambRect.left, titleRect.left));
          const oy = Math.max(0, Math.min(hambRect.bottom, titleRect.bottom) - Math.max(hambRect.top, titleRect.top));
          if (ox > 0 && oy > 0) {
            hambTitleOverlap = true;
            overlapPixelsX = ox;
            overlapPixelsY = oy;
          }
        }

        // Overlap close vs title
        let closeTitleOverlap = false;
        if (closeRect && titleRect) {
          const ox = Math.max(0, Math.min(closeRect.right, titleRect.right) - Math.max(closeRect.left, titleRect.left));
          const oy = Math.max(0, Math.min(closeRect.bottom, titleRect.bottom) - Math.max(closeRect.top, titleRect.top));
          if (ox > 0 && oy > 0) closeTitleOverlap = true;
        }

        // Search icon vs text padding check
        const inputPaddingLeft = searchInput ? parseFloat(window.getComputedStyle(searchInput).paddingLeft) : 0;
        const iconRelRight = (iconRect && inputRect) ? (iconRect.right - inputRect.left) : 0;

        return {
          hambVisible,
          hambRect: hambRect ? { left: hambRect.left, top: hambRect.top, width: hambRect.width, height: hambRect.height, right: hambRect.right } : null,
          titleRect: titleRect ? { left: titleRect.left, top: titleRect.top, width: titleRect.width, height: titleRect.height, right: titleRect.right } : null,
          closeRect: closeRect ? { left: closeRect.left, top: closeRect.top, width: closeRect.width, height: closeRect.height } : null,
          headerRect: headerRect ? { left: headerRect.left, top: headerRect.top, width: headerRect.width, height: headerRect.height } : null,
          hambTitleOverlap,
          overlapPixelsX,
          overlapPixelsY,
          closeTitleOverlap,
          titleText: libTitle ? libTitle.textContent.trim() : '',
          inputPaddingLeft,
          iconRelRight,
          inputPaddingSafe: inputPaddingLeft >= iconRelRight + 4,
          elementAtHamb,
          pneuChipFound: !!pneumaticChip,
          pneuChipText: pneumaticChip ? pneumaticChip.textContent.trim() : null,
        };
      }, vp.isMobile);

      console.log(`- Hamburger visible: ${metrics.hambVisible} (Size: ${metrics.hambRect ? `${metrics.hambRect.width}x${metrics.hambRect.height} at x=${metrics.hambRect.left}` : 'N/A'})`);
      console.log(`- Title: "${metrics.titleText}" (at x=${metrics.titleRect ? metrics.titleRect.left : 'N/A'}, width=${metrics.titleRect ? metrics.titleRect.width : 'N/A'})`);
      console.log(`- Hamburger vs Title Overlap: ${metrics.hambTitleOverlap ? `FAIL (${metrics.overlapPixelsX}px X)` : 'PASS (0px)'}`);
      console.log(`- Close Button: (Size: ${metrics.closeRect ? `${metrics.closeRect.width}x${metrics.closeRect.height}` : 'N/A'})`);
      console.log(`- Close vs Title Overlap: ${metrics.closeTitleOverlap ? 'FAIL' : 'PASS (0px)'}`);
      console.log(`- Search Input Padding Left: ${metrics.inputPaddingLeft}px (Icon right edge: ${metrics.iconRelRight}px, Safe: ${metrics.inputPaddingSafe})`);
      console.log(`- Element at Hamburger center: "${metrics.elementAtHamb}"`);

      // Screenshot 1: Library header view
      const ss1 = path.join(screenshotDir, `${file.replace('.html','')}_${vp.name}_header.png`);
      await page.screenshot({ path: ss1, fullPage: false });

      // Test scrolling filter chip "Kendali Pneumatik"
      let chipScrolledPass = false;
      if (metrics.pneuChipFound) {
        chipScrolledPass = await page.evaluate(() => {
          const filter = document.getElementById('library-filter');
          const chip = Array.from(document.querySelectorAll('.filter-btn')).find(b => b.textContent.includes('Kendali Pneumatik'));
          if (!filter || !chip) return false;
          chip.scrollIntoView({ behavior: 'instant', inline: 'center' });
          const cRect = chip.getBoundingClientRect();
          const fRect = filter.getBoundingClientRect();
          return cRect.left >= fRect.left - 2 && cRect.right <= fRect.right + 2;
        });
        console.log(`- Scroll to "Kendali Pneumatik" chip: ${chipScrolledPass ? 'PASS' : 'FAIL'}`);
      }

      // Screenshot 2: Scrolled chip
      const ss2 = path.join(screenshotDir, `${file.replace('.html','')}_${vp.name}_filter_scrolled.png`);
      await page.screenshot({ path: ss2, fullPage: false });

      // Test click "Kendali Pneumatik"
      await page.evaluate(() => {
        const chip = Array.from(document.querySelectorAll('.filter-btn')).find(b => b.textContent.includes('Kendali Pneumatik'));
        if (chip) chip.click();
      });
      await page.waitForTimeout(200);

      // Test click Hamburger button
      let hambClickPass = false;
      if (vp.isMobile && metrics.hambVisible) {
        await page.click('#sidebar-toggle');
        await page.waitForTimeout(300);
        const sidebarOpen = await page.evaluate(() => {
          const sb = document.getElementById('sidebar');
          return sb && sb.classList.contains('sidebar-open');
        });
        hambClickPass = sidebarOpen;
        console.log(`- Click Hamburger opens Sidebar: ${hambClickPass ? 'PASS' : 'FAIL'}`);

        // Close sidebar and reopen library for next test
        await page.evaluate(() => {
          if (window.toggleSidebar) window.toggleSidebar();
          if (window.toggleLibrary) window.toggleLibrary(true);
        });
        await page.waitForTimeout(300);
      }

      // Test click Close X button
      await page.click('#library-close');
      await page.waitForTimeout(300);
      const libraryClosed = await page.evaluate(() => {
        const lp = document.getElementById('library-panel');
        return lp && (lp.classList.contains('closed') || !lp.classList.contains('library-open'));
      });
      console.log(`- Click Close (X) closes Library Panel: ${libraryClosed ? 'PASS' : 'FAIL'}`);

      results.push({
        file,
        viewport: vp.name,
        width: vp.width,
        metrics,
        chipScrolledPass,
        hambClickPass: vp.isMobile ? hambClickPass : true,
        libraryClosed,
      });

      await context.close();
    }
  }

  await browser.close();

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY`);
  console.log(`========================================`);
  let allPass = true;
  for (const r of results) {
    const isMobile = r.width <= 768;
    const hambPass = isMobile ? (r.metrics.hambVisible && !r.metrics.hambTitleOverlap && r.metrics.hambRect.width >= 44 && r.hambClickPass) : true;
    const titlePass = !r.metrics.hambTitleOverlap && !r.metrics.closeTitleOverlap && r.metrics.titleText.length > 0;
    const closePass = isMobile ? (r.metrics.closeRect && r.metrics.closeRect.width >= 44 && r.metrics.closeRect.height >= 44 && r.libraryClosed) : (r.metrics.closeRect && r.libraryClosed);
    const searchPass = r.metrics.inputPaddingSafe;
    const filterPass = r.chipScrolledPass;

    const pass = hambPass && titlePass && closePass && searchPass && filterPass;
    if (!pass) allPass = false;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${r.file} - ${r.viewport}: Hamb=${hambPass}, Title=${titlePass}, Close=${closePass}, Search=${searchPass}, Filter=${filterPass}`);
  }

  if (allPass) {
    console.log(`\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<`);
  } else {
    console.log(`\n>>> SOME TESTS FAILED! <<<`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
