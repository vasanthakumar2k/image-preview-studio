import {
  TOOLS,
  TOOL_NAMES,
  defaultValues,
  normalizeValues,
  processPixels,
  type ToolDef,
  type ToolName,
  type Values,
} from './filters';
import { TOOL_ICONS, UI_ICONS } from './icons';
import { injectStyles } from './styles';

export { TOOLS, TOOL_NAMES, defaultValues, processPixels };
export type { ToolDef, ToolName, Values };

export type ImageSource = string | File | Blob | HTMLImageElement | HTMLCanvasElement | ImageBitmap;

/** `true` = show the tool, `false` = hide it. Missing tools are shown. */
export type ToolsConfig = Partial<Record<ToolName, boolean>>;

export interface DownloadOptions {
  fileName?: string;
  type?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
}

export interface ImageStudioOptions {
  /** Image URL, data URL, File/Blob, <img>, <canvas> or ImageBitmap. */
  src?: ImageSource;
  /** Turn individual tools on/off: `{ sharpness: false, grain: false }`. */
  tools?: ToolsConfig;
  /** Starting values, e.g. `{ brightness: 20, temperature: -10 }`. */
  values?: Partial<Values>;
  /** Rename tool labels, e.g. `{ temperature: 'Warmth' }`. */
  labels?: Partial<Record<ToolName, string>>;
  theme?: 'dark' | 'light';
  /** Accent colour for slider, active tool, buttons. */
  accent?: string;
  /** Height of the editor (CSS value). Default `100%` of its container. */
  height?: string;
  /** Show the top bar (title, reset, compare, download). Default `true`. */
  header?: boolean;
  title?: string;
  /** Show an "Open" button / empty state picker. Default `true`. */
  upload?: boolean;
  /** Show the reset-all button. Default `true`. */
  reset?: boolean;
  /** Show the hold-to-compare button. Default `true`. */
  compare?: boolean;
  /** Show download button (or pass options). Default `true`. */
  download?: boolean | DownloadOptions;
  /** Allow small images to be scaled up to fill the stage. Default `false` (kept at real size). */
  upscale?: boolean;
  /** Longest side of the live preview in px. Export always uses full size. Default 1600. */
  previewSize?: number;
  /** Which tool is open first. Defaults to the first enabled tool. */
  activeTool?: ToolName;
  onChange?: (values: Values, tool: ToolName | null) => void;
  onReady?: (info: { width: number; height: number }) => void;
  onError?: (error: unknown) => void;
}

type El<K extends keyof HTMLElementTagNameMap> = HTMLElementTagNameMap[K];

function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): El<K> {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function loadSource(src: ImageSource): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof HTMLCanvasElement !== 'undefined' && src instanceof HTMLCanvasElement) return Promise.resolve(src);
  if (typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap) return Promise.resolve(src);
  return new Promise((resolve, reject) => {
    let img: HTMLImageElement;
    let revoke: string | null = null;
    if (src instanceof HTMLImageElement) {
      img = src;
      if (img.complete && img.naturalWidth) return resolve(wrapImg(img));
    } else {
      img = new Image();
      if (typeof src === 'string') {
        if (!src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
        img.src = src;
      } else {
        revoke = URL.createObjectURL(src as Blob);
        img.src = revoke;
      }
    }
    img.onload = () => {
      if (revoke) URL.revokeObjectURL(revoke);
      resolve(wrapImg(img));
    };
    img.onerror = () => {
      if (revoke) URL.revokeObjectURL(revoke);
      reject(new Error('image-preview-studio: could not load image (check the URL and CORS headers)'));
    };
  });
}

// Draw <img> onto a canvas so width/height are the real (natural) pixel size.
function wrapImg(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext('2d')!.drawImage(img, 0, 0);
  return c;
}

/**
 * Apply adjustment values to any image without the UI.
 * Returns a new canvas at full resolution.
 */
export async function applyFilters(src: ImageSource, values: Partial<Values>): Promise<HTMLCanvasElement> {
  const img = await loadSource(src);
  return renderFull(img, normalizeValues(values));
}

