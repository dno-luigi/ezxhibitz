// Small helpers shared by the builder and the sections.

// 0 -> "A", 25 -> "Z", 26 -> "AA"
export function toLetters(index) {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// style: "letters" | "numbers"; prefix e.g. "Exhibit"
export function identifierFor(index, style = "letters", prefix = "Exhibit") {
  const mark = style === "numbers" ? String(index + 1) : toLetters(index);
  return prefix ? `${prefix.trim()} ${mark}` : mark;
}

// Which exhibit each ready item belongs to. Item 0 is the main document (no identifier).
// From item 2 on, "joinPrev" keeps a file under the same letter or number as the one above.
export function exhibitMap(items) {
  let n = -1;
  return items.map((it, i) => {
    if (i === 0) return { n: null, first: true };
    const joined = i >= 2 && !!it.joinPrev;
    if (!joined) n++;
    return { n, first: !joined };
  });
}

// A photo shares the page of the photo above when it is in the same exhibit and asks to.
export function sharesPage(items, i) {
  const it = items[i];
  const prev = items[i - 1];
  return !!it && !!prev && i >= 2 && it.kind === "Image" && prev.kind === "Image" && !!it.joinPrev && !!it.samePage;
}

// Places photos on one page: rows that wrap, each photo sized by its scale (0.15 to 1) of the page width.
// Rects are in points, measured from the top left of the page.
// orientation: "auto" (one wide photo turns the page sideways), "portrait" or "landscape".
export function layoutImages(images, orientation = "auto") {
  const landscape =
    orientation === "landscape" || (orientation !== "portrait" && images.length === 1 && (images[0].aspect || 1) > 1);
  const pw = landscape ? 792 : 612;
  const ph = landscape ? 612 : 792;
  const boxW = pw - 96;
  const boxH = ph - 112;
  const gap = 12;
  const sizes = images.map((im) => {
    const s = Math.min(1, Math.max(0.15, im.scale || 1));
    const a = im.aspect || 1;
    let w = boxW * s;
    let h = w / a;
    if (h > boxH) {
      h = boxH;
      w = h * a;
    }
    return { w, h };
  });
  const rows = [];
  let cur = [];
  let curW = 0;
  sizes.forEach((s, i) => {
    if (cur.length && curW + gap + s.w > boxW + 0.5) {
      rows.push({ idx: cur, w: curW });
      cur = [];
      curW = 0;
    }
    curW += (cur.length ? gap : 0) + s.w;
    cur.push(i);
  });
  if (cur.length) rows.push({ idx: cur, w: curW });
  rows.forEach((r) => (r.h = Math.max(...r.idx.map((i) => sizes[i].h))));
  const totalH = rows.reduce((a, r) => a + r.h, 0) + gap * (rows.length - 1);
  const k = totalH > boxH ? boxH / totalH : 1;
  let y = (ph - totalH * k) / 2;
  const rects = [];
  rows.forEach((r) => {
    let x = (pw - r.w * k) / 2;
    r.idx.forEach((i) => {
      const w = sizes[i].w * k;
      const h = sizes[i].h * k;
      rects[i] = { x, y: y + (r.h * k - h) / 2, w, h };
      x += w + gap * k;
    });
    y += r.h * k + gap * k;
  });
  return { pw, ph, rects, landscape };
}

// The packet page by page, used by the preview and the builder alike.
export function planPages(items, settings) {
  const pages = [];
  const ranges = {};
  const ex = exhibitMap(items);
  items.forEach((it, i) => {
    const info = ex[i];
    const tag = info.n != null ? identifierFor(info.n, settings.style, settings.prefix) : null;
    if (it.kind === "Image" && sharesPage(items, i)) {
      ranges[it.id] = `${pages.length}`;
      return;
    }
    if (tag && info.first && settings.slip) pages.push({ type: "slip", tag, title: it.title, itemId: it.id });
    const start = pages.length + 1;
    if (it.kind === "Image") {
      const group = [it];
      for (let j = i + 1; j < items.length && sharesPage(items, j); j++) group.push(items[j]);
      const images = group.map((g) => ({ thumb: g.thumb, aspect: g.aspect || 1, scale: g.scale || 1 }));
      pages.push({
        type: "page",
        kind: "Image",
        itemId: it.id,
        k: 0,
        tag: tag && !settings.slip ? tag : null,
        images,
        orientation: it.orientation || "auto",
        landscape: layoutImages(images, it.orientation || "auto").landscape,
      });
    } else {
      for (let k = 0; k < (it.pageCount || 0); k++) {
        pages.push({
          type: "page",
          kind: it.kind,
          itemId: it.id,
          k,
          tag: tag && !settings.slip && k === 0 ? tag : null,
          thumb: null,
        });
      }
    }
    const end = pages.length;
    ranges[it.id] = end >= start ? (start === end ? `${start}` : `${start}-${end}`) : "";
  });
  return { pages, total: pages.length, ranges };
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileKind(file) {
  const name = (file?.name || "").toLowerCase();
  const type = file?.type || "";
  if (type === "application/pdf" || name.endsWith(".pdf")) return "PDF";
  if (type.startsWith("image/") || /\.(png|jpe?g|gif|webp|heic)$/.test(name)) return "Image";
  if (/\.(docx?)$/.test(name) || type.includes("word")) return "Word";
  return null; // unsupported
}

// Page range text for an ordered list of page counts: ["1-4", "5", ...]
export function pageRanges(counts) {
  let start = 1;
  return counts.map((c) => {
    const n = Math.max(0, c || 0);
    if (!n) return "";
    const end = start + n - 1;
    const label = n === 1 ? `${start}` : `${start}-${end}`;
    start = end + 1;
    return label;
  });
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Removal date for something created at `createdAt` (30-day retention).
export function removalDate(createdAt, days = 30) {
  return addDays(createdAt, days);
}

export function isExpired(createdAt, days = 30) {
  return Date.now() > removalDate(createdAt, days).getTime();
}

export function money(cents) {
  if (!cents) return "Free";
  return `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
}
