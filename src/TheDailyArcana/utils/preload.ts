// Preload a remote image so the next render doesn't paint blank for
// 0.5–3s while the browser fetches + decodes. Hard timeout so a stuck
// CDN never hangs the loader; rejects on real error so caller can retry
// but never blocks the UI permanently. Always resolves on timeout to
// keep the flow alive — the <img> will fill in once the network finishes.
//
// Memory rule: every gen-image result MUST go through this before the
// phase swap that mounts the <img>, otherwise the destination view
// paints empty (Album Cover Generator / Tap-and-Tell precedent).
export function preloadImage(url: string, timeoutMs = 12000): Promise<void> {
  return new Promise((resolve) => {
    if (!url) { resolve(); return; }
    const img = new Image();
    let settled = false;
    const done = () => { if (!settled) { settled = true; resolve(); } };
    // Hard timeout so a stuck CDN never hangs the loader.
    const tm = setTimeout(done, timeoutMs);
    const tryDecode = async () => {
      try {
        if ('decode' in img) await (img as HTMLImageElement & { decode: () => Promise<void> }).decode();
      } catch { /* fall through */ }
      clearTimeout(tm);
      done();
    };
    img.onload = tryDecode;
    img.onerror = () => { clearTimeout(tm); done(); };
    img.src = url;
  });
}