function renderFull(img: CanvasImageSource & { width: number; height: number }, v: Values): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const out = ctx.createImageData(c.width, c.height);
  processPixels(data.data, out.data, c.width, c.height, v);
  ctx.putImageData(out, 0, 0);
  return c;
}

export class ImageStudio {
  readonly root: HTMLDivElement;
  private opts: ImageStudioOptions;
  private host: HTMLElement;
  private values: Values;
  private enabled: ToolDef[] = [];
  private active: ToolName | null = null;

  private image: (CanvasImageSource & { width: number; height: number }) | null = null;
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private original: ImageData | null = null;
  private output: ImageData | null = null;
  private comparing = false;
  private raf = 0;
  private ro: ResizeObserver | null = null;
  private loadToken = 0;

  private stage!: HTMLDivElement;
  private empty!: HTMLDivElement;
  private badge!: HTMLDivElement;
  private panel!: HTMLDivElement;
  private panelName!: HTMLSpanElement;
  private valueEl!: HTMLSpanElement;
  private toolResetBtn!: HTMLButtonElement;
  private range!: HTMLInputElement;
  private scaleMin!: HTMLSpanElement;
  private scaleMax!: HTMLSpanElement;
  private toolbar!: HTMLDivElement;
  private toolBtns = new Map<ToolName, HTMLButtonElement>();
  private headerBtns: Partial<Record<'reset' | 'compare' | 'download', HTMLButtonElement>> = {};
  private fileInput: HTMLInputElement | null = null;

