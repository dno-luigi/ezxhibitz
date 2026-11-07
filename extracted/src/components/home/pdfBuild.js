// Builds the finished packet: one PDF with slip sheets, identifiers and page numbers.
import { identifierFor, planPages, exhibitMap, sharesPage, layoutImages } from "../../lib/packet";
import { strToBytes, pdfString, textWidth } from "./bytes";
import { parsePdf, entries } from "./pdfRead";
import { LINES_PER_PAGE, TEXT_SIZE, LEADING } from "./docx";

export { planPages };

function stampOps(w, h, { pageNo, total, tag, settings }) {
  let o = "";
  if (settings.pageNumbers) {
    const t = `Page ${pageNo} of ${total}`;
    const tw = textWidth(t, 9);
    const m = 28;
    const [v, hz] = settings.position.split("-");
    const y = v === "top" ? h - m - 9 : m;
    const x = hz === "left" ? m : hz === "center" ? (w - tw) / 2 : w - m - tw;
    o += `q 1 1 1 rg ${(x - 5).toFixed(1)} ${(y - 4).toFixed(1)} ${(tw + 10).toFixed(1)} 15 re f 0.2 0.25 0.23 rg BT /EPBF 9 Tf ${x.toFixed(1)} ${y} Td ${pdfString(t)} Tj ET Q\n`;
  }
  if (tag) {
    const tw = textWidth(tag, 10, true);
    const bw = tw + 16;
    const right = !(settings.pageNumbers && settings.position === "top-right");
    const x = right ? w - 24 - bw : 24;
    const y = h - 24 - 18;
    o += `q 0.055 0.478 0.329 rg ${x.toFixed(1)} ${y} ${bw.toFixed(1)} 18 re f 1 1 1 rg BT /EPBB 10 Tf ${(x + 8).toFixed(1)} ${y + 5.5} Td ${pdfString(tag)} Tj ET Q\n`;
  }
  return o;
}

function slipOps(tag, title) {
  const size = 34;
  const tw = textWidth(tag, size, true);
  let o = `BT /EPBB ${size} Tf ${((612 - tw) / 2).toFixed(1)} 420 Td ${pdfString(tag)} Tj ET\n`;
  if (title) {
    const t = title.length > 70 ? title.slice(0, 67) + "..." : title;
    const w2 = textWidth(t, 13);
    o += `0.34 0.41 0.38 rg BT /EPBF 13 Tf ${((612 - w2) / 2).toFixed(1)} 388 Td ${pdfString(t)} Tj ET 0 g\n`;
  }
  return o;
}

function withFonts(res, F, B, lookup) {
  const add = `/EPBF ${F} 0 R /EPBB ${B} 0 R `;
  if (!res || !res.includes("<<")) return `<< /Font << ${add}>> >>`;
  const e = entries(res);
  if (e.Font) {
    const fv = e.Font.value;
    const fd = fv.startsWith("<<") ? fv : lookup(fv) || "<< >>";
    return res.slice(0, e.Font.vs) + fd.replace("<<", "<< " + add) + res.slice(e.Font.ve);
  }
  return res.replace("<<", `<< /Font << ${add}>> `);
}

