// Byte helpers. PDFs are handled as "binary strings" (one char per byte, 0-255).

export function bytesToStr(u8) {
  let s = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < u8.length; i += CHUNK) {
    s += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
  }
  return s;
}

export function strToBytes(s) {
  const u = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255;
  return u;
}

export async function inflateBytes(u8, format = "deflate") {
  const stream = new Blob([u8]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// A file problem with a code the interface turns into plain words.
export function fail(code, hint) {
  return Object.assign(new Error(code), { code, hint });
}

export function readWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onprogress = (e) => {
      if (e.lengthComputable && e.total) onProgress(e.loaded / e.total);
    };
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(fail("unreadable"));
    r.readAsArrayBuffer(file);
  });
}

// Keep text printable in a standard PDF font (WinAnsi, Latin-1 range).
export function pdfSafe(text) {
  return String(text || "")
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

export function pdfString(text) {
  return "(" + pdfSafe(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)") + ")";
}

// Approximate Helvetica widths in points.
export function textWidth(text, size, bold = false) {
  let w = 0;
  for (const ch of String(text)) {
    if ("ilj.,;:'|!I ".includes(ch)) w += 0.28;
    else if ("mwMW@".includes(ch)) w += 0.82;
    else if (/[A-Z0-9]/.test(ch)) w += 0.64;
    else w += 0.53;
  }
  return w * size * (bold ? 1.06 : 1);
}
