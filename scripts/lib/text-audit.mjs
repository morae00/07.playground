// Text audit (UI-08), shared by the visual gate and the UI probes: run it on a page to list text under 13 px and
// text under WCAG contrast. The function runs in the page, so everything it needs is inside it.
// UI-08: text the player reads is at least 13 px and meets WCAG contrast (4.5:1, or 3:1 for large text) against the
// surface behind it. Text drawn over the game canvas has its own paper halo, and text on baked art has no single
// background colour, so both are skipped; disabled controls are exempt (WCAG 1.4.3).
export async function inspectText(page) {
  return page.evaluate(() => {
    const parse = (value) => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const [r, g, b, a = 1] = match[1].split(/[ ,/]+/).filter(Boolean).map(Number);
      return { r, g, b, a };
    };
    const over = (top, bottom) => ({
      r: top.r * top.a + bottom.r * (1 - top.a),
      g: top.g * top.a + bottom.g * (1 - top.a),
      b: top.b * top.a + bottom.b * (1 - top.a),
      a: 1,
    });
    const luminance = ({ r, g, b }) => {
      const channel = (value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const ratio = (a, b) => {
      const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (light + 0.05) / (dark + 0.05);
    };
    /**
     * The opaque colour behind an element's text, or null when it sits on the canvas, on art, or under a filter.
     * It reads what is painted under the text's centre, so a caption placed outside its parent's box is measured
     * against the surface it actually sits on.
     */
    const surface = (element) => {
      const rect = element.getBoundingClientRect();
      const x = Math.min(innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
      const y = Math.min(innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
      const stack = document.elementsFromPoint(x, y);
      const own = stack.indexOf(element);
      // Scrolled out of its container (clipped) or covered: nothing of it shows at its centre, so it is not read.
      if (own < 0 && !stack.some((other) => element.contains(other))) return null;
      const below = [element, ...stack.slice(own + 1).filter((other) => other !== element && !element.contains(other))];
      const layers = [];
      for (const current of below) {
        if (current.tagName === 'CANVAS') return null;
        if (current.closest('.gameHud, .xpStrip, .bossBar, .effectRack, .bossIntro, .hintToast')) return null;
        const style = getComputedStyle(current);
        if (style.backgroundImage !== 'none' || style.filter !== 'none' || style.mixBlendMode !== 'normal') return null;
        const background = parse(style.backgroundColor);
        if (background && background.a > 0) {
          layers.push(background);
          if (background.a >= 1) return layers.reduceRight((under, layer) => over(layer, under));
        }
      }
      return null;
    };
    const visible = (element) => {
      if (element.closest('[aria-hidden="true"], .srOnly, [hidden]')) return false;
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || rect.bottom < 0 || rect.right < 0 || rect.top > innerHeight || rect.left > innerWidth) return false;
      for (let current = element; current; current = current.parentElement) {
        const style = getComputedStyle(current);
        if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) return false;
      }
      return true;
    };
    const small = [];
    const faint = [];
    let checked = 0;
    const seen = new Set();
    // With a modal open, the page behind it is dimmed on purpose; only the modal's text is read.
    const modals = [...document.querySelectorAll('[role="dialog"][aria-modal="true"], [role="alertdialog"]')].filter(visible);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement;
      if (!element || seen.has(element) || !node.textContent.trim() || !visible(element)) continue;
      if (modals.length > 0 && !modals.some((modal) => modal.contains(element))) continue;
      seen.add(element);
      if (element.closest('button:disabled, [aria-disabled="true"], input:disabled, select:disabled')) continue;
      const style = getComputedStyle(element);
      const size = Number.parseFloat(style.fontSize);
      const text = node.textContent.trim().slice(0, 30);
      if (size < 12.95) small.push(`${size.toFixed(1)}px "${text}"`);
      const colour = parse(style.color);
      const behind = surface(element);
      if (!colour || !behind) continue;
      // Opacity on the text or a parent fades it towards the surface.
      for (let current = element; current; current = current.parentElement) colour.a *= Number(getComputedStyle(current).opacity);
      checked += 1;
      const weight = Number(style.fontWeight) || 400;
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const value = ratio(over(colour, behind), behind);
      if (value < (large ? 3 : 4.5)) faint.push(`${value.toFixed(2)}:1 "${text}"`);
    }
    return { small: [...new Set(small)], faint: [...new Set(faint)], checked };
  });
}
