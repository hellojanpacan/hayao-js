// Share & save helpers — screenshots to disk, the page URL to the OS share
// sheet. Cosmetic host utilities (browser-only, no-op guards); the debug pane
// binds them to buttons, games can call them from menus ("Share your run").

/** Trigger a browser download of a data: or blob: URL. */
export function downloadDataURL(url: string, filename: string): void {
  if (typeof document === 'undefined') return;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

/**
 * Save the mounted game view as an image file: a canvas backend saves PNG, the
 * SVG backend saves a real vector .svg (the crisper artifact — vector-first
 * pays off here too). Pass `handle.canvas`. Returns false when the element
 * kind isn't captureable.
 */
export function saveCanvas(el: HTMLElement | SVGElement | undefined, filename = 'hayao-shot'): boolean {
  if (!el || typeof document === 'undefined') return false;
  if (el instanceof HTMLCanvasElement) {
    downloadDataURL(el.toDataURL('image/png'), `${filename}.png`);
    return true;
  }
  if (typeof SVGElement !== 'undefined' && el instanceof SVGElement) {
    const xml = new XMLSerializer().serializeToString(el);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    downloadDataURL(url, `${filename}.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return true;
  }
  return false;
}

export interface ShareOptions {
  title?: string;
  text?: string;
  /** Defaults to the current page URL. */
  url?: string;
}

/**
 * Share the game's URL through the native share sheet; where there is none
 * (desktop), copy it to the clipboard instead. Resolves 'shared' | 'copied' |
 * 'unavailable' so a caller can toast the right confirmation. Call from a user
 * gesture (browser requirement).
 */
export async function shareURL(opts: ShareOptions = {}): Promise<'shared' | 'copied' | 'unavailable'> {
  if (typeof navigator === 'undefined') return 'unavailable';
  const url = opts.url ?? (typeof location !== 'undefined' ? location.href : '');
  if (!url) return 'unavailable';
  if (navigator.share) {
    try {
      await navigator.share({ title: opts.title, text: opts.text, url });
      return 'shared';
    } catch {
      // user dismissed the sheet — fall through to the clipboard
    }
  }
  try {
    await navigator.clipboard?.writeText(url);
    return 'copied';
  } catch {
    return 'unavailable';
  }
}
