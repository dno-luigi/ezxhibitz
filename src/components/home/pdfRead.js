// A small PDF reader: finds every object (including ones packed in object
// streams), the page tree and its inherited attributes. Enough to merge pages
// into a new packet without changing them.
import { bytesToStr, strToBytes, inflateBytes, fail } from "./bytes";

const DELIM = /[\s\/\[\]<>()%]/;

function strEnd(t, i) {
  let depth = 0;
  let j = i;
  while (j < t.length) {
    const ch = t[j];
    if (ch === "\\") { j += 2; continue; }
    if (ch === "(") depth++;
    else if (ch === ")") { depth--; if (!depth) return j + 1; }
    j++;
  }
  return j;
}

export function valueEnd(t, i) {
  if (t.startsWith("<<", i)) {
    let depth = 0;
    let j = i;
    while (j < t.length) {
      if (t.startsWith("<<", j)) { depth++; j += 2; continue; }
      if (t.startsWith(">>", j)) { depth--; j += 2; if (!depth) return j; continue; }
      if (t[j] === "(") { j = strEnd(t, j); continue; }
      j++;
    }
    return j;
  }
  const c = t[i];
  if (c === "[") {
    let depth = 0;
    let j = i;
    while (j < t.length) {
      const ch = t[j];
      if (ch === "(") { j = strEnd(t, j); continue; }
      if (ch === "[") depth++;
      else if (ch === "]") { depth--; if (!depth) return j + 1; }
      j++;
    }
    return j;
  }
  if (c === "(") return strEnd(t, i);
  if (c === "<") { const k = t.indexOf(">", i); return k < 0 ? t.length : k + 1; }
  const ref = /^(\d+)\s+(\d+)\s+R/.exec(t.slice(i, i + 32));
  if (ref) return i + ref[0].length;
  let j = i + 1;
  while (j < t.length && !DELIM.test(t[j])) j++;
  return j;
}

// Top-level entries of a dictionary: { Name: { ks, vs, ve, value } }
export function entries(t) {
  const out = {};
  let i = t.indexOf("<<");
  if (i < 0) return out;
  i += 2;
  while (i < t.length) {
    while (i < t.length && /\s/.test(t[i])) i++;
    if (i >= t.length || t.startsWith(">>", i)) break;
    if (t[i] !== "/") { i++; continue; }
    const ks = i;
    i++;
    while (i < t.length && !DELIM.test(t[i])) i++;
    const name = t.slice(ks + 1, i);
    while (i < t.length && /\s/.test(t[i])) i++;
    const vs = i;
    let ve = valueEnd(t, i);
    if (ve <= vs) ve = vs + 1;
    out[name] = { ks, vs, ve, value: t.slice(vs, ve).trim() };
    i = ve;
  }
  return out;
}

const refNum = (v) => {
  const m = /^\s*(\d+)\s+\d+\s+R\s*$/.exec(v || "");
  return m ? +m[1] : null;
};

export async function parsePdf(u8) {
  const s = bytesToStr(u8);
  const head = s.indexOf("%PDF");
  if (head < 0 || head > 1024) throw fail("unreadable");

  const objs = new Map();
  const re = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = re.exec(s))) {
    const num = +m[1];
    const p = re.lastIndex;
    let eo = s.indexOf("endobj", p);
    if (eo < 0) break;
    const ks = s.indexOf("stream", p);
    if (ks >= 0 && ks < eo && s.slice(p, ks).trim().endsWith(">>")) {
      const dict = s.slice(p, ks).trim();
      let start = ks + 6;
      if (s[start] === "\r") start++;
      if (s[start] === "\n") start++;
      let end = -1;
      const len = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);
      if (len) {
        const guess = start + +len[1];
        if (/^\s*endstream/.test(s.slice(guess, guess + 24))) end = guess;
      }
      if (end < 0) {
        end = s.indexOf("endstream", start);
        if (end < 0) break;
        if (s[end - 1] === "\n") end--;
        if (s[end - 1] === "\r") end--;
      }
      eo = s.indexOf("endobj", end);
      if (eo < 0) eo = s.length;
      objs.set(num, { dict, stream: s.slice(start, end) });
    } else {
      objs.set(num, { dict: s.slice(p, eo).trim(), stream: null });
    }
    re.lastIndex = eo + 6;
  }

  const skip = new Set();
  let root = null;
  let encrypted = false;
  const tIdx = s.lastIndexOf("trailer");
  if (tIdx >= 0) {
    const e = entries(s.slice(tIdx, tIdx + 4096));
    if (e.Root) root = refNum(e.Root.value);
    if (e.Encrypt) encrypted = true;
  }

  const packed = [];
  for (const [num, o] of objs) {
    if (/\/Type\s*\/XRef\b/.test(o.dict) && o.stream != null) {
      skip.add(num);
      const e = entries(o.dict);
      if (!root && e.Root) root = refNum(e.Root.value);
      if (e.Encrypt) encrypted = true;
    } else if (/\/Type\s*\/ObjStm\b/.test(o.dict) && o.stream != null) {
      skip.add(num);
      packed.push(o);
    }
  }
  if (encrypted) throw fail("password");

  for (const o of packed) {
    const e = entries(o.dict);
    const filter = e.Filter ? e.Filter.value : "";
    if (filter && !/FlateDecode/.test(filter)) throw fail("unreadable");
    let data;
    try {
      data = filter ? bytesToStr(await inflateBytes(strToBytes(o.stream))) : o.stream;
    } catch {
      throw fail("unreadable");
    }
    const n = +(e.N?.value || 0);
    const first = +(e.First?.value || 0);
    const nums = data.slice(0, first).trim().split(/\s+/).map(Number);
    for (let i = 0; i < n; i++) {
      const objNum = nums[i * 2];
      const off = nums[i * 2 + 1];
      const next = i + 1 < n ? nums[i * 2 + 3] : data.length - first;
      if (!objs.has(objNum)) {
        objs.set(objNum, { dict: data.slice(first + off, first + next).trim(), stream: null });
      }
    }
  }

  if (root == null || !objs.has(root)) throw fail("unreadable");
  skip.add(root);

  const pagesRef = refNum(entries(objs.get(root).dict).Pages?.value);
  const pages = [];
  const seen = new Set();
  const resolveText = (v) => {
    const r = refNum(v);
    return r != null ? objs.get(r)?.dict || "" : v || "";
  };
  const walk = (num, inherited) => {
    if (num == null || seen.has(num) || seen.size > 100000) return;
    seen.add(num);
    const o = objs.get(num);
    if (!o) return;
    const e = entries(o.dict);
    const inh = { ...inherited };
    for (const k of ["Resources", "MediaBox", "Rotate"]) if (e[k]) inh[k] = e[k].value;
    const type = e.Type ? e.Type.value : "";
    if (type === "/Pages" || (e.Kids && type !== "/Page")) {
      const kids = resolveText(e.Kids?.value);
      for (const k of kids.matchAll(/(\d+)\s+\d+\s+R/g)) walk(+k[1], inh);
    } else {
      pages.push({ num, inh });
    }
  };
  walk(pagesRef, {});
  if (!pages.length) throw fail("unreadable");
  return { objs, pages, skip };
}