class Writer {
  constructor() {
    this.objs = new Map();
    this.n = 2; // 1 = catalog, 2 = page tree
    this.pages = [];
  }
  reserve() {
    return ++this.n;
  }
  add(dict, stream = null) {
    const k = this.reserve();
    this.objs.set(k, { dict, stream });
    return k;
  }
  lookup(v) {
    const m = /^\s*(\d+)\s+0\s+R\s*$/.exec(v || "");
    return m ? this.objs.get(+m[1])?.dict : v;
  }
  page(w, h, ops, res) {
    const c = this.add(`<< /Length ${ops.length} >>`, ops);
    this.pages.push(this.add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources ${res} /Contents ${c} 0 R >>`));
  }
  importPdf(parsed, stampFor, F, B) {
    const map = new Map();
    for (const num of parsed.objs.keys()) if (!parsed.skip.has(num)) map.set(num, this.reserve());
    const rn = (t) => (t || "").replace(/(\d+)\s+(\d+)\s+R\b/g, (m, a) => (map.has(+a) ? `${map.get(+a)} 0 R` : "null"));
    const pageSet = new Set(parsed.pages.map((p) => p.num));
    for (const [num, o] of parsed.objs) {
      if (!map.has(num) || pageSet.has(num)) continue;
      this.objs.set(map.get(num), { dict: rn(o.dict), stream: o.stream });
    }
    const look = (v) => this.lookup(v);
    parsed.pages.forEach((pg, k) => {
      const raw = rn(parsed.objs.get(pg.num).dict);
      const e = entries(raw);
      const res0 = e.Resources ? e.Resources.value : pg.inh.Resources ? rn(pg.inh.Resources) : "<< >>";
      const mb0 = e.MediaBox ? e.MediaBox.value : pg.inh.MediaBox ? rn(pg.inh.MediaBox) : "[0 0 612 792]";
      const nums = (look(mb0) || "").match(/-?\d*\.?\d+/g)?.map(Number) || [];
      const [a, b, c, d] = nums.length >= 4 ? nums : [0, 0, 612, 792];
      const rot = e.Rotate ? e.Rotate.value : pg.inh.Rotate ? rn(pg.inh.Rotate) : null;

      let items = "";
      if (e.Contents) {
        const v = e.Contents.value;
        if (v.startsWith("[")) items = v.slice(1, -1);
        else {
          const target = look(v);
          items = target && target.trim().startsWith("[") ? target.trim().slice(1, -1) : v;
        }
      }
      let contents = items;
      let resources = res0;
      const ops = stampFor(k, c - a, d - b);
      if (ops) {
        const q = this.add("<< /Length 2 >>", "q\n");
        const body = `Q\nq 1 0 0 1 ${a} ${b} cm\n${ops}Q\n`;
        const s = this.add(`<< /Length ${body.length} >>`, body);
        contents = `${q} 0 R ${items} ${s} 0 R`;
        resources = withFonts(res0.startsWith("<<") ? res0 : look(res0), F, B, look);
      }
      const keep = Object.entries(e)
        .filter(([key]) => !["Parent", "Contents", "Resources", "MediaBox", "Rotate"].includes(key))
        .map(([key, v]) => `/${key} ${v.value}`)
        .join(" ");
      const dict = `<< ${keep} /Parent 2 0 R /MediaBox [${a} ${b} ${c} ${d}] /Resources ${resources}${
        rot ? ` /Rotate ${look(rot)}` : ""
      }${contents.trim() ? ` /Contents [${contents}]` : ""} >>`;
      const nn = map.get(pg.num);
      this.objs.set(nn, { dict, stream: null });
      this.pages.push(nn);
    });
  }
  finish() {
    this.objs.set(1, { dict: "<< /Type /Catalog /Pages 2 0 R >>", stream: null });
    this.objs.set(2, {
      dict: `<< /Type /Pages /Kids [${this.pages.map((p) => `${p} 0 R`).join(" ")}] /Count ${this.pages.length} >>`,
      stream: null,
    });
    const parts = ["%PDF-1.7\n%\u00E2\u00E3\u00CF\u00D3\n"];
    let off = parts[0].length;
    const offs = [];
    for (let k = 1; k <= this.n; k++) {
      const o = this.objs.get(k) || { dict: "null", stream: null };
      const s = o.stream != null
        ? `${k} 0 obj\n${o.dict}\nstream\n${o.stream}\nendstream\nendobj\n`
        : `${k} 0 obj\n${o.dict}\nendobj\n`;
      offs[k] = off;
      parts.push(s);
      off += s.length;
    }
    let x = `xref\n0 ${this.n + 1}\n0000000000 65535 f \n`;
    for (let k = 1; k <= this.n; k++) x += `${String(offs[k]).padStart(10, "0")} 00000 n \n`;
    x += `trailer\n<< /Size ${this.n + 1} /Root 1 0 R >>\nstartxref\n${off}\n%%EOF\n`;
    parts.push(x);
    return new Blob(parts.map(strToBytes), { type: "application/pdf" });
  }
}

// items: the ready items in packet order. files: Map id -> { buffer, data }.
export async function buildPacket(items, files, settings) {
  const plan = planPages(items, settings);
  const W = new Writer();
  const F = W.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const B = W.add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const fontRes = `/Font << /EPBF ${F} 0 R /EPBB ${B} 0 R >>`;
  let pageNo = 0;
  const stamp = (w, h, tag) => {
    pageNo++;
    return stampOps(w, h, { pageNo, total: plan.total, tag, settings });
  };

  const ex = exhibitMap(items);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const f = files.get(it.id);
    if (!f) throw new Error("missing");
    if (it.kind === "Image" && sharesPage(items, i)) continue; // drawn on the page of the photo above
    const info = ex[i];
    const tag = info.n != null ? identifierFor(info.n, settings.style, settings.prefix) : null;
    const firstTag = tag && !settings.slip ? tag : null;
    if (tag && info.first && settings.slip) W.page(612, 792, slipOps(tag, it.title) + stamp(612, 792, null), `<< ${fontRes} >>`);

    if (it.kind === "PDF") {
      const parsed = await parsePdf(new Uint8Array(f.buffer));
      W.importPdf(parsed, (k, w, h) => stamp(w, h, k === 0 ? firstTag : null), F, B);
    } else if (it.kind === "Image") {
      const group = [i];
      while (sharesPage(items, group[group.length - 1] + 1)) group.push(group[group.length - 1] + 1);
      const pics = group.map((gi) => {
        const d = files.get(items[gi].id)?.data;
        if (!d) throw new Error("missing");
        return { d, scale: items[gi].scale };
      });
      const lay = layoutImages(pics.map((p) => ({ aspect: p.d.w / p.d.h, scale: p.scale })), it.orientation || "auto");
      const names = [];
      let ops = "";
      pics.forEach((p, k) => {
        const obj = W.add(
          `<< /Type /XObject /Subtype /Image /Width ${p.d.w} /Height ${p.d.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.d.jpeg.length} >>`,
          p.d.jpeg
        );
        const r = lay.rects[k];
        ops += `q ${r.w.toFixed(2)} 0 0 ${r.h.toFixed(2)} ${r.x.toFixed(2)} ${(lay.ph - r.y - r.h).toFixed(2)} cm /Im${k} Do Q\n`;
        names.push(`/Im${k} ${obj} 0 R`);
      });
      W.page(lay.pw, lay.ph, ops + stamp(lay.pw, lay.ph, firstTag), `<< /XObject << ${names.join(" ")} >> ${fontRes} >>`);
    } else {
      const lines = f.data.lines;
      for (let p = 0; p * LINES_PER_PAGE < lines.length; p++) {
        const chunk = lines.slice(p * LINES_PER_PAGE, (p + 1) * LINES_PER_PAGE);
        let ops = `BT /EPBF ${TEXT_SIZE} Tf ${LEADING} TL 72 712 Td\n`;
        chunk.forEach((line) => (ops += `${pdfString(line)} Tj T*\n`));
        ops += "ET\n";
        W.page(612, 792, ops + stamp(612, 792, p === 0 ? firstTag : null), `<< ${fontRes} >>`);
      }
    }
  }
  return W.finish();
}
