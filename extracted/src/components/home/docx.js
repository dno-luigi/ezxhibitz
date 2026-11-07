// Reads the text of a .docx file (a zip) and lays it out into PDF lines.
import { inflateBytes, fail, pdfSafe, textWidth } from "./bytes";

export const TEXT_SIZE = 11;
export const LEADING = 15;
export const LINES_PER_PAGE = 43;
const MAX_WIDTH = 468;

async function readZipEntry(u8, target) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw fail("unreadable");
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (p + 46 > u8.length || dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true);
    const xlen = dv.getUint16(p + 30, true);
    const clen = dv.getUint16(p + 32, true);
    const off = dv.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    if (name === target) {
      const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      const data = u8.subarray(start, start + csize);
      if (method === 0) return data;
      if (method === 8) return inflateBytes(data, "deflate-raw");
      throw fail("unreadable");
    }
    p += 46 + nlen + xlen + clen;
  }
  return null;
}

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s) =>
  s.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1));
    return ENT[e] ?? m;
  });

export async function docxParagraphs(u8) {
  if (u8[0] === 0xd0 && u8[1] === 0xcf) throw fail("password");
  if (!(u8[0] === 0x50 && u8[1] === 0x4b)) throw fail("unreadable");
  let xml;
  try {
    xml = await readZipEntry(u8, "word/document.xml");
  } catch (e) {
    throw e.code ? e : fail("unreadable");
  }
  if (!xml) throw fail("unreadable");
  const text = new TextDecoder("utf-8").decode(xml);
  const paras = [];
  for (const pm of text.matchAll(/<w:p\b[^>]*\/>|<w:p\b[^>]*>[\s\S]*?<\/w:p>/g)) {
    let line = "";
    for (const t of pm[0].matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\/>/g)) {
      if (t[0].startsWith("<w:tab")) line += "    ";
      else if (t[0].startsWith("<w:br")) line += "\n";
      else line += decode(t[1]);
    }
    paras.push(line);
  }
  return paras;
}

export function layoutText(paras) {
  const lines = [];
  for (const para of paras) {
    for (const part of para.split("\n")) {
      const words = pdfSafe(part).split(/(\s+)/);
      let cur = "";
      for (const w of words) {
        const next = cur + w;
        if (cur && textWidth(next, TEXT_SIZE) > MAX_WIDTH) {
          lines.push(cur.trimEnd());
          cur = w.trimStart();
        } else cur = next;
        while (textWidth(cur, TEXT_SIZE) > MAX_WIDTH && cur.length > 1) {
          let cut = cur.length - 1;
          while (cut > 1 && textWidth(cur.slice(0, cut), TEXT_SIZE) > MAX_WIDTH) cut--;
          lines.push(cur.slice(0, cut));
          cur = cur.slice(cut);
        }
      }
      lines.push(cur.trimEnd());
    }
  }
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines.length ? lines : [""];
}
