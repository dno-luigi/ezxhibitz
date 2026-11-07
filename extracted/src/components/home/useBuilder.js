import { useCallback, useEffect, useRef, useState } from "react";
import { storage } from "@wron/kit";
import { fileKind, isExpired, planPages } from "../../lib/packet";
import { readWithProgress } from "./bytes";
import * as idb from "./idb";

// The PDF/Word reading and PDF writing code downloads only when it is needed.
const loadProcess = () => import("./process");
const loadBuild = () => import("./pdfBuild");

const DRAFT = "epb-draft-v1";
const SETTINGS = "epb-settings-v1";

export const DEFAULT_SETTINGS = { style: "letters", prefix: "Exhibit", slip: true, pageNumbers: true, position: "top-right" };

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const stripExt = (name) => name.replace(/\.[^.]+$/, "");

export function useBuilder() {
  const [items, setItems] = useState([]);
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [createdAt, setCreatedAt] = useState(null);
  const [share, setShare] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [deletedNote, setDeletedNote] = useState(false);
  const [undo, setUndo] = useState(null);
  const [flash, setFlash] = useState(null);
  const [restored, setRestored] = useState(false);
  const files = useRef(new Map());
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const patch = useCallback((id, p) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...p } : it))), []);

  const run = useCallback(
    async (id, file) => {
      patch(id, { status: "reading", progress: 0, error: null, hint: null });
      try {
        const buffer = await readWithProgress(file, (p) => patch(id, { progress: p }));
        const kind = fileKind(file);
        const { analyze } = await loadProcess();
        const result = await analyze(kind, buffer, file);
        files.current.set(id, { file, buffer, data: result.data });
        patch(id, { status: "ready", progress: 1, pageCount: result.pageCount, thumb: result.thumb || null, aspect: result.aspect || null, note: result.note || null });
      } catch (e) {
        files.current.set(id, { file });
        patch(id, { status: "error", error: e.code || "unreadable", hint: e.hint || null });
      }
    },
    [patch]
  );

  // Restore the saved draft and settings once, on this device.
  useEffect(() => {
    const s = storage.get(SETTINGS);
    if (s && typeof s === "object") setSettingsState({ ...DEFAULT_SETTINGS, ...s });
    const d = storage.get(DRAFT);
    if (d && d.createdAt && Array.isArray(d.items)) {
      if (isExpired(d.createdAt, 30)) {
        storage.remove(DRAFT);
        idb.clear().catch(() => {});
        setDeletedNote(true);
      } else {
        setCreatedAt(d.createdAt);
        setShare(d.share || null);
        setItems(d.items.map((it) => ({ ...it, status: it.error === "unsupported" ? "error" : "reading", progress: 0 })));
        d.items.forEach(async (it) => {
          if (it.error === "unsupported") return;
          const blob = await idb.get(it.id).catch(() => null);
          if (!blob) {
            patch(it.id, { status: "error", error: "missing" });
            return;
          }
          const file = blob instanceof File ? blob : new File([blob], it.name, { type: blob.type });
          run(it.id, file);
        });
      }
    }
    setRestored(true);
  }, [patch, run]);

  // Autosave the outline (files stay in this browser's storage).
  useEffect(() => {
    if (!restored) return;
    storage.set(SETTINGS, settings);
    if (!items.length) {
      storage.remove(DRAFT);
      setSaveState("idle");
      return;
    }
    setSaveState("saving");
    const t = setTimeout(() => {
      storage.set(DRAFT, {
        createdAt,
        share,
        items: items.map(({ id, name, title, kind, size, pageCount, error, hint, note, joinPrev, samePage, scale, aspect, orientation }) => ({
          id, name, title, kind, size, pageCount, error, hint, note, joinPrev, samePage, scale, aspect, orientation,
        })),
      });
      const keep = new Set([...items, ...(undo?.prev || [])].map((i) => i.id));
      idb.keys().then((ks) => ks.forEach((k) => !keep.has(k) && idb.del(k).catch(() => {}))).catch(() => {});
      setSaveState("saved");
    }, 350);
    return () => clearTimeout(t);
  }, [items, settings, share, createdAt, restored, undo]);

  const addFiles = useCallback(
    (list) => {
      const arr = Array.from(list || []);
      if (!arr.length) return;
      setDeletedNote(false);
      setCreatedAt((c) => c || Date.now());
      const added = arr.map((f) => {
        const kind = fileKind(f);
        return { id: uid(), name: f.name, title: stripExt(f.name), kind, size: f.size, status: kind ? "reading" : "error", error: kind ? null : "unsupported", progress: 0, pageCount: null };
      });
      setItems((l) => [...l, ...added]);
      added.forEach((it, i) => {
        if (!it.kind) return;
        idb.put(it.id, arr[i]).catch(() => {});
        run(it.id, arr[i]);
      });
    },
    [run]
  );

  const retry = (id) => {
    const f = files.current.get(id)?.file;
    if (f) run(id, f);
  };

  const remove = (id) => {
    const prev = itemsRef.current;
    setItems(prev.filter((i) => i.id !== id));
    setUndo({ label: "Item removed", prev });
  };

  const rename = (id, title) => patch(id, { title });

  // Reorder the ready items; anything still reading or failed keeps its place at the end.
  const setReadyOrder = (ordered) => {
    setItems((list) => [...ordered, ...list.filter((i) => i.status !== "ready")]);
  };

  const commitReorder = (prev, movedId) => {
    const before = prev.map((i) => i.id).join();
    const after = itemsRef.current.map((i) => i.id).join();
    if (before === after) return;
    setUndo({ label: "Order changed", prev });
    setFlash(movedId);
    setTimeout(() => setFlash((f) => (f === movedId ? null : f)), 900);
  };

  const move = (id, delta) => {
    const prev = itemsRef.current;
    const ready = prev.filter((i) => i.status === "ready");
    const idx = ready.findIndex((i) => i.id === id);
    const to = idx + delta;
    if (idx < 0 || to < 0 || to >= ready.length) return;
    const next = [...ready];
    const [m] = next.splice(idx, 1);
    next.splice(to, 0, m);
    setItems([...next, ...prev.filter((i) => i.status !== "ready")]);
    setUndo({ label: "Order changed", prev });
    setFlash(id);
    setTimeout(() => setFlash((f) => (f === id ? null : f)), 900);
  };

  const applyUndo = () => {
    if (!undo) return;
    setItems(undo.prev);
    setUndo(null);
  };

  const setSettings = (p) => setSettingsState((s) => ({ ...s, ...p }));

  const reset = () => {
    setItems([]);
    setShare(null);
    setCreatedAt(null);
    setUndo(null);
    files.current = new Map();
    idb.clear().catch(() => {});
  };

  const ready = items.filter((i) => i.status === "ready");
  const plan = planPages(ready, settings);
  const build = async () => {
    const { buildPacket } = await loadBuild();
    return buildPacket(ready, files.current, settings);
  };

  return {
    items, ready, plan, settings, setSettings, createdAt, share, setShare, saveState, deletedNote,
    undo, setUndo, applyUndo, flash, addFiles, retry, remove, rename, update: patch, setReadyOrder, commitReorder, move, reset, build,
  };
}
