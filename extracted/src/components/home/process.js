// Turns one added file into what the packet needs: page count, thumbnail and data.
import { bytesToStr, fail } from "./bytes";
import { parsePdf } from "./pdfRead";
import { docxParagraphs, layoutText, LINES_PER_PAGE } from "./docx";

async function imageToJpeg(file) {
  let bmp;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw fail("unreadable", "Try saving it as a JPG or PNG and add it again.");
  }
  const max = 2200;
  const sc = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * sc));
  const h = Math.max(1, Math.round(bmp.height * sc));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.88));
  if (!blob) throw fail("unreadable");
  const jpeg = bytesToStr(new Uint8Array(await blob.arrayBuffer()));

  const t = document.createElement("canvas");
  const ts = 220 / Math.max(w, h);
  t.width = Math.max(1, Math.round(w * ts));
  t.height = Math.max(1, Math.round(h * ts));
  t.getContext("2d").drawImage(c, 0, 0, t.width, t.height);
  return { jpeg, w, h, thumb: t.toDataURL("image/jpeg", 0.7) };
}

export async function analyze(kind, buffer, file) {
  const u8 = new Uint8Array(buffer);
  if (kind === "PDF") {
    const parsed = await parsePdf(u8);
    return { pageCount: parsed.pages.length, data: null };
  }
  if (kind === "Word") {
    if (!file.name.toLowerCase().endsWith(".docx")) {
      if (u8[0] === 0xd0 && u8[1] === 0xcf) {
        throw fail("unreadable", "Older .doc files can't be read here. Save it as .docx or PDF and add it again.");
      }
    }
    const paras = await docxParagraphs(u8);
    const lines = layoutText(paras);
    return {
      pageCount: Math.max(1, Math.ceil(lines.length / LINES_PER_PAGE)),
      data: { lines },
      note: "Added as plain text",
    };
  }
  if (kind === "Image") {
    const img = await imageToJpeg(file);
    return { pageCount: 1, thumb: img.thumb, aspect: img.w / img.h, data: img };
  }
  throw fail("unsupported");
}