  constructor(target: string | HTMLElement, options: ImageStudioOptions = {}) {
    const host = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!host) throw new Error(`image-preview-studio: target "${String(target)}" not found`);
    injectStyles();
    this.host = host;
    this.opts = { ...options };
    this.values = normalizeValues(options.values);
    this.root = h('div', 'it-root');
    this.build();
    host.appendChild(this.root);
    this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.fit()) : null;
    this.ro?.observe(this.stage);
    if (options.src) this.setImage(options.src);
  }

  // ───────────────────────── public API ─────────────────────────

  /** Load a new image. Keeps current values (call reset() to clear). */
  async setImage(src: ImageSource): Promise<void> {
    const token = ++this.loadToken;
    try {
      const img = await loadSource(src);
      if (token !== this.loadToken) return;
      this.image = img;
      this.preparePreview();
      this.syncHeader();
      this.opts.onReady?.({ width: img.width, height: img.height });
    } catch (err) {
      if (this.opts.onError) this.opts.onError(err);
      else console.error(err);
    }
  }

  getValues(): Values {
    return { ...this.values };
  }

  setValue(tool: ToolName, value: number): void {
    this.setValues({ [tool]: value });
  }

  setValues(values: Partial<Values>): void {
    this.values = normalizeValues(values, this.values);
    this.refreshPanel();
    this.refreshTools();
    this.schedule();
  }

  /** Reset one tool, or all tools when called without an argument. */
  reset(tool?: ToolName): void {
    if (tool) this.values[tool] = 0;
    else this.values = defaultValues();
    this.refreshPanel();
    this.refreshTools();
    this.schedule();
    this.opts.onChange?.(this.getValues(), tool ?? null);
  }

  /** Change options after creation (tools, theme, accent, labels, src…). */
  update(options: Partial<ImageStudioOptions>): void {
    const prevSrc = this.opts.src;
    this.opts = { ...this.opts, ...options };
    if (options.values) this.values = normalizeValues(options.values, this.values);
    const rebuildKeys: (keyof ImageStudioOptions)[] = ['tools', 'labels', 'header', 'title', 'upload', 'reset', 'compare', 'download', 'theme', 'accent', 'height', 'activeTool'];
    if (rebuildKeys.some((k) => k in options)) {
      this.root.innerHTML = '';
      this.toolBtns.clear();
      this.headerBtns = {};
      this.ro?.disconnect();
      this.build();
      this.ro?.observe(this.stage);
      if (this.image) this.preparePreview();
    } else {
      this.refreshPanel();
      this.refreshTools();
      this.schedule();
    }
    if (options.src && options.src !== prevSrc) this.setImage(options.src);
  }

  /** Full-resolution edited image as a canvas. */
  toCanvas(): HTMLCanvasElement {
    if (!this.image) throw new Error('image-preview-studio: no image loaded');
    return renderFull(this.image, this.effectiveValues());
  }

  toDataURL(type: DownloadOptions['type'] = 'image/png', quality = 0.92): string {
    return this.toCanvas().toDataURL(type, quality);
  }

  toBlob(type: DownloadOptions['type'] = 'image/png', quality = 0.92): Promise<Blob> {
    const c = this.toCanvas();
    return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('image-preview-studio: export failed'))), type, quality));
  }

  async download(opts: DownloadOptions = {}): Promise<void> {
    const type = opts.type ?? 'image/jpeg';
    const ext = type.split('/')[1].replace('jpeg', 'jpg');
    const blob = await this.toBlob(type, opts.quality ?? 0.92);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = opts.fileName ?? `edited.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /** Select which slider is shown. */
  selectTool(tool: ToolName): void {
    if (!this.enabled.some((t) => t.name === tool)) return;
    this.active = tool;
    this.refreshTools();
    this.refreshPanel();
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.ro?.disconnect();
    this.root.remove();
    this.image = null;
    this.original = this.output = null;
  }

  // ───────────────────────── internals ─────────────────────────

  /** Disabled tools always count as 0, even if a value was passed. */
  private effectiveValues(): Values {
    const v = defaultValues();
    for (const t of this.enabled) v[t.name] = this.values[t.name];
    return v;
  }

  private build(): void {
    const o = this.opts;
    this.root.className = 'it-root' + (o.theme === 'light' ? ' it-light' : '');
    if (o.accent) this.root.style.setProperty('--it-accent', o.accent);
    else this.root.style.removeProperty('--it-accent');
    this.root.style.height = o.height ?? '100%';

    const tools = o.tools ?? {};
    this.enabled = TOOLS.filter((t) => tools[t.name] !== false).map((t) => ({
      ...t,
      label: o.labels?.[t.name] ?? t.label,
    }));
    this.active =
      o.activeTool && this.enabled.some((t) => t.name === o.activeTool) ? o.activeTool : this.enabled[0]?.name ?? null;

    // file input (shared by header + empty state)
    this.fileInput = null;
    if (o.upload !== false) {
      const fi = h('input');
      fi.type = 'file';
      fi.accept = 'image/*';
      fi.style.display = 'none';
      fi.addEventListener('change', () => {
        const f = fi.files?.[0];
        if (f) this.setImage(f);
        fi.value = '';
      });
      this.fileInput = fi;
      this.root.appendChild(fi);
    }

    // header
    if (o.header !== false) {
      const header = h('div', 'it-header');
      header.appendChild(h('div', 'it-title', '')).textContent = o.title ?? 'Edit photo';
      const btn = (icon: string, label: string, cls = '') => {
        const b = h('button', 'it-hbtn ' + cls, `${icon}<span class="it-hlabel">${label}</span>`);
        b.type = 'button';
        b.title = label;
        b.setAttribute('aria-label', label);
        header.appendChild(b);
        return b;
      };
      if (this.fileInput) btn(UI_ICONS.open, 'Open').addEventListener('click', () => this.fileInput!.click());
      if (o.reset !== false) {
        const b = btn(UI_ICONS.reset, 'Reset');
        b.addEventListener('click', () => this.reset());
        this.headerBtns.reset = b;
      }
      if (o.compare !== false) {
        const b = btn(UI_ICONS.compare, 'Compare');
        b.title = 'Hold to see original';
        const on = (e: Event) => { e.preventDefault(); this.setCompare(true); };
        const off = () => this.setCompare(false);
        b.addEventListener('pointerdown', on);
        b.addEventListener('pointerup', off);
        b.addEventListener('pointerleave', off);
        b.addEventListener('pointercancel', off);
        b.addEventListener('contextmenu', (e) => e.preventDefault());
        b.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') this.setCompare(true); });
        b.addEventListener('keyup', off);
        this.headerBtns.compare = b;
      }
      if (o.download !== false) {
        const b = btn(UI_ICONS.download, 'Save', 'it-primary');
        b.addEventListener('click', () => this.download(typeof o.download === 'object' ? o.download : {}));
        this.headerBtns.download = b;
      }
      this.root.appendChild(header);
    }

    // stage
    this.stage = h('div', 'it-stage');
    this.canvas = h('canvas', 'it-canvas');
    this.canvas.style.display = 'none';
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.empty = h('div', 'it-empty', `${UI_ICONS.image}<div>No image selected</div>`);
    if (this.fileInput) {
      const b = h('button', 'it-hbtn it-primary', `${UI_ICONS.open}<span>Choose image</span>`);
      b.type = 'button';
      b.addEventListener('click', () => this.fileInput!.click());
      this.empty.appendChild(b);
    }
    this.badge = h('div', 'it-badge');
    this.badge.textContent = 'Original';
    this.stage.append(this.canvas, this.empty, this.badge);
    this.root.appendChild(this.stage);

    // slider panel
    this.panel = h('div', 'it-panel');
    const head = h('div', 'it-panel-head');
    this.panelName = h('span', 'it-panel-name');
    const right = h('div', 'it-panel-right');
    this.toolResetBtn = h('button', 'it-tool-reset');
    this.toolResetBtn.type = 'button';
    this.toolResetBtn.textContent = 'Reset';
    this.toolResetBtn.addEventListener('click', () => this.active && this.reset(this.active));
    this.valueEl = h('span', 'it-value');
    right.append(this.toolResetBtn, this.valueEl);
    head.append(this.panelName, right);
    this.range = h('input', 'it-range');
    this.range.type = 'range';
    this.range.step = '1';
    this.range.addEventListener('input', () => {
      if (!this.active) return;
      this.values[this.active] = Number(this.range.value);
      this.paintRange();
      this.valueEl.textContent = this.fmt(this.values[this.active]);
      this.toolResetBtn.disabled = this.values[this.active] === 0;
      this.refreshTools();
      this.schedule();
      this.opts.onChange?.(this.getValues(), this.active);
    });
    this.range.addEventListener('dblclick', () => this.active && this.reset(this.active));
    const scale = h('div', 'it-scale');
    this.scaleMin = h('span');
    this.scaleMax = h('span');
    scale.append(this.scaleMin, this.scaleMax);
    this.panel.append(head, this.range, scale);
    this.root.appendChild(this.panel);

    // tool bar
    this.toolbar = h('div', 'it-tools');
    for (const t of this.enabled) {
      const b = h('button', 'it-tool', `<span class="it-tool-ic">${TOOL_ICONS[t.name]}</span><span class="it-tool-label"></span>`);
      b.type = 'button';
      (b.querySelector('.it-tool-label') as HTMLElement).textContent = t.label;
      b.setAttribute('aria-label', t.label);
      b.addEventListener('click', () => {
        this.selectTool(t.name);
        b.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
      this.toolBtns.set(t.name, b);
      this.toolbar.appendChild(b);
    }
    this.root.appendChild(this.toolbar);
    // mouse wheel scrolls the tool row sideways on desktop
    this.toolbar.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && this.toolbar.scrollWidth > this.toolbar.clientWidth) {
        this.toolbar.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });

    if (!this.enabled.length) {
      this.panel.style.display = 'none';
      this.toolbar.style.display = 'none';
    }
    // centre the row when every tool fits
    requestAnimationFrame(() => {
      this.toolbar.classList.toggle('it-center', this.toolbar.scrollWidth <= this.toolbar.clientWidth);
    });

    this.refreshPanel();
    this.refreshTools();
    this.syncHeader();
  }

  private def(tool: ToolName): ToolDef {
    return this.enabled.find((t) => t.name === tool)!;
  }

  private fmt(v: number): string {
    return v > 0 ? `+${v}` : String(v);
  }

  private refreshPanel(): void {
    if (!this.active) return;
    const d = this.def(this.active);
    const v = this.values[this.active];
    this.panelName.textContent = d.label;
    this.range.min = String(d.min);
    this.range.max = String(d.max);
    this.range.value = String(v);
    this.range.setAttribute('aria-label', d.label);
    this.valueEl.textContent = this.fmt(v);
    this.toolResetBtn.disabled = v === 0;
    this.scaleMin.textContent = String(d.min);
    this.scaleMax.textContent = d.max > 0 ? `+${d.max}` : String(d.max);
    this.paintRange();
  }

  /** Fill the track from the zero point to the thumb (centre-out for ± tools). */
  private paintRange(): void {
    const min = Number(this.range.min), max = Number(this.range.max), val = Number(this.range.value);
    const pct = (x: number) => ((x - min) / (max - min)) * 100;
    const zero = pct(Math.max(min, Math.min(max, 0)));
    const p = pct(val);
    const a = Math.min(zero, p), b = Math.max(zero, p);
    this.range.style.setProperty(
      '--it-fill',
      `linear-gradient(to right,var(--it-track) ${a}%,var(--it-accent) ${a}%,var(--it-accent) ${b}%,var(--it-track) ${b}%)`,
    );
  }

  private refreshTools(): void {
    for (const [name, b] of this.toolBtns) {
      b.classList.toggle('it-active', name === this.active);
      b.classList.toggle('it-changed', this.values[name] !== 0);
      b.setAttribute('aria-pressed', String(name === this.active));
    }
    const dirty = this.enabled.some((t) => this.values[t.name] !== 0);
    if (this.headerBtns.reset) this.headerBtns.reset.disabled = !dirty || !this.image;
  }

  private syncHeader(): void {
    const has = !!this.image;
    if (this.headerBtns.compare) this.headerBtns.compare.disabled = !has;
    if (this.headerBtns.download) this.headerBtns.download.disabled = !has;
    this.refreshTools();
  }

  private preparePreview(): void {
    const img = this.image!;
    const max = this.opts.previewSize ?? 1600;
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * s));
    const hgt = Math.max(1, Math.round(img.height * s));
    this.canvas.width = w;
    this.canvas.height = hgt;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.clearRect(0, 0, w, hgt);
    this.ctx.drawImage(img, 0, 0, w, hgt);
    this.original = this.ctx.getImageData(0, 0, w, hgt);
    this.output = this.ctx.createImageData(w, hgt);
    this.canvas.style.display = 'block';
    this.empty.style.display = 'none';
    this.fit();
    this.render();
  }

  /** Contain-fit: keeps the exact aspect ratio, never stretches. */
  private fit(): void {
    if (!this.image) return;
    const cs = getComputedStyle(this.stage);
    const cw = this.stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ch = this.stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (cw <= 0 || ch <= 0) return;
    const { width: iw, height: ih } = this.image;
    let scale = Math.min(cw / iw, ch / ih);
    if (!this.opts.upscale) scale = Math.min(scale, 1);
    const w = Math.floor(iw * scale);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${Math.round((w * ih) / iw)}px`;
  }

  private setCompare(on: boolean): void {
    if (!this.image || this.comparing === on) return;
    this.comparing = on;
    this.headerBtns.compare?.classList.toggle('it-pressed', on);
    this.badge.classList.toggle('it-show', on);
    this.render();
  }

  private schedule(): void {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.render();
    });
  }

  private render(): void {
    if (!this.original || !this.output) return;
    if (this.comparing) {
      this.ctx.putImageData(this.original, 0, 0);
      return;
    }
    processPixels(this.original.data, this.output.data, this.canvas.width, this.canvas.height, this.effectiveValues());
    this.ctx.putImageData(this.output, 0, 0);
  }
}

/** Shorthand: `createImageStudio('#editor', { src })` */
export function createImageStudio(target: string | HTMLElement, options?: ImageStudioOptions): ImageStudio {
  return new ImageStudio(target, options);
}

export default ImageStudio;
